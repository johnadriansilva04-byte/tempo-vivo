-- ============================================================================
-- Perfil Vivo — Migration: motor de execução de projetos por fases sequenciais
--
-- Substitui o modelo antigo de "projeto = lista de tarefas editáveis" por um
-- motor com trajetória, bloqueios e histórico inviolável:
--
--   projects ──▶ project_phases (sequência)  ──▶ phase_completion_records (congelado)
--            └─▶ missions (ativas/substituídas) ─▶ mission_completion_records (congelado)
--                                              └─▶ mission_versions (rascunho versionado)
--                                              └─▶ mission_dependencies
--            └─▶ phase_attachments (metadados; arquivos no Storage)
--            └─▶ project_events (auditoria append-only)
--
-- Regras garantidas NO BANCO (não só na UI):
--   • fase/missão concluída não pode ser editada nem apagada;
--   • registro de conclusão, versão e evento são imutáveis (UPDATE/DELETE barrados);
--   • missão substituída nunca reaparece como ativa e preserva o vínculo;
--   • concluir fase + congelar + registrar evento + desbloquear a próxima é uma
--     única transação (RPC), então não existe estado parcial inconsistente.
--
-- Idempotente. Rodar após 20260928000000_public_identity_schedule_family.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- Helper de acesso: o dono autenticado OU o usuário singleton (modo local).
-- Com Supabase Auth ativo, cada usuário só enxerga as próprias linhas; sem
-- sessão, só o registro singleton de fallback é acessível.
-- ============================================================================
create or replace function public.can_access_owner(p_user_id uuid)
returns boolean
language sql
stable
as $$
  -- Com sessão: apenas as próprias linhas. Sem sessão (modo local/dev): apenas
  -- o usuário singleton. Assim um usuário autenticado nunca lê dados de outro.
  select p_user_id = auth.uid()
      or (auth.uid() is null and p_user_id = '00000000-0000-0000-0000-000000000001'::uuid);
$$;

grant execute on function public.can_access_owner(uuid) to anon, authenticated, service_role;

-- Verifica se o projeto pertence a quem está chamando. `security definer` para
-- ler `projects` sem depender da RLS dela e poder ser usada com segurança nas
-- políticas de tabelas filhas (que só têm `user_id`, mas não o dono do projeto).
create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and public.can_access_owner(p.user_id)
  );
$$;

grant execute on function public.can_access_project(uuid) to anon, authenticated, service_role;

-- ============================================================================
-- projects (evolução): resumo inicial imutável + contexto atual evolutivo.
-- O resumo registra a trajetória anterior; o contexto pode ser atualizado
-- (nova versão registrada em project_events), sem reescrever o resumo.
-- ============================================================================
alter table public.projects add column if not exists initial_summary text not null default '';
alter table public.projects add column if not exists current_context text not null default '';

-- ============================================================================
-- project_phases — as fases sequenciais de um projeto
-- ============================================================================
create table if not exists public.project_phases (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  position       integer not null default 1 check (position >= 1),
  title          text not null,
  objective      text not null default '',
  description    text not null default '',
  instructions   text not null default '',
  criteria       text not null default '',
  subtasks       jsonb not null default '[]'::jsonb,
  executed_text  text not null default '',
  result_text    text not null default '',
  observations   text not null default '',
  next_step      text not null default '',
  status         text not null default 'bloqueada'
                 check (status in ('bloqueada','disponivel','em_andamento','concluida','complementada')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz,
  -- DEFERRABLE: inserir uma fase no meio desloca as seguintes com
  -- `position = position + 1`, o que colide momentaneamente com o índice único.
  -- Adiando a checagem para o fim da transação, o deslocamento em bloco passa a
  -- ser atômico e válido.
  constraint project_phases_position_unique
    unique (project_id, position) deferrable initially immediate
);

create index if not exists project_phases_project_idx on public.project_phases (project_id, position);
create index if not exists project_phases_user_idx on public.project_phases (user_id);

-- ============================================================================
-- missions — tarefas adicionais, correções e alternativas de estratégia
-- ============================================================================
create table if not exists public.missions (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  phase_id            uuid references public.project_phases(id) on delete set null,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  title               text not null,
  description         text not null default '',
  context             text not null default '',
  objective           text not null default '',
  position            integer not null default 0,
  status              text not null default 'disponivel'
                      check (status in ('bloqueada','disponivel','em_andamento','concluida','substituida','pausada','cancelada')),
  replaces_mission_id uuid references public.missions(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

create index if not exists missions_project_idx on public.missions (project_id, position, created_at);
create index if not exists missions_phase_idx on public.missions (phase_id);
create index if not exists missions_replaces_idx on public.missions (replaces_mission_id);
create index if not exists missions_user_idx on public.missions (user_id);

-- ============================================================================
-- mission_dependencies — bloqueio explícito entre missões
-- ============================================================================
create table if not exists public.mission_dependencies (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  mission_id          uuid not null references public.missions(id) on delete cascade,
  depends_on_mission_id uuid not null references public.missions(id) on delete cascade,
  created_at          timestamptz not null default now(),
  check (mission_id <> depends_on_mission_id),
  unique (mission_id, depends_on_mission_id)
);

create index if not exists mission_dependencies_mission_idx on public.mission_dependencies (mission_id);
create index if not exists mission_dependencies_project_idx on public.mission_dependencies (project_id);

-- ============================================================================
-- mission_versions — versionamento explícito de missão em andamento
-- ============================================================================
create table if not exists public.mission_versions (
  id                uuid primary key default gen_random_uuid(),
  mission_id        uuid not null references public.missions(id) on delete cascade,
  version_number    integer not null check (version_number >= 1),
  complete_snapshot jsonb not null,
  change_reason     text not null default '',
  created_at        timestamptz not null default now(),
  created_by        uuid references public.profiles(id) on delete set null,
  unique (mission_id, version_number)
);

create index if not exists mission_versions_mission_idx on public.mission_versions (mission_id, version_number);

-- ============================================================================
-- phase_completion_records — registro congelado ao concluir uma fase
-- ============================================================================
create table if not exists public.phase_completion_records (
  id             uuid primary key default gen_random_uuid(),
  phase_id       uuid not null unique references public.project_phases(id) on delete restrict,
  project_id     uuid not null references public.projects(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  final_snapshot jsonb not null,
  completed_at   timestamptz not null default now(),
  completed_by   uuid references public.profiles(id) on delete set null
);

create index if not exists phase_completion_project_idx on public.phase_completion_records (project_id);
create index if not exists phase_completion_user_idx on public.phase_completion_records (user_id);

-- ============================================================================
-- mission_completion_records — registro congelado ao concluir uma missão
-- ============================================================================
create table if not exists public.mission_completion_records (
  id             uuid primary key default gen_random_uuid(),
  mission_id     uuid not null unique references public.missions(id) on delete restrict,
  project_id     uuid not null references public.projects(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  final_snapshot jsonb not null,
  completed_at   timestamptz not null default now(),
  completed_by   uuid references public.profiles(id) on delete set null
);

create index if not exists mission_completion_project_idx on public.mission_completion_records (project_id);
create index if not exists mission_completion_user_idx on public.mission_completion_records (user_id);

-- ============================================================================
-- mission_complements — correção posterior, sem tocar no registro original
-- ============================================================================
create table if not exists public.mission_complements (
  id             uuid primary key default gen_random_uuid(),
  mission_id     uuid not null references public.missions(id) on delete cascade,
  project_id     uuid not null references public.projects(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  reason         text not null default '',
  content        text not null,
  created_at     timestamptz not null default now(),
  created_by     uuid references public.profiles(id) on delete set null
);

create index if not exists mission_complements_mission_idx on public.mission_complements (mission_id, created_at);

-- ============================================================================
-- phase_attachments — metadados de documentos (arquivos no Storage)
-- ============================================================================
create table if not exists public.phase_attachments (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  phase_id          uuid references public.project_phases(id) on delete cascade,
  mission_id        uuid references public.missions(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  file_name         text not null,
  storage_path      text not null default '',
  mime_type         text not null default '',
  size_bytes        bigint not null default 0,
  label             text not null default '',
  kind              text not null default 'planejada' check (kind in ('planejada','final')),
  replaces_attachment_id uuid references public.phase_attachments(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists phase_attachments_phase_idx on public.phase_attachments (phase_id);
create index if not exists phase_attachments_mission_idx on public.phase_attachments (mission_id);
create index if not exists phase_attachments_project_idx on public.phase_attachments (project_id);

-- ============================================================================
-- project_events — histórico cronológico append-only (auditoria)
-- ============================================================================
create table if not exists public.project_events (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  mission_id  uuid references public.missions(id) on delete set null,
  phase_id    uuid references public.project_phases(id) on delete set null,
  event_type  text not null,
  description text not null default '',
  event_data  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists project_events_project_idx on public.project_events (project_id, created_at);
create index if not exists project_events_user_idx on public.project_events (user_id);

-- ============================================================================
-- updated_at (reaproveita public.set_updated_at da migration 3)
-- ============================================================================
drop trigger if exists trg_project_phases_updated_at on public.project_phases;
create trigger trg_project_phases_updated_at before update on public.project_phases
  for each row execute function public.set_updated_at();
drop trigger if exists trg_missions_updated_at on public.missions;
create trigger trg_missions_updated_at before update on public.missions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- IMUTABILIDADE — registros congelados e histórico nunca reescritos
-- ============================================================================

-- Registros de conclusão e complementos: nunca UPDATE, nunca DELETE.
create or replace function public.enforce_frozen_record()
returns trigger
language plpgsql
as $$
begin
  raise exception 'registro histórico de % é imutável e não pode ser alterado nem apagado (operação %)',
    tg_table_name, tg_op
    using errcode = 'P0001';
end;
$$;

drop trigger if exists frozen_phase_completion on public.phase_completion_records;
create trigger frozen_phase_completion
  before update or delete on public.phase_completion_records
  for each row execute function public.enforce_frozen_record();

drop trigger if exists frozen_mission_completion on public.mission_completion_records;
create trigger frozen_mission_completion
  before update or delete on public.mission_completion_records
  for each row execute function public.enforce_frozen_record();

drop trigger if exists frozen_mission_versions on public.mission_versions;
create trigger frozen_mission_versions
  before update or delete on public.mission_versions
  for each row execute function public.enforce_frozen_record();

drop trigger if exists frozen_mission_complements on public.mission_complements;
create trigger frozen_mission_complements
  before update or delete on public.mission_complements
  for each row execute function public.enforce_frozen_record();

drop trigger if exists frozen_project_events on public.project_events;
create trigger frozen_project_events
  before update or delete on public.project_events
  for each row execute function public.enforce_frozen_record();

-- Fases: sequência e imutabilidade da fase concluída.
create or replace function public.enforce_phase_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'concluida' then
      raise exception 'fase concluída % é imutável e não pode ser apagada', old.id using errcode = 'P0001';
    end if;
    if exists (select 1 from public.phase_completion_records r where r.phase_id = old.id) then
      raise exception 'fase % tem registro de conclusão e não pode ser apagada', old.id using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE
  if old.status = 'concluida' then
    if new.status is distinct from old.status and new.status <> 'complementada' then
      raise exception 'fase concluída % não pode voltar a outro estado', old.id using errcode = 'P0001';
    end if;
    if new.title is distinct from old.title
       or new.objective is distinct from old.objective
       or new.description is distinct from old.description
       or new.instructions is distinct from old.instructions
       or new.criteria is distinct from old.criteria
       or new.subtasks is distinct from old.subtasks
       or new.executed_text is distinct from old.executed_text
       or new.result_text is distinct from old.result_text
       or new.observations is distinct from old.observations
       or new.next_step is distinct from old.next_step
       or new.position is distinct from old.position
    then
      raise exception 'fase concluída % é um registro protegido: o conteúdo não pode ser editado', old.id using errcode = 'P0001';
    end if;
  end if;

  if old.status = 'bloqueada' and new.status in ('em_andamento','concluida') then
    raise exception 'fase % está bloqueada — conclua a fase anterior primeiro', old.id using errcode = 'P0001';
  end if;

  if new.project_id is distinct from old.project_id then
    raise exception 'a fase % não pode mudar de projeto', old.id using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_project_phases on public.project_phases;
create trigger guard_project_phases
  before update or delete on public.project_phases
  for each row execute function public.enforce_phase_guard();

-- Missões: imutabilidade da concluída/substituída + vínculo de substituição.
create or replace function public.enforce_mission_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status in ('concluida','substituida') then
      raise exception 'missão % está no histórico e não pode ser apagada', old.id using errcode = 'P0001';
    end if;
    if exists (select 1 from public.mission_completion_records r where r.mission_id = old.id) then
      raise exception 'missão % tem registro de conclusão e não pode ser apagada', old.id using errcode = 'P0001';
    end if;
    if exists (select 1 from public.missions m where m.replaces_mission_id = old.id) then
      raise exception 'missão % tem substituta vinculada e não pode ser apagada', old.id using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE
  if old.status = 'concluida' then
    if new.status is distinct from old.status and new.status <> 'complementada' then
      raise exception 'missão concluída % é um registro protegido e não pode ser reaberta', old.id using errcode = 'P0001';
    end if;
    if new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.context is distinct from old.context
       or new.objective is distinct from old.objective
       or new.position is distinct from old.position
    then
      raise exception 'missão concluída % é imutável: o conteúdo não pode ser editado', old.id using errcode = 'P0001';
    end if;
  end if;

  if old.status = 'substituida' then
    if new.status is distinct from old.status then
      raise exception 'missão substituída % permanece no histórico', old.id using errcode = 'P0001';
    end if;
    if new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.context is distinct from old.context
       or new.objective is distinct from old.objective
    then
      raise exception 'missão substituída % é imutável', old.id using errcode = 'P0001';
    end if;
  end if;

  if new.project_id is distinct from old.project_id then
    raise exception 'a missão % não pode mudar de projeto', old.id using errcode = 'P0001';
  end if;

  if old.replaces_mission_id is not null
     and new.replaces_mission_id is distinct from old.replaces_mission_id then
    raise exception 'o vínculo de substituição da missão % é imutável', old.id using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_missions on public.missions;
create trigger guard_missions
  before update or delete on public.missions
  for each row execute function public.enforce_mission_guard();

-- Anexos: depois de integrarem um registro de conclusão, ficam congelados.
create or replace function public.enforce_attachment_guard()
returns trigger
language plpgsql
as $$
declare
  v_frozen boolean := false;
begin
  if old.kind = 'final' then
    v_frozen := true;
  end if;
  if old.phase_id is not null
     and exists (select 1 from public.phase_completion_records r where r.phase_id = old.phase_id) then
    v_frozen := true;
  end if;
  if old.mission_id is not null
     and exists (select 1 from public.mission_completion_records r where r.mission_id = old.mission_id) then
    v_frozen := true;
  end if;

  if not v_frozen then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'anexo % faz parte de um registro de conclusão e não pode ser removido', old.id using errcode = 'P0001';
  end if;

  if new.file_name is distinct from old.file_name
     or new.storage_path is distinct from old.storage_path
     or new.mime_type is distinct from old.mime_type
     or new.size_bytes is distinct from old.size_bytes
     or new.phase_id is distinct from old.phase_id
     or new.mission_id is distinct from old.mission_id
     or new.kind is distinct from old.kind
  then
    raise exception 'anexo % está congelado em um registro de conclusão', old.id using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_phase_attachments on public.phase_attachments;
create trigger guard_phase_attachments
  before update or delete on public.phase_attachments
  for each row execute function public.enforce_attachment_guard();

-- Projetos: não apagar um projeto que já tem histórico congelado.
create or replace function public.enforce_project_guard()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.phase_completion_records r where r.project_id = old.id)
     or exists (select 1 from public.mission_completion_records r where r.project_id = old.id) then
    raise exception 'projeto % tem registros de conclusão e não pode ser apagado', old.id using errcode = 'P0001';
  end if;
  return old;
end;
$$;

drop trigger if exists guard_projects on public.projects;
create trigger guard_projects
  before delete on public.projects
  for each row execute function public.enforce_project_guard();

-- Resumo inicial: preservado como registro histórico. Atualizações de contexto
-- passam por update_project_context (nova versão), nunca por reescrita do resumo.
create or replace function public.enforce_project_summary_guard()
returns trigger
language plpgsql
as $$
begin
  if old.initial_summary is distinct from new.initial_summary then
    raise exception 'o resumo inicial é um registro histórico e não pode ser reescrito — registre um novo contexto'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_project_summary on public.projects;
create trigger guard_project_summary
  before update on public.projects
  for each row execute function public.enforce_project_summary_guard();

-- Dependências entre missões: sem auto-dependência nem ciclo.
create or replace function public.check_mission_dependency_cycle()
returns trigger
language plpgsql
as $$
declare
  v_cycle boolean;
begin
  if new.mission_id = new.depends_on_mission_id then
    raise exception 'uma missão não pode depender de si mesma' using errcode = 'P0001';
  end if;

  with recursive dep(mid) as (
    select new.depends_on_mission_id
    union
    select d.depends_on_mission_id
      from public.mission_dependencies d
      join dep on d.mission_id = dep.mid
  )
  select exists (select 1 from dep where mid = new.mission_id) into v_cycle;

  if v_cycle then
    raise exception 'dependência cíclica entre missões' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_mission_dependencies on public.mission_dependencies;
create trigger guard_mission_dependencies
  before insert on public.mission_dependencies
  for each row execute function public.check_mission_dependency_cycle();

-- ============================================================================
-- RLS — cada usuário só acessa os próprios projetos e registros
-- ============================================================================
-- `projects` já existia com uma policy permissiva ("projects all" using true)
-- herdada da migration 1, que a migration 2 não removeu — deixando todo usuário
-- enxergar todo projeto. Aqui ela é substituída por acesso restrito ao dono.
drop policy if exists "projects all" on public.projects;
drop policy if exists "projects read" on public.projects;
create policy "projects read" on public.projects
  for select using (public.can_access_owner(user_id));
drop policy if exists "projects write" on public.projects;
create policy "projects write" on public.projects
  for all using (public.can_access_owner(user_id)) with check (public.can_access_owner(user_id));

alter table public.project_phases           enable row level security;
alter table public.missions                 enable row level security;
alter table public.mission_dependencies     enable row level security;
alter table public.mission_versions         enable row level security;
alter table public.phase_completion_records enable row level security;
alter table public.mission_completion_records enable row level security;
alter table public.mission_complements      enable row level security;
alter table public.phase_attachments        enable row level security;
alter table public.project_events           enable row level security;

-- Todas as tabelas filhas exigem, além de o `user_id` ser o do chamador, que o
-- projeto referenciado seja dele. Sem isso, um usuário autenticado poderia
-- inserir linhas em nome próprio dentro do projeto de outra pessoa.

-- project_phases
drop policy if exists "project_phases owner" on public.project_phases;
create policy "project_phases owner" on public.project_phases
  for all
  using (public.can_access_owner(user_id) and public.can_access_project(project_id))
  with check (public.can_access_owner(user_id) and public.can_access_project(project_id));

-- missions
drop policy if exists "missions owner" on public.missions;
create policy "missions owner" on public.missions
  for all
  using (public.can_access_owner(user_id) and public.can_access_project(project_id))
  with check (public.can_access_owner(user_id) and public.can_access_project(project_id));

-- mission_dependencies
drop policy if exists "mission_dependencies owner" on public.mission_dependencies;
create policy "mission_dependencies owner" on public.mission_dependencies
  for all
  using (public.can_access_project(project_id))
  with check (public.can_access_project(project_id));

-- mission_versions (insert/select apenas — imutável por trigger)
drop policy if exists "mission_versions owner" on public.mission_versions;
create policy "mission_versions owner" on public.mission_versions
  for all
  using (public.can_access_owner(
      (select m.user_id from public.missions m where m.id = mission_id)
    ))
  with check (public.can_access_owner(
      (select m.user_id from public.missions m where m.id = mission_id)
    ));

-- phase_completion_records (insert/select apenas)
drop policy if exists "phase_completion owner" on public.phase_completion_records;
create policy "phase_completion owner" on public.phase_completion_records
  for all
  using (public.can_access_owner(user_id) and public.can_access_project(project_id))
  with check (public.can_access_owner(user_id) and public.can_access_project(project_id));

-- mission_completion_records (insert/select apenas)
drop policy if exists "mission_completion owner" on public.mission_completion_records;
create policy "mission_completion owner" on public.mission_completion_records
  for all
  using (public.can_access_owner(user_id) and public.can_access_project(project_id))
  with check (public.can_access_owner(user_id) and public.can_access_project(project_id));

-- mission_complements
drop policy if exists "mission_complements owner" on public.mission_complements;
create policy "mission_complements owner" on public.mission_complements
  for all
  using (public.can_access_owner(user_id) and public.can_access_project(project_id))
  with check (public.can_access_owner(user_id) and public.can_access_project(project_id));

-- phase_attachments
drop policy if exists "phase_attachments owner" on public.phase_attachments;
create policy "phase_attachments owner" on public.phase_attachments
  for all
  using (public.can_access_owner(user_id) and public.can_access_project(project_id))
  with check (public.can_access_owner(user_id) and public.can_access_project(project_id));

-- project_events (append-only: insert/select)
drop policy if exists "project_events owner" on public.project_events;
create policy "project_events owner" on public.project_events
  for all
  using (public.can_access_owner(user_id) and public.can_access_project(project_id))
  with check (public.can_access_owner(user_id) and public.can_access_project(project_id));

-- ============================================================================
-- Storage: bucket privado de anexos, escopo por pasta do dono
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('project-attachments', 'project-attachments', false)
on conflict (id) do nothing;

drop policy if exists "project attachments read" on storage.objects;
create policy "project attachments read" on storage.objects
  for select using (
    bucket_id = 'project-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
    )
  );

drop policy if exists "project attachments insert" on storage.objects;
create policy "project attachments insert" on storage.objects
  for insert with check (
    bucket_id = 'project-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
    )
  );

drop policy if exists "project attachments delete" on storage.objects;
create policy "project attachments delete" on storage.objects
  for delete using (
    bucket_id = 'project-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
    )
  );

-- ============================================================================
-- log_project_event — helper interno de auditoria
-- ============================================================================
create or replace function public.log_project_event(
  p_project_id uuid,
  p_user_id    uuid,
  p_event_type text,
  p_description text,
  p_event_data jsonb default '{}'::jsonb,
  p_phase_id   uuid default null,
  p_mission_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.project_events (project_id, user_id, event_type, description, event_data, phase_id, mission_id)
  values (p_project_id, p_user_id, p_event_type, coalesce(p_description,''), coalesce(p_event_data,'{}'::jsonb), p_phase_id, p_mission_id)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.log_project_event(uuid, uuid, text, text, jsonb, uuid, uuid) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: create_project — projeto + resumo inicial + eventos, numa transação
-- ============================================================================
create or replace function public.create_project(
  p_name            text,
  p_objective       text default '',
  p_initial_summary text default '',
  p_context         text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_owner uuid;
begin
  v_owner := coalesce(auth.uid(), '00000000-0000-0000-0000-000000000001'::uuid);
  if coalesce(trim(p_name),'') = '' then
    raise exception 'o projeto precisa de um nome' using errcode = 'P0001';
  end if;

  insert into public.projects (user_id, name, objective, initial_summary, current_context)
  values (v_owner, trim(p_name), coalesce(p_objective,''), coalesce(p_initial_summary,''), coalesce(p_context,''))
  returning id into v_id;

  perform public.log_project_event(v_id, v_owner, 'projeto_criado', 'Projeto criado', jsonb_build_object('name', p_name));
  if coalesce(trim(p_initial_summary),'') <> '' then
    perform public.log_project_event(v_id, v_owner, 'resumo_registrado', 'Resumo inicial registrado',
      jsonb_build_object('initial_summary', p_initial_summary));
  end if;
  return v_id;
end;
$$;

grant execute on function public.create_project(text, text, text, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: update_project_context — nunca reescreve o resumo inicial
-- ============================================================================
create or replace function public.update_project_context(
  p_project_id uuid,
  p_context    text,
  p_reason     text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid;
begin
  select user_id into v_owner from public.projects where id = p_project_id;
  if v_owner is null then raise exception 'projeto não encontrado' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_owner) then raise exception 'sem permissão' using errcode = '42501'; end if;

  update public.projects set current_context = coalesce(p_context,''), updated_at = now() where id = p_project_id;
  perform public.log_project_event(p_project_id, v_owner, 'contexto_atualizado', 'Contexto atualizado',
    jsonb_build_object('context', p_context, 'reason', p_reason));
end;
$$;

grant execute on function public.update_project_context(uuid, text, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: create_phase — nunca insere antes de fase concluída (histórico intacto)
-- ============================================================================
create or replace function public.create_phase(
  p_project_id   uuid,
  p_title        text,
  p_objective    text default '',
  p_description  text default '',
  p_instructions text default '',
  p_criteria     text default '',
  p_position     integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_max integer;
  v_last_completed integer;
  v_pos integer;
  v_status text;
  v_id uuid;
  v_pending integer;
begin
  select user_id into v_owner from public.projects where id = p_project_id;
  if v_owner is null then raise exception 'projeto não encontrado' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_owner) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if coalesce(trim(p_title),'') = '' then raise exception 'a fase precisa de um título' using errcode = 'P0001'; end if;

  select coalesce(max(position),0) into v_max from public.project_phases where project_id = p_project_id;
  select coalesce(max(position),0) into v_last_completed
    from public.project_phases where project_id = p_project_id and status = 'concluida';

  if p_position is null or p_position > v_max then
    v_pos := v_max + 1;
  else
    if p_position <= v_last_completed then
      raise exception 'não é possível inserir uma fase antes de fases já concluídas: isso reescreveria o histórico'
        using errcode = 'P0001';
    end if;
    v_pos := greatest(p_position, 1);
    -- desloca as fases seguintes; a unicidade de (project_id, position) é
    -- verificada só no fim da transação para o deslocamento em bloco ser válido
    set constraints public.project_phases_position_unique deferred;
    update public.project_phases set position = position + 1
      where project_id = p_project_id and position >= v_pos;
  end if;

  select count(*) into v_pending from public.project_phases
    where project_id = p_project_id and position < v_pos and status <> 'concluida';
  v_status := case when v_pending = 0 then 'disponivel' else 'bloqueada' end;

  insert into public.project_phases
    (project_id, user_id, position, title, objective, description, instructions, criteria, status)
  values
    (p_project_id, v_owner, v_pos, trim(p_title), coalesce(p_objective,''), coalesce(p_description,''),
     coalesce(p_instructions,''), coalesce(p_criteria,''), v_status)
  returning id into v_id;

  perform public.log_project_event(p_project_id, v_owner, 'fase_adicionada',
    'Fase ' || v_pos || ' — ' || trim(p_title) || ' adicionada',
    jsonb_build_object('position', v_pos, 'title', p_title, 'status', v_status), v_id);
  return v_id;
end;
$$;

grant execute on function public.create_phase(uuid, text, text, text, text, text, integer) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: start_phase — só uma fase disponível pode começar
-- ============================================================================
create or replace function public.start_phase(p_phase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phase public.project_phases;
  v_prev public.project_phases;
begin
  select * into v_phase from public.project_phases where id = p_phase_id for update;
  if not found then raise exception 'fase não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_phase.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_phase.status = 'concluida' then raise exception 'fase já concluída' using errcode = 'P0001'; end if;
  if v_phase.status = 'bloqueada' then
    raise exception 'fase bloqueada — conclua a fase anterior primeiro' using errcode = 'P0001';
  end if;

  select * into v_prev from public.project_phases
    where project_id = v_phase.project_id and position < v_phase.position
    order by position desc limit 1;
  if found and v_prev.status <> 'concluida' then
    raise exception 'conclua a fase anterior primeiro' using errcode = 'P0001';
  end if;

  update public.project_phases set status = 'em_andamento' where id = p_phase_id;
  perform public.log_project_event(v_phase.project_id, v_phase.user_id, 'fase_iniciada',
    'Fase ' || v_phase.position || ' iniciada', jsonb_build_object('position', v_phase.position), p_phase_id);
end;
$$;

grant execute on function public.start_phase(uuid) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: update_phase — planejamento livre enquanto a fase não foi concluída
-- ============================================================================
create or replace function public.update_phase(
  p_phase_id     uuid,
  p_title        text,
  p_objective    text default '',
  p_description  text default '',
  p_instructions text default '',
  p_criteria     text default '',
  p_subtasks     jsonb default '[]'::jsonb,
  p_executed     text default '',
  p_result       text default '',
  p_observations text default '',
  p_next_step    text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_phase public.project_phases;
begin
  select * into v_phase from public.project_phases where id = p_phase_id for update;
  if not found then raise exception 'fase não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_phase.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_phase.status = 'concluida' then
    raise exception 'fase concluída é um registro protegido e não pode ser editada' using errcode = 'P0001';
  end if;
  if v_phase.status = 'bloqueada' then
    raise exception 'fase bloqueada — não é possível editar ainda' using errcode = 'P0001';
  end if;

  update public.project_phases set
    title = coalesce(nullif(trim(p_title),''), title),
    objective = coalesce(p_objective,''),
    description = coalesce(p_description,''),
    instructions = coalesce(p_instructions,''),
    criteria = coalesce(p_criteria,''),
    subtasks = coalesce(p_subtasks,'[]'::jsonb),
    executed_text = coalesce(p_executed,''),
    result_text = coalesce(p_result,''),
    observations = coalesce(p_observations,''),
    next_step = coalesce(p_next_step,'')
  where id = p_phase_id;

  perform public.log_project_event(v_phase.project_id, v_phase.user_id, 'planejamento_alterado',
    'Planejamento da fase ' || v_phase.position || ' atualizado', '{}'::jsonb, p_phase_id);
end;
$$;

grant execute on function public.update_phase(uuid, text, text, text, text, text, jsonb, text, text, text, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: conclude_phase — congela o registro, registra o evento e desbloqueia a
-- próxima fase numa única transação. Falha parcial não deixa estado inconsistente.
-- ============================================================================
create or replace function public.conclude_phase(
  p_phase_id     uuid,
  p_executed     text default '',
  p_result       text default '',
  p_observations text default '',
  p_next_step    text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phase public.project_phases;
  v_prev public.project_phases;
  v_next public.project_phases;
  v_snapshot jsonb;
  v_record_id uuid;
begin
  select * into v_phase from public.project_phases where id = p_phase_id for update;
  if not found then raise exception 'fase não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_phase.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_phase.status = 'concluida' then raise exception 'fase já concluída' using errcode = 'P0001'; end if;
  if v_phase.status = 'bloqueada' then
    raise exception 'fase bloqueada — conclua a fase anterior primeiro' using errcode = 'P0001';
  end if;

  select * into v_prev from public.project_phases
    where project_id = v_phase.project_id and position < v_phase.position
    order by position desc limit 1;
  if found and v_prev.status <> 'concluida' then
    raise exception 'conclua a fase anterior primeiro' using errcode = 'P0001';
  end if;

  -- materializa o que foi efetivamente executado antes de congelar
  update public.project_phases set
    executed_text = coalesce(nullif(p_executed,''), executed_text),
    result_text = coalesce(nullif(p_result,''), result_text),
    observations = coalesce(nullif(p_observations,''), observations),
    next_step = coalesce(nullif(p_next_step,''), next_step)
  where id = p_phase_id
  returning * into v_phase;

  v_snapshot := jsonb_build_object(
    'phase_id', v_phase.id,
    'project_id', v_phase.project_id,
    'position', v_phase.position,
    'title', v_phase.title,
    'objective', v_phase.objective,
    'description', v_phase.description,
    'instructions', v_phase.instructions,
    'criteria', v_phase.criteria,
    'subtasks', v_phase.subtasks,
    'executed_text', v_phase.executed_text,
    'result_text', v_phase.result_text,
    'observations', v_phase.observations,
    'next_step', v_phase.next_step,
    'completed_at', now()
  );

  -- anexos do planejamento passam a integrar o registro congelado — antes de
  -- inserir o registro, senão o próprio guard os consideraria já congelados
  update public.phase_attachments set kind = 'final'
    where phase_id = p_phase_id and kind = 'planejada';

  insert into public.phase_completion_records (phase_id, project_id, user_id, final_snapshot, completed_by)
  values (p_phase_id, v_phase.project_id, v_phase.user_id, v_snapshot, v_phase.user_id)
  returning id into v_record_id;

  update public.project_phases set status = 'concluida' where id = p_phase_id;

  -- missões vinculadas a esta fase deixam de estar bloqueadas pela fase
  update public.missions set status = 'disponivel'
    where phase_id = p_phase_id and status = 'bloqueada';

  perform public.log_project_event(v_phase.project_id, v_phase.user_id, 'fase_concluida',
    'Fase ' || v_phase.position || ' — ' || v_phase.title || ' concluída e arquivada',
    jsonb_build_object('position', v_phase.position, 'record_id', v_record_id), p_phase_id);

  select * into v_next from public.project_phases
    where project_id = v_phase.project_id and position > v_phase.position
    order by position asc limit 1;
  if found and v_next.status = 'bloqueada' then
    update public.project_phases set status = 'disponivel' where id = v_next.id;
    perform public.log_project_event(v_phase.project_id, v_phase.user_id, 'fase_desbloqueada',
      'Fase ' || v_next.position || ' — ' || v_next.title || ' desbloqueada',
      jsonb_build_object('position', v_next.position), v_next.id);
  end if;

  return v_record_id;
end;
$$;

grant execute on function public.conclude_phase(uuid, text, text, text, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: delete_phase — só antes da conclusão; recompõe o encadeamento
-- ============================================================================
create or replace function public.delete_phase(p_phase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phase public.project_phases;
  v_row record;
  v_all_prev_done boolean;
  v_first_open_seen boolean := false;
begin
  select * into v_phase from public.project_phases where id = p_phase_id for update;
  if not found then raise exception 'fase não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_phase.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_phase.status = 'concluida' then raise exception 'fase concluída não pode ser apagada' using errcode = 'P0001'; end if;
  if exists (select 1 from public.phase_completion_records r where r.phase_id = p_phase_id) then
    raise exception 'fase tem registro de conclusão e não pode ser apagada' using errcode = 'P0001';
  end if;

  update public.missions set phase_id = null where phase_id = p_phase_id;
  delete from public.project_phases where id = p_phase_id;

  -- reencadeia: a primeira fase não concluída vira disponível, o resto bloqueia
  for v_row in
    select id, position, status from public.project_phases
    where project_id = v_phase.project_id order by position asc
  loop
    if v_row.status = 'concluida' then
      continue;
    end if;
    v_all_prev_done := not exists (
      select 1 from public.project_phases p
      where p.project_id = v_phase.project_id and p.position < v_row.position and p.status <> 'concluida'
    );
    if v_all_prev_done and not v_first_open_seen then
      if v_row.status not in ('em_andamento') then
        update public.project_phases set status = 'disponivel' where id = v_row.id;
      end if;
      v_first_open_seen := true;
    elsif v_row.status <> 'em_andamento' then
      update public.project_phases set status = 'bloqueada' where id = v_row.id;
    end if;
  end loop;

  perform public.log_project_event(v_phase.project_id, v_phase.user_id, 'fase_removida',
    'Fase ' || v_phase.position || ' removida', jsonb_build_object('position', v_phase.position));
end;
$$;

grant execute on function public.delete_phase(uuid) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: create_mission — missão adicional; pode substituir uma anterior
-- ============================================================================
create or replace function public.create_mission(
  p_project_id          uuid,
  p_title               text,
  p_description         text default '',
  p_context             text default '',
  p_objective           text default '',
  p_phase_id            uuid default null,
  p_replaces_mission_id uuid default null,
  p_reason              text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_pos integer;
  v_status text := 'disponivel';
  v_id uuid;
  v_original public.missions;
  v_phase_status text;
begin
  select user_id into v_owner from public.projects where id = p_project_id;
  if v_owner is null then raise exception 'projeto não encontrado' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_owner) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if coalesce(trim(p_title),'') = '' then raise exception 'a missão precisa de um título' using errcode = 'P0001'; end if;

  if p_phase_id is not null then
    select status into v_phase_status from public.project_phases where id = p_phase_id and project_id = p_project_id;
    if not found then raise exception 'fase da missão não pertence a este projeto' using errcode = 'P0001'; end if;
    -- uma missão só pode ser executada depois que a fase à qual pertence foi concluída
    v_status := case when v_phase_status = 'concluida' then 'disponivel' else 'bloqueada' end;
  end if;

  select coalesce(max(position),0) + 1 into v_pos from public.missions where project_id = p_project_id;

  insert into public.missions
    (project_id, phase_id, user_id, title, description, context, objective, position, status, replaces_mission_id)
  values
    (p_project_id, p_phase_id, v_owner, trim(p_title), coalesce(p_description,''), coalesce(p_context,''),
     coalesce(p_objective,''), v_pos, v_status, p_replaces_mission_id)
  returning id into v_id;

  -- versiona o conteúdo inicial da missão
  insert into public.mission_versions (mission_id, version_number, complete_snapshot, change_reason, created_by)
  values (v_id, 1, jsonb_build_object(
      'title', trim(p_title), 'description', coalesce(p_description,''),
      'context', coalesce(p_context,''), 'objective', coalesce(p_objective,''),
      'status', v_status, 'position', v_pos), 'criação', v_owner);

  perform public.log_project_event(p_project_id, v_owner, 'missao_criada',
    'Missão "' || trim(p_title) || '" criada',
    jsonb_build_object('position', v_pos, 'status', v_status), null, v_id);

  if p_replaces_mission_id is not null then
    select * into v_original from public.missions where id = p_replaces_mission_id for update;
    if not found then raise exception 'missão substituída não encontrada' using errcode = 'P0001'; end if;
    if v_original.project_id <> p_project_id then
      raise exception 'a missão substituída pertence a outro projeto' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.missions m where m.replaces_mission_id = p_replaces_mission_id and m.id <> v_id) then
      raise exception 'a missão já foi substituída' using errcode = 'P0001';
    end if;

    if v_original.status <> 'concluida' then
      update public.missions set status = 'substituida' where id = p_replaces_mission_id;
    end if;

    perform public.log_project_event(p_project_id, v_owner, 'missao_substituida',
      'Missão "' || v_original.title || '" substituída por "' || trim(p_title) || '"',
      jsonb_build_object('original_id', p_replaces_mission_id, 'original_title', v_original.title,
                         'replacement_id', v_id, 'reason', coalesce(p_reason,'')),
      null, p_replaces_mission_id);
  end if;

  return v_id;
end;
$$;

grant execute on function public.create_mission(uuid, text, text, text, text, uuid, uuid, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: update_mission — versiona antes de mudar (missão em andamento)
-- ============================================================================
create or replace function public.update_mission(
  p_mission_id  uuid,
  p_title       text,
  p_description text default '',
  p_context     text default '',
  p_objective   text default '',
  p_reason      text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission public.missions;
  v_next_version integer;
begin
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_mission.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_mission.status = 'concluida' then
    raise exception 'missão concluída é um registro protegido e não pode ser editada' using errcode = 'P0001';
  end if;
  if v_mission.status = 'substituida' then
    raise exception 'missão substituída permanece no histórico e não pode ser editada' using errcode = 'P0001';
  end if;

  update public.missions set
    title = coalesce(nullif(trim(p_title),''), title),
    description = coalesce(p_description,''),
    context = coalesce(p_context,''),
    objective = coalesce(p_objective,'')
  where id = p_mission_id
  returning * into v_mission;

  select coalesce(max(version_number),0) + 1 into v_next_version
    from public.mission_versions where mission_id = p_mission_id;

  insert into public.mission_versions (mission_id, version_number, complete_snapshot, change_reason, created_by)
  values (p_mission_id, v_next_version, jsonb_build_object(
      'title', v_mission.title, 'description', v_mission.description,
      'context', v_mission.context, 'objective', v_mission.objective,
      'status', v_mission.status, 'position', v_mission.position),
      coalesce(p_reason,''), v_mission.user_id);

  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'missao_alterada',
    'Missão "' || v_mission.title || '" alterada (versão ' || v_next_version || ')',
    jsonb_build_object('version', v_next_version, 'reason', coalesce(p_reason,'')), null, p_mission_id);
  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'nova_versao',
    'Nova versão da missão "' || v_mission.title || '" (v' || v_next_version || ')',
    jsonb_build_object('version', v_next_version), null, p_mission_id);
end;
$$;

grant execute on function public.update_mission(uuid, text, text, text, text, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPCs de ciclo de vida da missão — iniciar, pausar, retomar
--
-- Uma missão só executa quando não está bloqueada (fase/dependências
-- concluídas) nem substituída/concluída. A UI não pode contornar isso: a
-- checagem vive aqui, no banco.
-- ============================================================================
create or replace function public.start_mission(p_mission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission public.missions;
  v_phase_status text;
begin
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_mission.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_mission.status in ('concluida','substituida') then
    raise exception 'missão % está no histórico e não pode ser iniciada', p_mission_id using errcode = 'P0001';
  end if;
  if v_mission.status = 'em_andamento' then return; end if;

  if v_mission.phase_id is not null then
    select status into v_phase_status from public.project_phases where id = v_mission.phase_id;
    if v_phase_status is not null and v_phase_status <> 'concluida' then
      raise exception 'missão bloqueada — conclua a fase de origem primeiro' using errcode = 'P0001';
    end if;
  end if;
  if exists (
    select 1 from public.mission_dependencies d
    join public.missions m on m.id = d.depends_on_mission_id
    where d.mission_id = p_mission_id and m.status <> 'concluida'
  ) then
    raise exception 'há dependências não concluídas para esta missão' using errcode = 'P0001';
  end if;

  update public.missions set status = 'em_andamento' where id = p_mission_id;
  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'missao_iniciada',
    'Missão "' || v_mission.title || '" iniciada', '{}'::jsonb, null, p_mission_id);
end;
$$;

grant execute on function public.start_mission(uuid) to anon, authenticated, service_role;

create or replace function public.pause_mission(p_mission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_mission public.missions;
begin
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_mission.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_mission.status in ('concluida','substituida') then
    raise exception 'missão % está no histórico e não pode ser pausada', p_mission_id using errcode = 'P0001';
  end if;
  if v_mission.status = 'pausada' then return; end if;

  update public.missions set status = 'pausada' where id = p_mission_id;
  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'missao_pausada',
    'Missão "' || v_mission.title || '" pausada', '{}'::jsonb, null, p_mission_id);
end;
$$;

grant execute on function public.pause_mission(uuid) to anon, authenticated, service_role;

create or replace function public.resume_mission(p_mission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission public.missions;
  v_phase_status text;
begin
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_mission.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_mission.status in ('concluida','substituida') then
    raise exception 'missão % está no histórico e não pode ser retomada', p_mission_id using errcode = 'P0001';
  end if;

  if v_mission.phase_id is not null then
    select status into v_phase_status from public.project_phases where id = v_mission.phase_id;
    if v_phase_status is not null and v_phase_status <> 'concluida' then
      raise exception 'missão bloqueada — conclua a fase de origem primeiro' using errcode = 'P0001';
    end if;
  end if;
  if exists (
    select 1 from public.mission_dependencies d
    join public.missions m on m.id = d.depends_on_mission_id
    where d.mission_id = p_mission_id and m.status <> 'concluida'
  ) then
    raise exception 'há dependências não concluídas para esta missão' using errcode = 'P0001';
  end if;

  update public.missions set status = 'disponivel' where id = p_mission_id;
  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'missao_retomada',
    'Missão "' || v_mission.title || '" retomada', '{}'::jsonb, null, p_mission_id);
end;
$$;

grant execute on function public.resume_mission(uuid) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: substitute_mission — ação explícita "Substituir missão"
-- ============================================================================
create or replace function public.substitute_mission(
  p_mission_id  uuid,
  p_title       text,
  p_description text default '',
  p_context     text default '',
  p_objective   text default '',
  p_reason      text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original public.missions;
  v_new_id uuid;
begin
  select * into v_original from public.missions where id = p_mission_id for update;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_original.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if coalesce(trim(p_title),'') = '' then raise exception 'a nova missão precisa de um título' using errcode = 'P0001'; end if;

  v_new_id := public.create_mission(
    v_original.project_id, p_title, p_description, p_context, p_objective,
    v_original.phase_id, p_mission_id, p_reason);

  return v_new_id;
end;
$$;

grant execute on function public.substitute_mission(uuid, text, text, text, text, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: conclude_mission — congela o registro final (imutável)
-- ============================================================================
create or replace function public.conclude_mission(
  p_mission_id   uuid,
  p_summary      text default '',
  p_result       text default '',
  p_observations text default '',
  p_next_step    text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission public.missions;
  v_snapshot jsonb;
  v_record_id uuid;
begin
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_mission.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_mission.status = 'concluida' then raise exception 'missão já concluída' using errcode = 'P0001'; end if;
  if v_mission.status = 'substituida' then
    raise exception 'missão substituída não pode ser concluída — conclua a missão substituta' using errcode = 'P0001';
  end if;
  if v_mission.status = 'bloqueada' then
    raise exception 'missão bloqueada — conclua os requisitos primeiro' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.mission_dependencies d
    join public.missions m on m.id = d.depends_on_mission_id
    where d.mission_id = p_mission_id and m.status <> 'concluida'
  ) then
    raise exception 'há dependências não concluídas para esta missão' using errcode = 'P0001';
  end if;

  v_snapshot := jsonb_build_object(
    'mission_id', v_mission.id,
    'project_id', v_mission.project_id,
    'phase_id', v_mission.phase_id,
    'position', v_mission.position,
    'title', v_mission.title,
    'description', v_mission.description,
    'context', v_mission.context,
    'objective', v_mission.objective,
    'summary', coalesce(p_summary,''),
    'result', coalesce(p_result,''),
    'observations', coalesce(p_observations,''),
    'next_step', coalesce(p_next_step,''),
    'completed_at', now()
  );

  update public.phase_attachments set kind = 'final'
    where mission_id = p_mission_id and kind = 'planejada';

  insert into public.mission_completion_records (mission_id, project_id, user_id, final_snapshot, completed_by)
  values (p_mission_id, v_mission.project_id, v_mission.user_id, v_snapshot, v_mission.user_id)
  returning id into v_record_id;

  update public.missions set status = 'concluida' where id = p_mission_id;

  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'missao_concluida',
    'Missão "' || v_mission.title || '" concluída e arquivada',
    jsonb_build_object('record_id', v_record_id), null, p_mission_id);

  return v_record_id;
end;
$$;

grant execute on function public.conclude_mission(uuid, text, text, text, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: delete_mission — só rascunho; histórico nunca apagado
-- ============================================================================
create or replace function public.delete_mission(p_mission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_mission public.missions;
begin
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_mission.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v_mission.status in ('concluida','substituida') then
    raise exception 'missão no histórico não pode ser apagada' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.mission_completion_records r where r.mission_id = p_mission_id) then
    raise exception 'missão tem registro de conclusão e não pode ser apagada' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.missions m where m.replaces_mission_id = p_mission_id) then
    raise exception 'missão tem substituta vinculada e não pode ser apagada' using errcode = 'P0001';
  end if;

  delete from public.missions where id = p_mission_id;
  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'missao_removida',
    'Missão "' || v_mission.title || '" removida', '{}'::jsonb, null, null);
end;
$$;

grant execute on function public.delete_mission(uuid) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: add_mission_dependency
-- ============================================================================
create or replace function public.add_mission_dependency(
  p_mission_id          uuid,
  p_depends_on_mission_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission public.missions;
  v_dep public.missions;
begin
  select * into v_mission from public.missions where id = p_mission_id;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_mission.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;

  select * into v_dep from public.missions where id = p_depends_on_mission_id;
  if not found then raise exception 'missão dependência não encontrada' using errcode = 'P0001'; end if;
  if v_dep.project_id <> v_mission.project_id then
    raise exception 'a dependência deve ser do mesmo projeto' using errcode = 'P0001';
  end if;

  insert into public.mission_dependencies (project_id, mission_id, depends_on_mission_id)
  values (v_mission.project_id, p_mission_id, p_depends_on_mission_id)
  on conflict (mission_id, depends_on_mission_id) do nothing;

  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'dependencia_criada',
    'Missão "' || v_mission.title || '" passa a depender de "' || v_dep.title || '"',
    jsonb_build_object('mission_id', p_mission_id, 'depends_on', p_depends_on_mission_id), null, p_mission_id);
end;
$$;

grant execute on function public.add_mission_dependency(uuid, uuid) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: add_mission_complement — correção posterior sem tocar no original
-- ============================================================================
create or replace function public.add_mission_complement(
  p_mission_id uuid,
  p_content    text,
  p_reason     text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission public.missions;
  v_id uuid;
begin
  select * into v_mission from public.missions where id = p_mission_id;
  if not found then raise exception 'missão não encontrada' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_mission.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if coalesce(trim(p_content),'') = '' then raise exception 'o complemento precisa de conteúdo' using errcode = 'P0001'; end if;

  insert into public.mission_complements (mission_id, project_id, user_id, content, reason, created_by)
  values (p_mission_id, v_mission.project_id, v_mission.user_id, trim(p_content), coalesce(p_reason,''), v_mission.user_id)
  returning id into v_id;

  perform public.log_project_event(v_mission.project_id, v_mission.user_id, 'registro_complementar_criado',
    'Registro complementar para "' || v_mission.title || '"',
    jsonb_build_object('complement_id', v_id, 'reason', coalesce(p_reason,'')), null, p_mission_id);
  return v_id;
end;
$$;

grant execute on function public.add_mission_complement(uuid, text, text) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: add_phase_attachment — metadados; arquivo fica no Storage
-- ============================================================================
create or replace function public.add_phase_attachment(
  p_project_id   uuid,
  p_file_name    text,
  p_storage_path text default '',
  p_mime_type    text default '',
  p_size_bytes   bigint default 0,
  p_phase_id     uuid default null,
  p_mission_id   uuid default null,
  p_label        text default '',
  p_replaces     uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_id uuid;
  v_frozen boolean := false;
begin
  select user_id into v_owner from public.projects where id = p_project_id;
  if v_owner is null then raise exception 'projeto não encontrado' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_owner) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if coalesce(trim(p_file_name),'') = '' then raise exception 'o anexo precisa de um nome de arquivo' using errcode = 'P0001'; end if;

  if p_phase_id is not null then
    if exists (select 1 from public.phase_completion_records r where r.phase_id = p_phase_id) then
      v_frozen := true;
    end if;
  end if;
  if p_mission_id is not null then
    if exists (select 1 from public.mission_completion_records r where r.mission_id = p_mission_id) then
      v_frozen := true;
    end if;
  end if;
  if v_frozen then
    raise exception 'não é possível anexar a um registro já concluído' using errcode = 'P0001';
  end if;

  insert into public.phase_attachments
    (project_id, phase_id, mission_id, user_id, file_name, storage_path, mime_type, size_bytes, label, kind, replaces_attachment_id)
  values
    (p_project_id, p_phase_id, p_mission_id, v_owner, trim(p_file_name), coalesce(p_storage_path,''),
     coalesce(p_mime_type,''), coalesce(p_size_bytes,0), coalesce(p_label,''), 'planejada', p_replaces)
  returning id into v_id;

  perform public.log_project_event(p_project_id, v_owner,
    case when p_replaces is null then 'documento_anexado' else 'documento_substituido' end,
    case when p_replaces is null then 'Documento "' || trim(p_file_name) || '" anexado'
         else 'Documento "' || trim(p_file_name) || '" substitui um anexo anterior' end,
    jsonb_build_object('attachment_id', v_id, 'replaces', p_replaces), p_phase_id, p_mission_id);
  return v_id;
end;
$$;

grant execute on function public.add_phase_attachment(uuid, text, text, text, bigint, uuid, uuid, text, uuid) to anon, authenticated, service_role;

-- ============================================================================
-- RPC: delete_phase_attachment — bloqueado se integra registro concluído
-- ============================================================================
create or replace function public.delete_phase_attachment(p_attachment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_att public.phase_attachments;
begin
  select * into v_att from public.phase_attachments where id = p_attachment_id;
  if not found then raise exception 'anexo não encontrado' using errcode = 'P0001'; end if;
  if not public.can_access_owner(v_att.user_id) then raise exception 'sem permissão' using errcode = '42501'; end if;

  delete from public.phase_attachments where id = p_attachment_id;

  perform public.log_project_event(v_att.project_id, v_att.user_id, 'documento_removido',
    'Documento "' || v_att.file_name || '" removido', jsonb_build_object('attachment_id', p_attachment_id),
    v_att.phase_id, v_att.mission_id);
end;
$$;

grant execute on function public.delete_phase_attachment(uuid) to anon, authenticated, service_role;