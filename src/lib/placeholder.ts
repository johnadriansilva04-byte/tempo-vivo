// ---------------------------------------------------------------------------
// Texto de convite vs. texto do dono.
//
// Contas criadas antes do ritual de entrada guardam trechos entre [colchetes]
// que serviam de espaço a preencher. Exibir o colchete cru parece app quebrado;
// aqui esses trechos são reconhecidos e apresentados como convite, em tom mais
// suave, sem alterar o dado armazenado.
// ---------------------------------------------------------------------------

const BRACKET = /\[[^\]]*\]/;

/** O trecho ainda é um convite do app (contém [colchetes])? */
export function isPlaceholderText(text: string): boolean {
  return BRACKET.test(text);
}

/** Remove os colchetes para leitura natural: "[cidade]" → "cidade". */
export function stripPlaceholderBrackets(text: string): string {
  return text.replace(/\[([^\]]*)\]/g, "$1").trim();
}

/** Texto legível: sem colchetes e sem espaços duplicados nas junções. */
export function readableText(text: string): string {
  return stripPlaceholderBrackets(text)
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;])/g, "$1");
}
