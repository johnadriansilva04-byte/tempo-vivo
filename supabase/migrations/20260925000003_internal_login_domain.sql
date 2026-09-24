-- ============================================================================
-- Perfil Vivo — Migration 7: renomeia o login interno para o domínio reservado
--
-- O login interno das contas usava `<telefone>@perfilvivo.local`. `.local` é o
-- sufixo do mDNS (RFC 6762), feito para nomes de máquina na rede local — nada a
-- ver com pessoas, e alguns validadores tratam como endereço de rede. Trocamos
-- por `.invalid` (RFC 2606), reservado de propósito para nunca resolver e nunca
-- pertencer a ninguém.
--
-- O e-mail é a chave que o GoTrue usa para reconhecer a conta, então o rename
-- precisa tocar auth.users e auth.identities juntos, na mesma transação. É uma
-- renomeação de dados, feita uma vez; o app daqui em diante já nasce em `.invalid`.
--
-- Sem renomear, as contas antigas deixariam de conseguir entrar: o cliente deriva
-- o login do telefone e passaria a procurar `<telefone>@perfilvivo.invalid`.
-- ============================================================================

update auth.users
   set email                  = replace(email, '@perfilvivo.local', '@perfilvivo.invalid'),
       email_change           = coalesce(replace(email_change, '@perfilvivo.local', '@perfilvivo.invalid'), email_change),
       email_change_token_new = '',
       updated_at             = now()
 where email like '%@perfilvivo.local';

update auth.identities
   set identity_data = jsonb_set(
                         identity_data,
                         '{email}',
                         to_jsonb(replace(identity_data->>'email', '@perfilvivo.local', '@perfilvivo.invalid')),
                         true
                       ),
       updated_at    = now()
 where provider = 'email'
   and identity_data->>'email' like '%@perfilvivo.local';
