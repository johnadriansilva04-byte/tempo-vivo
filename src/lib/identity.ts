// ---------------------------------------------------------------------------
// Identidade: telefone, e-mail sintético e data de nascimento.
//
// O Perfil Vivo entra por telefone + senha. O Supabase Auth trabalha com e-mail
// ou OTP por SMS; sem provedor de SMS usamos um e-mail sintético determinístico
// a partir dos dígitos do telefone, o que mantém o login simples e sem custo.
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

/** E-mail determinístico derivado do telefone (único por número). */
export function phoneToEmail(value: string): string {
  return `${normalizePhone(value)}@perfilvivo.local`;
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
