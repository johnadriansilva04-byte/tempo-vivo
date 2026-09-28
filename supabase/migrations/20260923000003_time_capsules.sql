-- ============================================================================
-- Perfil Vivo — Migration 4: time_capsules (Cápsulas do Tempo)
-- Cartas para o seu eu futuro. Conteúdo selado até unlock_at (integridade
-- temporal no banco: ninguém lê antes da hora — nem o próprio dono).
-- Rodar após 20260923000002_backend_hardening.sql. Idempotente.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------ time_capsules --
create table if not exists public.time_capsules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  content     text not null,
  unlock_at   date not null,
  opened_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  check (unlock_at > created_at::date)
);

create index if not exists time_capsules_user_unlock_idx on public.time_capsules (user_id, unlock_at);

-- Integridade temporal: conteúdo imutável após criada; opened_at só pode ser
-- definido uma vez e nunca antes de unlock_at.
create or replace function public.enforce_capsule_integrity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.content is distinct from old.content or new.title is distinct from old.title or new.unlock_at is distinct from old.unlock_at then
      raise exception 'cápsula % é selada: título, conteúdo e data de abertura não podem mudar', old.id
        using errcode = 'P0001';
    end if;
    if new.opened_at is not null and old.opened_at is not null then
      raise exception 'cápsula % já foi aberta', old.id using errcode = 'P0001';
    end if;
    if new.opened_at is not null and new.opened_at::date < new.unlock_at then
      raise exception 'cápsula % só pode ser aberta a partir de %', old.id, new.unlock_at
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_capsule_lock on public.time_capsules;
create trigger enforce_capsule_lock
  before update on public.time_capsules
  for each row execute function public.enforce_capsule_integrity();

alter table public.time_capsules enable row level security;
do $$ begin
  create policy "time_capsules read" on public.time_capsules for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "time_capsules insert" on public.time_capsules for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "time_capsules update" on public.time_capsules for update using (true) with check (true);
exception when duplicate_object then null; end $$;
