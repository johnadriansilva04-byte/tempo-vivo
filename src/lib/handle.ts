// ---------------------------------------------------------------------------
// Identificador público do perfil (perfilvivo.com/@handle).
//
// Guardado no perfil, mas derivado do nome quando ainda está vazio — assim o
// link funciona sem configuração e nunca cai em "não encontrado".
// Regra única: minúsculas, sem acentos, só letras/números/hífen.
// ---------------------------------------------------------------------------

/** Remove acentos e cedilha para permitir um slug ASCII estável. */
export function deaccent(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/gi, "c");
}

/** Nome → handle público. "João Adrián" → "joao-adrian". */
export function handleFromName(name: string): string {
  return deaccent(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/** Normaliza um handle digitado (sem @, minúsculo, sem caractere inválido). */
export function normalizeHandle(value: string): string {
  return handleFromName(value.replace(/^@/, ""));
}

/** Handle válido para a URL pública? */
export function isValidHandle(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value);
}

/**
 * Handle efetivo de um perfil: o guardado quando existe, senão o derivado do
 * nome. O `handle` guardado é só uma foto — o nome continua sendo a verdade.
 */
export function resolveHandle(person: { handle?: string; name?: string }): string {
  const stored = normalizeHandle(person.handle ?? "");
  if (stored) return stored;
  return handleFromName(person.name ?? "");
}

/** Dois handles apontam para o mesmo perfil? Tolerante a @, caixa e acentos. */
export function sameHandle(a: string, b: string): boolean {
  return normalizeHandle(a) !== "" && normalizeHandle(a) === normalizeHandle(b);
}
