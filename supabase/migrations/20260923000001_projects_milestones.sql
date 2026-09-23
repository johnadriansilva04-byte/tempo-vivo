-- ============================================================================
-- Perfil Vivo — Migration 2: projects + milestones (antes só locais)
-- Executa-se após 20260923000000_initial_schema.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- projects --
create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  description text not null default '',
  status     text not null default 'Planejado'
             check (status in ('Em andamento','Pesquisa','Planejado','Concluído')),
  progress   integer not null default 0 check (progress between 0 and 100),
  objective  text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists projects_user_idx on public.projects (user_id);

alter table public.projects enable row level security;
do $$ begin
  create policy "projects all" on public.projects for all using (true) with check (true);
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------- milestones --
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  year        text not null,
  title       text not null,
  description text not null default '',
  category    text not null default 'Vida',
  created_at  timestamptz not null default now(),
  unique (user_id, title)
);

create index if not exists milestones_user_year_idx on public.milestones (user_id, year desc);

alter table public.milestones enable row level security;
do $$ begin
  create policy "milestones all" on public.milestones for all using (true) with check (true);
exception when duplicate_object then null; end $$;
