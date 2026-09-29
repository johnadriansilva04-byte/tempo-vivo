<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Notas do repositório (Perfil Vivo / tempo-vivo)

Stack: TanStack Start + React 19 + Vite + Tailwind 4 + Supabase. Sem Supabase
configurado (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`), o app roda em modo
local no `localStorage`.

Comandos:

- `npm run dev` (porta 8080), `npx vitest run`, `npx tsc -b --noEmit`, `npx eslint .`, `npm run build`.

Persistência local: chave atual `perfil-vivo:db:v4` (`src/repositories/profile-repository.ts`).
`load()` migra `v3`/`v2`/`v1` para `v4` e apaga as antigas — se mexer no shape
do `LocalDB`, suba a versão e adicione a chave antiga em `LEGACY_KEYS`.

Migrações SQL (`supabase/migrations/`): aplicadas em ordem de nome de arquivo, e
o Supabase roda cada arquivo numa transação única. Então:

- uma FK não pode apontar para tabela criada mais abaixo no mesmo arquivo — o
  erro aborta o arquivo inteiro e nenhuma tabela dele é criada;
- toda migração deve ser idempotente (`if not exists`, `do $$ ... exception when duplicate_object`);
- `supabase/migrations.test.ts` valida a ordem das FKs sem precisar de banco.

Para validar migração em Postgres real: `sudo dockerd &`, subir `postgres:16` e
aplicar `20260923000000..` em ordem. O schema do Supabase precisa de um
bootstrap mínimo antes (`auth.users`, `auth.uid()`, `storage.buckets`,
`storage.objects`, roles `anon`/`authenticated`/`service_role`).

A agenda é servida por `src/services/profile-service.ts`, que usa
`SINGLETON_USER_ID` (modo single-user); erros não-transitórios (`UNKNOWN`,
`FORBIDDEN`) são relançados e NÃO caem no fallback local.

