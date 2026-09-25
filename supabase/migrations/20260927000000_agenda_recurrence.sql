-- ============================================================================
-- Perfil Vivo — Migration: repetição de compromissos
--
-- Adiciona agenda_events.recurrence (jsonb) para compromissos que se repetem
-- (ex.: trabalho 18:00–23:00 de segunda a domingo).
--
-- Formato: {"days": [0,1,2,3,4,5,6], "until": "2027-01-31"}
--   days  — dias da semana (0 = domingo)
--   until — última data em que ocorre (string vazia = sem fim)
--   null  — evento único, na própria event_date
--
-- Idempotente: pode rodar sobre uma base que já tenha a coluna.
-- Execute após 20260926000000_agenda_and_public_profile.sql.
-- ============================================================================

alter table public.agenda_events
  add column if not exists recurrence jsonb;

comment on column public.agenda_events.recurrence is
  'Repetição do compromisso: {"days":[0-6],"until":"yyyy-mm-dd"}. null = único.';

-- Consultas por repetição (busca de "próximas ocorrências") usam jsonb.
create index if not exists agenda_events_recurrence_idx
  on public.agenda_events using gin (recurrence);
