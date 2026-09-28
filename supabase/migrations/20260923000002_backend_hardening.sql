-- ============================================================================
-- Perfil Vivo — Migration 3: backend hardening
-- Rodar após 00001 (projects/milestones). Idempotente.
-- - updated_at em todas as tabelas + trigger genérico
-- - Índices faltantes + unique para prólogo (um PROLOGUE por usuário)
-- - View v_daily_logs_recent + RPC upsert_prologue + health_check
-- - Storage bucket avatars (para upload de avatar/banner quando quiser migrar)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- updated_at
alter table public.profiles        add column if not exists updated_at timestamptz;
alter table public.daily_logs      add column if not exists updated_at timestamptz;
alter table public.weekly_focus    add column if not exists updated_at timestamptz;
alter table public.career_chapters add column if not exists updated_at timestamptz;
alter table public.projects        add column if not exists updated_at timestamptz;
alter table public.milestones      add column if not exists updated_at timestamptz;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_profiles_updated_at        on public.profiles;
create trigger trg_profiles_updated_at        before update on public.profiles        for each row execute function public.set_updated_at();
drop trigger if exists trg_daily_logs_updated_at      on public.daily_logs;
create trigger trg_daily_logs_updated_at      before update on public.daily_logs      for each row execute function public.set_updated_at();
drop trigger if exists trg_weekly_focus_updated_at    on public.weekly_focus;
create trigger trg_weekly_focus_updated_at    before update on public.weekly_focus    for each row execute function public.set_updated_at();
drop trigger if exists trg_career_chapters_updated_at on public.career_chapters;
create trigger trg_career_chapters_updated_at before update on public.career_chapters for each row execute function public.set_updated_at();
drop trigger if exists trg_projects_updated_at        on public.projects;
create trigger trg_projects_updated_at        before update on public.projects        for each row execute function public.set_updated_at();
drop trigger if exists trg_milestones_updated_at      on public.milestones;
create trigger trg_milestones_updated_at      before update on public.milestones      for each row execute function public.set_updated_at();

-- --------------------------------------------------------------- índices
create index if not exists career_chapters_user_doctype_idx on public.career_chapters (user_id, document_type);
create index if not exists projects_user_status_idx          on public.projects        (user_id, status);
-- Garante no máximo um PROLOGUE por usuário (o upsert_prologue depende disso)
create unique index if not exists career_chapters_one_prologue_per_user
  on public.career_chapters (user_id) where document_type = 'PROLOGUE';

-- ------------------------------------------------------------------- view
create or replace view public.v_daily_logs_recent as
  select id, user_id, log_date, planned_text, executed_text, summary_text, status, locked_at, created_at
  from public.daily_logs
  order by log_date desc
  limit 60;

-- ----------------------------------------------------------- RPC: upsert_prologue
create or replace function public.upsert_prologue(p_user_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if p_user_id is null then raise exception 'p_user_id obrigatório' using errcode='P0001'; end if;
  if char_length(coalesce(p_content,'')) > 6000 then raise exception 'prologue muito longo (max 6000)' using errcode='P0001'; end if;

  insert into public.career_chapters (user_id, title, period, document_type, content)
  values (p_user_id, 'Prólogo', '', 'PROLOGUE', coalesce(p_content,''))
  on conflict (user_id) where document_type='PROLOGUE'
  do update set content = excluded.content, title = 'Prólogo', updated_at = now()
  returning id into v_id;

  -- Fallback para bancos onde o índice parcial ainda não existe (upsert acima falhou em inserir mas não conflitou):
  if v_id is null then
    select id into v_id from public.career_chapters where user_id=p_user_id and document_type='PROLOGUE' limit 1;
    if v_id is not null then
      update public.career_chapters set content = coalesce(p_content,''), title='Prólogo' where id = v_id;
    else
      insert into public.career_chapters (user_id, title, period, document_type, content)
      values (p_user_id, 'Prólogo', '', 'PROLOGUE', coalesce(p_content,'')) returning id into v_id;
    end if;
  end if;

  return v_id;
end; $$;

revoke all on function public.upsert_prologue(uuid, text) from public;
grant execute on function public.upsert_prologue(uuid, text) to anon, authenticated, service_role;

-- --------------------------------------------------------------- health_check
create or replace function public.health_check()
returns boolean language sql as $$ select true; $$;
grant execute on function public.health_check() to anon, authenticated, service_role;

-- -------------------------------------------------------------- storage: avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policies do bucket (idempotentes via drop+create)
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "avatars insert" on storage.objects;
create policy "avatars insert" on storage.objects for insert with check (bucket_id = 'avatars');

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects for delete using (bucket_id = 'avatars');
