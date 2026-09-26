-- ============================================================================
-- Perfil Vivo — Migration: reuniões públicas
--
-- 1. profiles.availability: quais dias/horários o dono abre para reuniões.
-- 2. meeting_requests: pedido feito por um visitante, com aprovação do dono.
-- 3. public_profiles passa a expor a disponibilidade (sem dados de contato).
--
-- Execute após 20260928000000_public_network.sql.
-- ============================================================================

-- ------------------------------------------------------- availability ------
alter table public.profiles
  add column if not exists availability jsonb not null default jsonb_build_object(
    'days', jsonb_build_array(1, 3, 5),
    'slots', jsonb_build_array('09:00', '10:00', '14:00', '15:00', '16:00'),
    'duration_min', 30,
    'note', '',
    'enabled', true
  );

-- ---------------------------------------------------- meeting_requests -----
create table if not exists public.meeting_requests (
  id              uuid primary key default gen_random_uuid(),
  -- Dono do perfil que recebe o pedido.
  host_id         uuid not null references public.profiles(id) on delete cascade,
  -- Handle usado na URL pública no momento do pedido (auditoria e exibição).
  host_handle     text not null default '',
  requester_name  text not null,
  requester_phone text not null default '',
  subject         text not null default '',
  location        text not null default '',
  notes           text not null default '',
  meeting_date    date not null,
  meeting_time    text not null,
  status          text not null default 'PENDING'
                  check (status in ('PENDING', 'CONFIRMED', 'DECLINED')),
  created_at      timestamptz not null default now()
);

create index if not exists meeting_requests_host_idx
  on public.meeting_requests (host_id, created_at desc);

alter table public.meeting_requests enable row level security;

-- O dono lê e decide os pedidos que recebeu.
drop policy if exists "meeting_requests select host" on public.meeting_requests;
drop policy if exists "meeting_requests update host" on public.meeting_requests;
drop policy if exists "meeting_requests delete host" on public.meeting_requests;
drop policy if exists "meeting_requests insert public" on public.meeting_requests;

create policy "meeting_requests select host" on public.meeting_requests
  for select to authenticated using (auth.uid() = host_id);
create policy "meeting_requests update host" on public.meeting_requests
  for update to authenticated using (auth.uid() = host_id) with check (auth.uid() = host_id);
create policy "meeting_requests delete host" on public.meeting_requests
  for delete to authenticated using (auth.uid() = host_id);

-- O visitante (mesmo anônimo) pode CRIAR um pedido, mas só para um perfil que
-- abriu disponibilidade. Nunca pode ler, alterar ou apagar pedidos alheios:
-- status nasce PENDING e o host_id é resolvido pelo handle, não pelo cliente.
create policy "meeting_requests insert public" on public.meeting_requests
  for insert to anon, authenticated
  with check (
    status = 'PENDING'
    and exists (
      select 1 from public.profiles p
       where p.id = host_id
         and p.handle <> ''
         and coalesce((p.availability ->> 'enabled')::boolean, true)
    )
  );

grant select, insert, update, delete on public.meeting_requests to anon, authenticated;

-- --------------------------------------------------- view com agenda -------
-- Reexpoe a view incluindo a disponibilidade pública (nunca o contato do dono).
create or replace view public.public_profiles
with (security_invoker = true) as
select
  p.id,
  lower(p.handle) as handle,
  public.handle_from_name(p.full_name) as slug,
  jsonb_build_object(
    'full_name', p.full_name,
    'role',      p.role,
    'location',  p.location,
    'bio',       p.bio,
    'avatar_url', p.avatar_url,
    'cover_url',  p.cover_url,
    'availability', p.availability
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
  ) as chapters,
  coalesce(
    (select jsonb_agg(to_jsonb(a) order by a.event_date, a.start_time)
       from public.agenda_events a where a.user_id = p.id),
    '[]'::jsonb
  ) as agenda,
  coalesce(
    (select jsonb_agg(to_jsonb(f) order by f.year, f.week_number)
       from public.weekly_focus f where f.user_id = p.id),
    '[]'::jsonb
  ) as focus
from public.profiles p
where p.handle <> '';

grant select on public.public_profiles to anon, authenticated;
