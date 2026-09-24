-- ============================================================================
-- Perfil Vivo — Migration 5: limite de tentativas na pergunta secreta
--
-- Sem e-mail, a pergunta secreta é a única porta dos fundos da conta. Só que
-- "Cidade onde nasceu" ou "Nome do primeiro cachorro" têm um espaço de
-- respostas pequeno o bastante para alguém chutar em sequência. Esta migration
-- fecha essa porta: cinco respostas erradas em quinze minutos e a conferência
-- para de responder, mesmo para a resposta certa.
--
-- O contador vive em `private`, fora do PostgREST. A janela é reiniciada na
-- primeira resposta certa, para quem só errou por distração não ficar travado.
-- ============================================================================

create table if not exists private.recovery_attempts (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  failed_count   int not null default 0,
  window_started timestamptz not null default now()
);

revoke all on private.recovery_attempts from anon, authenticated;

-- Limite e duração num só lugar, para as funções não divergirem.
create or replace function private.recovery_max_attempts()
returns int
language sql
immutable
as $$ select 5; $$;

create or replace function private.recovery_window()
returns interval
language sql
immutable
as $$ select interval '15 minutes'; $$;

revoke all on function private.recovery_max_attempts() from public, anon, authenticated;
revoke all on function private.recovery_window()       from public, anon, authenticated;

-- ============================ conferir a resposta → ticket (com trava) ======
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
  v_att    private.recovery_attempts%rowtype;
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

  -- Trava: dentro da janela, esgotou as tentativas, para aqui. Devolver null
  -- (e não uma exceção) mantém a resposta indistinguível de "errou".
  select * into v_att from private.recovery_attempts where user_id = v_uid;
  if found
     and v_att.window_started > now() - private.recovery_window()
     and v_att.failed_count >= private.recovery_max_attempts() then
    return null;
  end if;

  select * into v_row from private.recovery_secrets where user_id = v_uid;
  if not found then
    return null;
  end if;

  if not private.answer_matches(btrim(p_answer), v_row.answer_hash) then
    insert into private.recovery_attempts (user_id, failed_count, window_started)
    values (v_uid, 1, now())
    on conflict (user_id) do update
      set failed_count = case
            when private.recovery_attempts.window_started > now() - private.recovery_window()
              then private.recovery_attempts.failed_count + 1
            else 1
          end,
          window_started = case
            when private.recovery_attempts.window_started > now() - private.recovery_window()
              then private.recovery_attempts.window_started
            else now()
          end;
    return null;
  end if;

  -- Acertou: a janela de erros deixa de existir.
  delete from private.recovery_attempts where user_id = v_uid;

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

revoke all on function public.recovery_verify(text, text) from public;
grant execute on function public.recovery_verify(text, text) to anon, authenticated;
