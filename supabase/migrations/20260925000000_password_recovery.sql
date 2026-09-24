-- ============================================================================
-- Perfil Vivo — Migration 4: recuperação de senha por pergunta secreta
--
-- O app entra só com telefone + senha, sem e-mail. Isso tira o "esqueci minha
-- senha" clássico (link por e-mail) do tabuleiro. A saída mora dentro do
-- próprio Supabase: a pessoa escolhe uma pergunta secreta e, se esquecer a
-- senha, responde essa pergunta para definir uma nova.
--
-- Todas as decisões abaixo existem para uma coisa: ninguém troca a senha de
-- outra pessoa e ninguém lê a resposta de ninguém.
--
-- 1. A pergunta e o hash da resposta vivem no schema `private`, que o PostgREST
--    não expõe. Não há coluna em public.profiles para vazar em select(*).
-- 2. A conferência da resposta acontece só dentro de funções SECURITY DEFINER.
-- 3. Trocar a senha exige um comprovante (ticket) de curta duração, com hash
--    guardado em tabela sem acesso de cliente e assinado com segredo que só o
--    banco conhece. Ticket é de uso único.
--
-- Requer as migrations 20260923000000, 20260923000001 e 20260924000000.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Schema privado: fora de [api] schemas, invisível para o PostgREST.
create schema if not exists private;
revoke all on schema private from anon, authenticated;

-- Segredo que assina os tickets. Aleatório por projeto, gerado uma vez e
-- nunca legível pelo cliente.
create table if not exists private.app_secrets (
  name       text primary key,
  value      text not null,
  created_at timestamptz not null default now()
);

insert into private.app_secrets (name, value)
values ('recovery_hmac', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

-- Pergunta + hash da resposta. Uma linha por conta.
create table if not exists private.recovery_secrets (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  question    text not null,
  answer_hash text not null,
  updated_at  timestamptz not null default now()
);

-- --------------------------------------------------- tickets de recuperação --
-- Comprovante de uso único emitido após a resposta correta. RLS ligada e
-- nenhuma policy: nem o dono da conta lê daqui.
create table if not exists public.recovery_tickets (
  ticket_hash text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.recovery_tickets enable row level security;

create index if not exists recovery_tickets_user_idx
  on public.recovery_tickets (user_id, expires_at desc);

revoke all on private.app_secrets       from anon, authenticated;
revoke all on private.recovery_secrets  from anon, authenticated;
revoke all on public.recovery_tickets   from anon, authenticated;

-- --------------------------------------------------------------- utilitários --
-- Comparação tolerante: ninguém decora a caixa nem o número de espaços que
-- digitou, muito menos o acento. Guardamos e conferimos sempre a forma
-- normalizada (minúsculas, sem acento, espaços colapsados).
create or replace function private.normalize_answer(value text)
returns text
language sql
immutable
set search_path = extensions, private
as $$
  select regexp_replace(
           translate(
             lower(btrim(coalesce(value, ''))),
             'áàâãäéèêëíìîïóòôõöúùûüçñ',
             'aaaaaeeeeiiiiooooouuuucn'
           ),
           '\s+', ' ', 'g'
         );
$$;

create or replace function private.hash_answer(value text)
returns text
language sql
immutable
set search_path = extensions, private
as $$
  select extensions.crypt(private.normalize_answer(value), extensions.gen_salt('bf', 10));
$$;

create or replace function private.answer_matches(candidate text, stored text)
returns boolean
language sql
immutable
set search_path = extensions, private
as $$
  select stored is not null
     and candidate is not null
     and extensions.crypt(private.normalize_answer(candidate), stored) = stored;
$$;

create or replace function private.hmac_secret()
returns text
language sql
stable
security definer
set search_path = private
as $$
  select value from private.app_secrets where name = 'recovery_hmac';
$$;

revoke all on function private.normalize_answer(text)      from public, anon, authenticated;
revoke all on function private.hash_answer(text)            from public, anon, authenticated;
revoke all on function private.answer_matches(text, text)   from public, anon, authenticated;
revoke all on function private.hmac_secret()                from public, anon, authenticated;

-- ====================================== 1) definir o segredo (autenticado) ==
create or replace function public.recovery_set_secret(
  p_question text,
  p_answer   text
)
returns void
language plpgsql
security definer
set search_path = public, extensions, auth, private
as $$
declare
  v_uid      uuid := auth.uid();
  v_question text := btrim(coalesce(p_question, ''));
  v_answer   text := btrim(coalesce(p_answer, ''));
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if char_length(v_question) < 3 then
    raise exception 'invalid_question';
  end if;
  if char_length(v_answer) < 2 then
    raise exception 'invalid_answer';
  end if;

  insert into private.recovery_secrets (user_id, question, answer_hash, updated_at)
  values (v_uid, left(v_question, 120), private.hash_answer(v_answer), now())
  on conflict (user_id) do update
    set question    = excluded.question,
        answer_hash = excluded.answer_hash,
        updated_at  = excluded.updated_at;
end $$;

-- ===================== 2) o dono consulta o próprio segredo (autenticado) ==
-- Permite a tela de Configurações mostrar qual pergunta está ativa, sem
-- devolver a resposta.
create or replace function public.recovery_my_secret()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth, private
as $$
declare
  v_uid  uuid := auth.uid();
  v_row  private.recovery_secrets%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('set', false, 'question', null);
  end if;

  select * into v_row from private.recovery_secrets where user_id = v_uid;

  if not found then
    return jsonb_build_object('set', false, 'question', null);
  end if;

  return jsonb_build_object('set', true, 'question', v_row.question);
end $$;

-- ================================================ 3) mostrar a pergunta ====
-- Devolve apenas a pergunta — nunca a resposta. É o que permite trocar a
-- senha sem depender de e-mail, mantendo o telefone como identificação.
create or replace function public.recovery_hint(p_phone text)
returns text
language plpgsql
security definer
set search_path = public, extensions, auth, private
as $$
declare
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_uid    uuid;
  v_row    private.recovery_secrets%rowtype;
begin
  if char_length(v_digits) < 10 then
    return null;
  end if;

  select id into v_uid from public.profiles where phone = v_digits limit 1;
  if v_uid is null then
    return null;
  end if;

  select * into v_row from private.recovery_secrets where user_id = v_uid;
  if not found then
    return null;
  end if;

  return v_row.question;
end $$;

-- ==================================== 4) conferir a resposta → ticket =======
create or replace function public.recovery_verify(
  p_phone  text,
  p_answer text
)
returns text
language plpgsql
security definer
set search_path = public, extensions, auth, private
as $$
declare
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_uid    uuid;
  v_row    private.recovery_secrets%rowtype;
  v_token  text;
begin
  if char_length(v_digits) < 10
     or char_length(btrim(coalesce(p_answer, ''))) < 2 then
    return null;
  end if;

  select id into v_uid from public.profiles where phone = v_digits limit 1;
  if v_uid is null then
    return null;
  end if;

  select * into v_row from private.recovery_secrets where user_id = v_uid;
  if not found then
    return null;
  end if;

  if not private.answer_matches(btrim(p_answer), v_row.answer_hash) then
    return null;
  end if;

  v_token := encode(extensions.hmac(
    v_uid::text || ':' || now()::text || ':' || encode(extensions.gen_random_bytes(8), 'hex'),
    private.hmac_secret(),
    'sha256'
  ), 'hex');

  insert into public.recovery_tickets (ticket_hash, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'),
          v_uid,
          now() + interval '15 minutes');

  return v_token;
end $$;

-- ==================================== 5) definir a nova senha ==============
-- Só quem tem ticket válido troca a senha. O hash gravado é bcrypt no mesmo
-- formato do GoTrue ($2a$10$…), então o login passa a aceitar a senha nova.
create or replace function public.recovery_reset(
  p_token        text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, auth, private
as $$
declare
  v_hash text := encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  v_row  public.recovery_tickets%rowtype;
begin
  if char_length(coalesce(p_new_password, '')) < 4 then
    raise exception 'weak_password';
  end if;

  select * into v_row
    from public.recovery_tickets
   where ticket_hash = v_hash
     and used_at is null
     and expires_at > now()
   limit 1;

  if not found then
    return false;
  end if;

  update auth.users
     set encrypted_password = private.hash_answer(p_new_password),
         updated_at         = now()
   where id = v_row.user_id;

  -- Uso único: queima o ticket mesmo se o update acima não casar linha alguma.
  update public.recovery_tickets set used_at = now() where ticket_hash = v_hash;

  return true;
end $$;

-- ================================================================== permissões
revoke all on function public.recovery_set_secret(text, text) from public;
revoke all on function public.recovery_my_secret()            from public;
revoke all on function public.recovery_hint(text)             from public;
revoke all on function public.recovery_verify(text, text)      from public;
revoke all on function public.recovery_reset(text, text)       from public;

grant execute on function public.recovery_set_secret(text, text) to authenticated;
grant execute on function public.recovery_my_secret()            to authenticated;
grant execute on function public.recovery_hint(text)             to anon, authenticated;
grant execute on function public.recovery_verify(text, text)      to anon, authenticated;
grant execute on function public.recovery_reset(text, text)       to anon, authenticated;
