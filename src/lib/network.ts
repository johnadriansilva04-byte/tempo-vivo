// ---------------------------------------------------------------------------
// Rede — busca e caminho público dos perfis.
//
// A filtragem é pura: o componente só entrega a lista e o termo digitado.
// Compara nome, @handle, atuação e cidade, tolerando acentos e caixa — quem
// procura "joao" encontra "João".
// ---------------------------------------------------------------------------

import { deaccent, normalizeHandle } from "@/lib/handle";

export type SearchablePerson = {
  handle: string;
  name: string;
  role: string;
  location: string;
};

function fold(value: string): string {
  return deaccent(value).toLowerCase().trim();
}

/** O perfil casa com o termo? Termo vazio casa com todos. */
export function matchesTerm(person: SearchablePerson, term: string): boolean {
  const folded = fold(term);
  if (folded === "") return true;
  const handle = normalizeHandle(term);
  return (
    fold(person.name).includes(folded) ||
    fold(person.role).includes(folded) ||
    fold(person.location).includes(folded) ||
    (handle !== "" && person.handle.includes(handle))
  );
}

/** Filtra a rede preservando a ordem recebida. */
export function filterPeople<T extends SearchablePerson>(people: T[], term: string): T[] {
  return people.filter((person) => matchesTerm(person, term));
}

/** Caminho interno do perfil público (`/@handle`). */
export function profilePath(handle: string): string {
  return `/@${normalizeHandle(handle)}`;
}
