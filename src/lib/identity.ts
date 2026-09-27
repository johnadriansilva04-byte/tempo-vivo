// ---------------------------------------------------------------------------
// Identidade: telefone, login interno e data de nascimento.
//
// O Perfil Vivo entra por telefone + senha. O Supabase Auth só aceita e-mail ou
// OTP por SMS — e auth por telefone exige um provedor de SMS pago, que não está
// configurado (`phone_provider_disabled`). Então o login usa um e-mail interno
// determinístico derivado dos dígitos do telefone.
//
// Esse e-mail é um detalhe de implementação, não algo que a pessoa veja ou
// digite. O domínio `.invalid` é reservado por RFC 2606: ele nunca resolve e
// nunca pode ser confundido com um endereço real.
// ---------------------------------------------------------------------------

/** Telefone normalizado: apenas dígitos (ex.: "11987654321"). */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

/** Formata para exibição: (11) 98765-4321. */
export function formatPhone(value: string): string {
  const d = normalizePhone(value);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function isValidPhone(value: string): boolean {
  const d = normalizePhone(value);
  return d.length === 10 || d.length === 11;
}

/**
 * Domínio reservado para o login interno (RFC 2606). Não é um provedor de
 * e-mail: nada é enviado para cá e nenhum endereço real usa este sufixo.
 */
export const INTERNAL_LOGIN_DOMAIN = "perfilvivo.invalid";

/**
 * Login interno derivado do telefone (único por número).
 *
 * O nome do parâmetro e a função existem para deixar claro que isto NÃO é um
 * e-mail da pessoa — é a chave que o Supabase Auth usa para reconhecer a conta.
 */
export function phoneToEmail(value: string): string {
  return `${normalizePhone(value)}@${INTERNAL_LOGIN_DOMAIN}`;
}

/** Converte a idade informada no cadastro em data de nascimento aproximada. */
export function birthDateFromAge(age: number, now: Date = new Date()): string {
  const year = now.getFullYear() - age;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Iniciais a partir do nome — Nome Sobrenome → "NS". */
export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}
