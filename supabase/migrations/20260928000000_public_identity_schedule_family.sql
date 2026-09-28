-- ============================================================================
-- Perfil Vivo — Migration 5: Identidade pública + Agenda real + Reuniões + Família
--
-- Domínios novos (fase 2 da especificação):
--   1. Perfil público: profiles.slug, phone (descoberta de conta), presentation,
--      meeting policy e privacidade em camadas (PÚBLICO / FAMÍLIA / PRIVADO).
--   2. recurring_commitments — compromissos fixos recorrentes (Trabalho 18–00,
--      todos os dias). A rotina é gerada pelo client a partir da regra.
--   3. commitment_exceptions — exceções pontuais a uma ocorrência da regra
--      (folga numa quarta altera só aquela ocorrência; a regra continua).
--   4. one_off_events — compromissos eventuais (REUNIÃO 16–17 do dia 25).
--   5. availability_rules — disponibilidade pública por dia da semana,
--      decidida MANUALMENTE pelo dono (o sistema não decide sozinho).
--   6. meeting_requests — solicitação de reunião do visitante: data, hora,
--      nome, contato, motivo. ACEITAR / RECUSAR / PROPOR OUTRO HORÁRIO.
--   7. family_members — relação familiar baseada em ID de conta + telefone
--      como mecanismo de descoberta/convite (nunca conta falsa). Status de
--      convite: PENDING / ACCEPTED / DECLINED / REMOVED.
--
-- Idempotente. Rodar após 20260923000003_time_capsules.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- =========================================================== profiles (evolução)
alter table public.profiles add column if not exists slug text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists presentation text not null default '';
alter table public.profiles add column if not exists is_public boolean not null default true;
alter table public.profiles add column if not exists show_schedule boolean not null default true;
alter table public.profiles add column if not exists show_projects boolean not null default true;
alter table public.profiles add column if not exists show_achievements boolean not null default true;
alter table public.profiles add column if not exists show_family boolean not null default true;
alter table public.profiles add column if not exists meetings_enabled boolean not null default false;
alter table public.profiles add column if not exists meeting_duration_min integer not null default 30
  check (meeting_duration_min between 10 and 240);
alter table public.profiles add column if not exists meeting_buffer_min integer not null default 15
  check (meeting_buffer_min between 0 and 120);
alter table public.profiles add column if not exists meeting_max_per_day integer not null default 2
  check (meeting_max_per_day between 1 and 10);
alter table public.profiles add column if not exists meeting_requires_approval boolean not null default true;
alter table public.profiles add column if not exists meeting_requirements text not null default '';

-- Slug único e normalizado (minusculas, hifen). Um único dono por slug.
create unique index if not exists profiles_slug_unique on public.profiles (slug)
  where slug is not null and slug <> '';

create index if not exists profiles_phone_idx on public.profiles (phone)
  where phone is not null and phone <> '';

-- ================================================== projects (campos extras)
-- Spec §10: projeto pode ter período, atividades, resultados e links.
alter table public.projects add column if not exists period     text not null default '';
alter table public.projects add column if not exists activities text not null default '';
alter table public.projects add column if not exists results    text not null default '';
alter table public.projects add column if not exists links      text not null default '';

-- ===================================================================== agenda --

-- Compromissos fixos recorrentes (regra). Ex.: Trabalho, 18:00–00:00, semanal,
-- todos os dias. weekday 0=domingo … 6=sábado; weekdays = {} significa todos.
create table if not exists public.recurring_commitments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  category    text not null default 'Geral',
  start_time  text not null,           -- 'HH:MM'
  end_time    text not null,           -- 'HH:MM' (pode ser '00:00' para virar o dia)
  weekdays    integer[] not null default '{}',  -- vazio = todos os dias
  note        text not null default '',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists recurring_commitments_user_idx on public.recurring_commitments (user_id);

-- Exceções pontuais: alteram APENAS a ocorrência da regra naquele date.
-- mode: 'cancelled' (folga) | 'edited' (horário/título diferentes naquele dia)
create table if not exists public.commitment_exceptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  commitment_id uuid not null references public.recurring_commitments(id) on delete cascade,
  exception_date date not null,
  mode         text not null check (mode in ('cancelled','edited')),
  title        text not null default '',
  start_time   text not null default '',
  end_time     text not null default '',
  note         text not null default '',
  created_at   timestamptz not null default now(),
  unique (commitment_id, exception_date)
);

create index if not exists commitment_exceptions_date_idx on public.commitment_exceptions (user_id, exception_date);

-- Compromissos eventuais (não recorrentes). Reuniões aceitas também vivem aqui
-- (source = 'meeting') para entrarem na agenda e sumirem da disponibilidade.
create table if not exists public.one_off_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_date  date not null,
  start_time  text not null,
  end_time    text not null,
  title       text not null,
  note        text not null default '',
  source      text not null default 'manual' check (source in ('manual','meeting')),
  meeting_request_id uuid references public.meeting_requests(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists one_off_events_user_date_idx on public.one_off_events (user_id, event_date);

-- ---------------------------------------------------- disponibilidade pública --
-- Regras por dia da semana decididas manualmente pelo dono.
create table if not exists public.availability_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  weekday     integer not null check (weekday between 0 and 6),
  is_available boolean not null default false,
  start_time  text not null default '09:00',
  end_time    text not null default '17:00',
  updated_at  timestamptz,
  unique (user_id, weekday)
);

create index if not exists availability_rules_user_idx on public.availability_rules (user_id);

-- --------------------------------------------------------- reuniões (solicitações)
create table if not exists public.meeting_requests (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  event_date  date not null,
  start_time  text not null,
  end_time    text not null,
  requester_name  text not null,
  requester_contact text not null,
  reason      text not null default '',
  status      text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED','CANCELLED','RESCHEDULED')),
  counter_start_time text,  -- "propor outro horário"
  counter_end_time   text,
  counter_event_date date,
  counter_note text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists meeting_requests_owner_idx on public.meeting_requests (owner_id, status);

-- ==================================================================== família --
-- A relação é entre CONTAS (user_id + member_user_id quando existir).
-- O telefone é mecanismo de descoberta/convite — nunca cria conta falsa.
create table if not exists public.family_members (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  display_name   text not null,
  phone          text not null,
  relation       text not null default 'outro'
                 check (relation in ('mae','pai','filho','filha','irmao','irma','avo','avo_f','tio','tia','primo','prima','conjuge','outro')),
  member_user_id uuid references public.profiles(id) on delete set null,
  invite_status  text not null default 'LINKED' check (invite_status in ('PENDING','LINKED','DECLINED','REMOVED')),
  privacy        text not null default 'FAMILY' check (privacy in ('PUBLIC','FAMILY','PRIVATE')),
  note           text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz,
  unique (user_id, phone)
);

create index if not exists family_members_user_idx on public.family_members (user_id);
create index if not exists family_members_phone_idx on public.family_members (phone);

-- updated_at nas tabelas novas (trigger genérica da migration 3 já existe)
drop trigger if exists trg_recurring_commitments_updated_at on public.recurring_commitments;
create trigger trg_recurring_commitments_updated_at before update on public.recurring_commitments
  for each row execute function public.set_updated_at();
drop trigger if exists trg_one_off_events_updated_at on public.one_off_events;
create trigger trg_one_off_events_updated_at before update on public.one_off_events
  for each row execute function public.set_updated_at();
drop trigger if exists trg_availability_rules_updated_at on public.availability_rules;
create trigger trg_availability_rules_updated_at before update on public.availability_rules
  for each row execute function public.set_updated_at();
drop trigger if exists trg_meeting_requests_updated_at on public.meeting_requests;
create trigger trg_meeting_requests_updated_at before update on public.meeting_requests
  for each row execute function public.set_updated_at();
drop trigger if exists trg_family_members_updated_at on public.family_members;
create trigger trg_family_members_updated_at before update on public.family_members
  for each row execute function public.set_updated_at();

-- =============================================================== RLS (abertas
-- até existir Supabase Auth; ao ativar auth, troque por user_id = auth.uid()) --
alter table public.recurring_commitments enable row level security;
do $$ begin create policy "recurring all" on public.recurring_commitments for all using (true) with check (true); exception when duplicate_object then null; end $$;

alter table public.commitment_exceptions enable row level security;
do $$ begin create policy "exceptions all" on public.commitment_exceptions for all using (true) with check (true); exception when duplicate_object then null; end $$;

alter table public.one_off_events enable row level security;
do $$ begin create policy "one_off all" on public.one_off_events for all using (true) with check (true); exception when duplicate_object then null; end $$;

alter table public.availability_rules enable row level security;
do $$ begin create policy "availability all" on public.availability_rules for all using (true) with check (true); exception when duplicate_object then null; end $$;

alter table public.meeting_requests enable row level security;
do $$ begin create policy "meeting_requests read" on public.meeting_requests for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "meeting_requests insert" on public.meeting_requests for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "meeting_requests write" on public.meeting_requests for update using (true) with check (true); exception when duplicate_object then null; end $$;

alter table public.family_members enable row level security;
do $$ begin create policy "family all" on public.family_members for all using (true) with check (true); exception when duplicate_object then null; end $$;
