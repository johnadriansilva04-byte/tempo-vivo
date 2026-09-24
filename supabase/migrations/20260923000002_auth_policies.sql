-- ============================================================================
-- Perfil Vivo — Auth Policies Migration
-- Atualiza as policies de RLS para usar auth.uid() em vez de acesso aberto
-- Execute no SQL Editor do Supabase (ou `supabase db push`).
-- ============================================================================

-- Atualizar policies para usar auth.uid() para autenticação real

-- Profiles
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (id = auth.uid());

drop policy if exists "profiles write" on public.profiles;
create policy "profiles write" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Criar policy para insert de profiles (quando um novo usuário se registra)
drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles for insert with check (id = auth.uid());

-- Daily Logs
drop policy if exists "daily_logs read" on public.daily_logs;
create policy "daily_logs read" on public.daily_logs for select using (user_id = auth.uid());

drop policy if exists "daily_logs insert" on public.daily_logs;
create policy "daily_logs insert" on public.daily_logs for insert with check (user_id = auth.uid());

drop policy if exists "daily_logs update" on public.daily_logs;
create policy "daily_logs update" on public.daily_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Weekly Focus
drop policy if exists "weekly_focus read" on public.weekly_focus;
create policy "weekly_focus read" on public.weekly_focus for select using (user_id = auth.uid());

drop policy if exists "weekly_focus write" on public.weekly_focus;
create policy "weekly_focus write" on public.weekly_focus for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Career Chapters
drop policy if exists "career_chapters read" on public.career_chapters;
create policy "career_chapters read" on public.career_chapters for select using (user_id = auth.uid());

drop policy if exists "career_chapters write" on public.career_chapters;
create policy "career_chapters write" on public.career_chapters for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Projects (se a tabela existir)
do $$
begin
  if exists (select from information_schema.tables where table_name = 'projects') then
    drop policy if exists "projects read" on public.projects;
    create policy "projects read" on public.projects for select using (user_id = auth.uid());
    
    drop policy if exists "projects write" on public.projects;
    create policy "projects write" on public.projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- Milestones (se a tabela existir)
do $$
begin
  if exists (select from information_schema.tables where table_name = 'milestones') then
    drop policy if exists "milestones read" on public.milestones;
    create policy "milestones read" on public.milestones for select using (user_id = auth.uid());
    
    drop policy if exists "milestones write" on public.milestones;
    create policy "milestones write" on public.milestones for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- Trigger para criar profile automaticamente quando usuário se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, role, location, bio, birth_date, target_lifespan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '',
    '',
    '',
    null,
    100
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();