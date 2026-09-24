-- ============================================================================
-- Perfil Vivo — Migration 6: conserta a troca de senha
--
-- Duas coisas erradas na primeira versão, uma delas grave.
--
-- 1. GRAVE: recovery_reset gravava a senha passando por private.hash_answer, que
--    normaliza (minúsculas, sem acento). Quem definisse "MinhaSenhaTop123"
--    recebia a senha "minhasenhatop123" — o reset dizia sucesso, mas o login com
--    a senha escolhida falhava. Agora a senha é usada exatamente como digitada;
--    normalização existe para RESPOSTA secreta, onde a intenção é ser tolerante,
--    e nunca para senha, onde a intenção é ser exata.
--
-- 2. Trocada a senha, as sessões antigas continuavam válidas. Quem troca a senha
--    normalmente está fazendo isso justamente porque alguém invadiu. Agora o
--    reset derruba todas as sessões e refresh tokens da conta — o mesmo que a
--    admin API oficial do GoTrue faz.
--
-- A gravação continua sendo bcrypt no formato que o GoTrue lê ($2a$10$…). Para
-- isso não quebrar em silêncio numa atualização futura, o formato é conferido
-- em runtime: se mudar, a função falha alto em vez de gravar um hash inválido.
-- ============================================================================

-- Hash de SENHA: nunca normaliza. Separado de private.hash_answer (que existe
-- para resposta secreta) para que ninguém confunda os dois usos.
create or replace function private.hash_password(value text)
returns text
language sql
immutable
set search_path = extensions
as $$
  select extensions.crypt(value, extensions.gen_salt('bf', 10));
$$;

revoke all on function private.hash_password(text) from public, anon, authenticated;

-- Formato que o GoTrue espera em auth.users.encrypted_password.
create or replace function private.is_gotrue_password_hash(value text)
returns boolean
language sql
immutable
as $$
  select value ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$';
$$;

revoke all on function private.is_gotrue_password_hash(text) from public, anon, authenticated;

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
  v_hash      text := encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  v_row       public.recovery_tickets%rowtype;
  v_password  text := coalesce(p_new_password, '');
  v_pw_hash   text;
begin
  if char_length(v_password) < 4 then
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

  -- Senha exatamente como digitada — sem lower(), sem remover acento.
  v_pw_hash := private.hash_password(v_password);

  if not private.is_gotrue_password_hash(v_pw_hash) then
    raise exception 'unexpected_password_hash_format';
  end if;

  update auth.users
     set encrypted_password = v_pw_hash,
         updated_at         = now()
   where id = v_row.user_id;

  --Derruba sessões antigas: trocar a senha precisa expulsar quem já estava dentro.
  -- Em auth.refresh_tokens o user_id é varchar; em auth.sessions é uuid.
  delete from auth.refresh_tokens where user_id = v_row.user_id::text;
  delete from auth.sessions       where user_id = v_row.user_id;

  -- Uso único: queima o ticket mesmo se o update acima não casar linha alguma.
  update public.recovery_tickets set used_at = now() where ticket_hash = v_hash;

  return true;
end $$;

revoke all on function public.recovery_reset(text, text) from public;
grant execute on function public.recovery_reset(text, text) to anon, authenticated;
