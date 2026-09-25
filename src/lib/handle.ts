// ---------------------------------------------------------------------------
// Identificador público do perfil (perfilvivo.com/@handle).
//
// Derivado do nome em tempo de exibição — nunca guardado como fonte de verdade.
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
