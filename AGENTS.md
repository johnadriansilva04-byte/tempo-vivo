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

## Projetos por fases (execução sequencial)

Módulo "Execução por fases": projetos com resumo inicial, fases sequenciais
com bloqueio progressivo, missões adicionais, substituição de missão,
versionamento e registros de conclusão imutáveis.

- SQL: `supabase/migrations/20261011000000_project_execution_engine.sql`
  (tabelas, triggers de imutabilidade, RLS, RPCs atômicas
  `conclude_phase`/`conclude_mission`/`substitute_mission`).
- TS espelha o SQL: `src/types/projects.ts`, `src/repositories/project-repository.ts`
  (fallback local em `perfil-vivo:projects:v1`), `src/services/project-service.ts`,
  `src/hooks/use-projects.ts`, `src/components/projects/*`.
- Rotas: `/projetos` (layout com `<Outlet/>`) → `src/routes/projetos.index.tsx`
  (lista) e `src/routes/projetos.$projectId.tsx` (detalhe). Ao criar rota filha
  de `/projetos`, mantenha o `Outlet` no layout — senão o filho não renderiza.
- UI: `src/components/projects/phase-timeline.tsx` desenha a linha do tempo
  (nós conectados, estados distintos, motivo do bloqueio, data de arquivamento).
- Regras invioláveis: fase/missão concluída não pode ser editada nem apagada;
  correção vira registro complementar; substituição preserva a original e a
  vincula (`replaces_mission_id`); versão anterior nunca é sobrescrita.
- RLS: toda policy de tabela-filha valida `user_id` E posse do `project_id`
  (não basta checar `user_id`). A policy permissiva de `projects` da migration
  inicial foi derrubada e substituída por isolamento por usuário.

