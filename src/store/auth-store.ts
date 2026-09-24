import type { Account, Session, SignInInput, SignUpInput } from "@/types/auth";
import { newId } from "@/repositories/profile-repository";

// ---------------------------------------------------------------------------
// Autenticação local do Perfil Vivo.
//
// O app é single-user local: as contas vivem no `localStorage` do navegador e a
// senha nunca é guardada em texto puro — só um hash SHA-256 com salt aleatório.
// Não substitui um provedor de identidade real (Supabase Auth), mas permite o
// fluxo completo de entrada: criar conta por telefone/senha/nome/idade, entrar,
// sair e manter a sessão entre recargas.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "perfil-vivo:auth:v1";

export type AuthDB = { accounts: Account[]; session: Session | null };

const EMPTY: AuthDB = { accounts: [], session: null };

let cache: AuthDB | null = null;
const listeners = new Set<() => void>();

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

/** Converte a idade informada no cadastro em data de nascimento aproximada. */
export function birthDateFromAge(age: number, now: Date = new Date()): string {
  const year = now.getFullYear() - age;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomSalt(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(16).slice(2).padEnd(32, "0");
}

/** SHA-256(salt + senha). Não é Argon2, mas nunca guardamos a senha em claro. */
async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (typeof crypto !== "undefined" && "subtle" in crypto) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Sem Web Crypto (contextos não seguros): hash simples só para não persistir texto puro.
  let h = 0;
  const text = `${salt}:${password}`;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `weak-${(h >>> 0).toString(16)}`;
}

function read(): AuthDB {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? ({ ...EMPTY, ...(JSON.parse(raw) as AuthDB) } as AuthDB) : { ...EMPTY };
  } catch {
    cache = { ...EMPTY };
  }
  return cache;
}

function write(db: AuthDB): void {
  cache = db;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* storage indisponível: mantém apenas em memória */
    }
  }
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  // Outra aba entrou/saiu: invalida o cache e re-renderiza.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    for (const listener of listeners) listener();
  });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): AuthDB {
  return read();
}

export function getServerSnapshot(): AuthDB {
  return EMPTY;
}

export type AuthResult = { ok: true; account: Account } | { ok: false; error: string };

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const password = input.password;

  if (name.length < 2) return { ok: false, error: "Informe seu nome completo." };
  if (!Number.isFinite(input.age) || input.age < 1 || input.age > 120)
    return { ok: false, error: "Informe uma idade entre 1 e 120 anos." };
  if (!isValidPhone(phone)) return { ok: false, error: "Informe um telefone com DDD válido." };
  if (password.length < 4) return { ok: false, error: "A senha precisa de ao menos 4 caracteres." };

  const db = read();
  if (db.accounts.some((a) => a.phone === phone))
    return { ok: false, error: "Já existe uma conta com este telefone." };

  const salt = randomSalt();
  const account: Account = {
    id: newId(),
    name,
    phone,
    age: Math.round(input.age),
    birth_date: birthDateFromAge(Math.round(input.age)),
    password_hash: await hashPassword(password, salt),
    password_salt: salt,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
  };

  write({
    accounts: [...db.accounts, account],
    session: { user_id: account.id, started_at: new Date().toISOString() },
  });
  return { ok: true, account };
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  const phone = normalizePhone(input.phone);
  const db = read();
  const account = db.accounts.find((a) => a.phone === phone);
  if (!account) return { ok: false, error: "Não encontramos uma conta com este telefone." };

  const hash = await hashPassword(input.password, account.password_salt);
  if (hash !== account.password_hash) return { ok: false, error: "Senha incorreta." };

  write({ ...db, session: { user_id: account.id, started_at: new Date().toISOString() } });
  return { ok: true, account };
}

export function signOut(): void {
  const db = read();
  write({ ...db, session: null });
}

export function completeOnboarding(): void {
  const db = read();
  const userId = db.session?.user_id;
  if (!userId) return;
  write({
    ...db,
    accounts: db.accounts.map((a) => (a.id === userId ? { ...a, onboarding_completed: true } : a)),
  });
}

export function updateAccount(userId: string, patch: Partial<Pick<Account, "name" | "age">>): void {
  const db = read();
  write({
    ...db,
    accounts: db.accounts.map((a) =>
      a.id === userId
        ? {
            ...a,
            ...patch,
            ...(patch.age !== undefined ? { birth_date: birthDateFromAge(patch.age) } : {}),
          }
        : a,
    ),
  });
}

export function currentAccount(db: AuthDB): Account | null {
  if (!db.session) return null;
  return db.accounts.find((a) => a.id === db.session?.user_id) ?? null;
}
