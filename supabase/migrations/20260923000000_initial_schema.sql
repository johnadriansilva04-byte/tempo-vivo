-- ============================================================================
-- Perfil Vivo — Schema PostgreSQL (Supabase)
-- Fase 3: modelagem de dados + trigger de Integridade Temporal + RLS
-- Execute no SQL Editor do Supabase (ou `supabase db push`).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null default '',
  bio             text not null default '',
  role            text not null default '',
  location        text not null default '',
  birth_date      date,
  target_lifespan integer not null default 100 check (target_lifespan between 40 and 150),
  avatar_url      text,
  cover_url       text,
  created_at      timestamptz not null default now()
);

-- -------------------------------------------------------------- daily_logs --
create table if not exists public.daily_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  log_date      date not null,
  planned_text  text not null default '',
  executed_text text not null default '',
  summary_text  text not null default '',
  status        text not null default 'OPEN' check (status in ('OPEN','VALIDATING','LOCKED')),
  locked_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);

-- ------------------------------------------------------------- weekly_focus --
create table if not exists public.weekly_focus (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text not null default '',
  week_number integer not null check (week_number between 1 and 53),
  year        integer not null,
  progress_pct integer not null default 0 check (progress_pct between 0 and 100),
  created_at  timestamptz not null default now()
);

create index if not exists weekly_focus_user_week_idx on public.weekly_focus (user_id, year, week_number);

-- ---------------------------------------------------------- career_chapters --
create table if not exists public.career_chapters (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  period        text not null default '',
  document_type text not null default 'EXPERIENCE'
                check (document_type in ('PROLOGUE','RESUME','EXPERIENCE','EDUCATION','CERTIFICATE','SKILL','LANGUAGE','PRODUCTION')),
  content       text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists career_chapters_user_idx on public.career_chapters (user_id);

-- ============================================================================
-- REGRA DE INTEGRIDADE TEMPORAL (trigger)
-- Um daily_log trava 24h após created_at ou log_date (o que ocorrer primeiro).
-- UPDATE: impede edição de registros já travados e trava os que passaram de 24h.
-- ============================================================================

create or replace function public.enforce_daily_log_temporal_integrity()
returns trigger
language plpgsql
as $$
declare
  v_age_hours double precision;
  v_anchor timestamptz;
begin
  -- âncora temporal: o mais antigo entre created_at e o início de log_date
  v_anchor := least(coalesce(new.created_at, now()), (new.log_date::timestamp at time zone 'utc'));
  v_age_hours := extract(epoch from (now() - v_anchor)) / 3600.0;

  if tg_op = 'INSERT' and v_age_hours > 24 then
    new.status := 'LOCKED';
    new.locked_at := now();
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- 1) registro já travado é imutável
    if old.status = 'LOCKED' then
      raise exception 'daily_log % está travado (registro histórico) e não pode ser alterado', old.id
        using errcode = 'P0001';
    end if;

    -- 2) impedir alterar a data do dia (histórico não é reescrito)
    if new.log_date is distinct from old.log_date then
      raise exception 'log_date de % não pode ser alterado', old.id
        using errcode = 'P0001';
    end if;

    -- 3) passou de 24h → trava automaticamente
    if v_age_hours > 24 then
      new.status := 'LOCKED';
      new.locked_at := coalesce(new.locked_at, now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_daily_log_lock on public.daily_logs;
create trigger enforce_daily_log_lock
  before insert or update on public.daily_logs
  for each row execute function public.enforce_daily_log_temporal_integrity();

-- ============================================================================
-- Seed de perfil singleton (id fixo usado pelo app enquanto não há auth)
-- ============================================================================

insert into public.profiles (id, full_name, role, location, bio, birth_date, target_lifespan)
values (
  '00000000-0000-0000-0000-000000000001',
  'Ana Costa',
  'Pesquisadora de futuros humanos',
  'São Paulo, Brasil',
  'Investigo como escolhas, memória e tecnologia transformam vidas ao longo do tempo.',
  '1992-03-14',
  100
)
on conflict (id) do nothing;

-- ============================================================================
-- Row Level Security — singleton local: policies abertas até haver Supabase Auth.
-- Quando auth for ativado, troque por: user_id = auth.uid()
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.weekly_focus enable row level security;
alter table public.career_chapters enable row level security;

create policy "profiles read" on public.profiles for select using (true);
create policy "profiles write" on public.profiles for update using (true) with check (true);

create policy "daily_logs read" on public.daily_logs for select using (true);
create policy "daily_logs insert" on public.daily_logs for insert with check (true);
create policy "daily_logs update" on public.daily_logs for update using (true) with check (true);

create policy "weekly_focus read" on public.weekly_focus for select using (true);
create policy "weekly_focus write" on public.weekly_focus for all using (true) with check (true);

create policy "career_chapters read" on public.career_chapters for select using (true);
create policy "career_chapters write" on public.career_chapters for all using (true) with check (true);
