// ---------------------------------------------------------------------------
// Formato do formulário de Configurações e o ponto de partida vazio. Fica à
// parte do componente para que o estado inicial não dependa do JSX.
// ---------------------------------------------------------------------------

export type ProfileDraft = {
  name: string;
  role: string;
  location: string;
  bio: string;
  birth_date: string;
  target_lifespan: number;
  avatar_url: string;
  cover_url: string;
};

export const emptyProfileDraft: ProfileDraft = {
  name: "",
  role: "",
  location: "",
  bio: "",
  birth_date: "",
  target_lifespan: 100,
  avatar_url: "",
  cover_url: "",
};

/** Iniciais do nome, para o avatar quando não há foto. */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
