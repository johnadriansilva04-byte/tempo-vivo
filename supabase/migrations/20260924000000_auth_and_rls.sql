-- ============================================================================
-- Perfil Vivo — Migration 3: Supabase Auth + RLS por usuário
--
-- A partir daqui cada conta é um usuário real do Supabase Auth (telefone vira
-- um e-mail sintético no cliente) e TODAS as tabelas são isoladas por auth.uid().
-- Execute após as migrations 20260923000000 e 20260923000001.
-- ============================================================================

-- --------------------------------------------------------------- profiles ---
-- profiles.id passa a ser o id do usuário em auth.users.
alter table public.profiles
  add column if not exists phone                text,
  add column if not exists age                  integer,
  add column if not exists onboarding_completed boolean not null default false;

-- Dados antigos pertenciam ao singleton anônimo (sem usuário de auth): remove.
delete from public.profiles
 where id = '00000000-0000-0000-0000-000000000001';

do $$ begin
  alter table public.profiles
    add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;

create unique index if not exists profiles_phone_uniq
  on public.profiles (phone) where phone is not null;

-- ------------------------------------------- índices únicos de upsert -------
-- Necessários para o `onConflict` do PostgREST (idempotência do onboarding).
create unique index if not exists weekly_focus_unique_idx
  on public.weekly_focus (user_id, year, week_number, title);

create unique index if not exists career_chapters_prologue_uniq
  on public.career_chapters (user_id) where document_type = 'PROLOGUE';

-- ============================================================================
-- Row Level Security — cada usuário só enxerga e altera a própria história.
-- ============================================================================

alter table public.profiles        enable row level security;
alter table public.daily_logs      enable row level security;
alter table public.weekly_focus    enable row level security;
alter table public.career_chapters enable row level security;
alter table public.projects        enable row level security;
alter table public.milestones      enable row level security;

-- profiles: chave = id do usuário
drop policy if exists "profiles read"  on public.profiles;
drop policy if exists "profiles write" on public.profiles;
drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;

create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Tabelas de dados: chave = user_id
do $$
declare
  t text;
begin
  foreach t in array array['daily_logs','weekly_focus','career_chapters','projects','milestones']
  loop
    execute format('drop policy if exists %I on public.%I', t || ' read', t);
    execute format('drop policy if exists %I on public.%I', t || ' write', t);
    execute format('drop policy if exists %I on public.%I', t || ' insert', t);
    execute format('drop policy if exists %I on public.%I', t || ' update', t);
    execute format('drop policy if exists %I on public.%I', t || ' all', t);
    execute format('drop policy if exists %I on public.%I', t || ' select own', t);
    execute format('drop policy if exists %I on public.%I', t || ' insert own', t);
    execute format('drop policy if exists %I on public.%I', t || ' update own', t);
    execute format('drop policy if exists %I on public.%I', t || ' delete own', t);

    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      t || ' select own', t);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      t || ' insert own', t);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || ' update own', t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      t || ' delete own', t);
  end loop;
end $$;
