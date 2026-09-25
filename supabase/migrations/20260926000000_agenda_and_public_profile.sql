-- ============================================================================
-- Perfil Vivo — Migration: agenda de eventos + perfil público
--
-- 1. agenda_events: compromissos com data e hora (a Agenda vira calendário real).
-- 2. projects.link: link externo do projeto (site, repositório, documento).
-- 3. profiles.handle + view public_profiles: perfil compartilhável em
--    perfilvivo.com/@handle, legível por visitantes (modo visitante).
--
-- Execute após as migrations 20260923*, 20260924* e 20260925*.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------ agenda_events -
create table if not exists public.agenda_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  event_date date not null,
  start_time text not null default '09:00',
  end_time   text not null default '',
  location   text not null default '',
  notes      text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists agenda_events_user_date_idx
  on public.agenda_events (user_id, event_date, start_time);

alter table public.agenda_events enable row level security;

drop policy if exists "agenda_events select own" on public.agenda_events;
drop policy if exists "agenda_events insert own" on public.agenda_events;
drop policy if exists "agenda_events update own" on public.agenda_events;
drop policy if exists "agenda_events delete own" on public.agenda_events;

create policy "agenda_events select own" on public.agenda_events
  for select using (auth.uid() = user_id);
create policy "agenda_events insert own" on public.agenda_events
  for insert with check (auth.uid() = user_id);
create policy "agenda_events update own" on public.agenda_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agenda_events delete own" on public.agenda_events
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------- projects.link -
alter table public.projects
  add column if not exists link text not null default '';

-- -------------------------------------------------------------- handle ------
alter table public.profiles
  add column if not exists handle text not null default '';

create unique index if not exists profiles_handle_uniq
  on public.profiles (lower(handle)) where handle <> '';

-- ============================================================================
-- Perfil público (modo visitante)
--
-- View agregada com SECURITY INVOKER: expõe apenas campos públicos e apenas
-- para handles preenchidos. Visitantes leem por handle; nada de conta, telefone
-- ou data de nascimento sai daqui.
-- ============================================================================

create or replace view public.public_profiles
with (security_invoker = true) as
select
  p.id,
  lower(p.handle) as handle,
  jsonb_build_object(
    'full_name', p.full_name,
    'role',      p.role,
    'location',  p.location,
    'bio',       p.bio,
    'avatar_url', p.avatar_url,
    'cover_url',  p.cover_url
  ) as profile_data,
  coalesce(
    (select jsonb_agg(to_jsonb(m) order by m.year)
       from public.milestones m where m.user_id = p.id),
    '[]'::jsonb
  ) as milestones,
  coalesce(
    (select jsonb_agg(to_jsonb(pr) order by pr.created_at)
       from public.projects pr where pr.user_id = p.id),
    '[]'::jsonb
  ) as projects,
  coalesce(
    (select jsonb_agg(to_jsonb(c) order by c.period, c.created_at)
       from public.career_chapters c
      where c.user_id = p.id and c.document_type <> 'PROLOGUE'),
    '[]'::jsonb
  ) as chapters
from public.profiles p
where p.handle <> '';

-- A view respeita a RLS de profiles (security_invoker). Para o visitante
-- anônimo enxergar o perfil público, libera somente a leitura de perfis que
-- declararam um handle.
drop policy if exists "profiles read public" on public.profiles;
create policy "profiles read public" on public.profiles
  for select to anon, authenticated
  using (handle <> '');

drop policy if exists "milestones read public" on public.milestones;
create policy "milestones read public" on public.milestones
  for select to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = user_id and p.handle <> ''));

drop policy if exists "projects read public" on public.projects;
create policy "projects read public" on public.projects
  for select to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = user_id and p.handle <> ''));

drop policy if exists "career_chapters read public" on public.career_chapters;
create policy "career_chapters read public" on public.career_chapters
  for select to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = user_id and p.handle <> ''));

-- A view é SECURITY INVOKER: o visitante lê as tabelas com os próprios
-- privilégios. O Supabase concede SELECT em tabelas novas do schema public por
-- default (via ALTER DEFAULT PRIVILEGES); quem limita as LINHAS é a RLS acima —
-- só perfis com handle ficam visíveis. Explicitamos só o grant da view.
grant select on public.public_profiles to anon, authenticated;
