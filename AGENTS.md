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

## Convenções do repositório

- Autenticação é **somente telefone + senha**; o e-mail (`<telefone>@perfilvivo.invalid`)
  é interno e nunca aparece na UI. Recuperação de senha é orgânica: telefone →
  pergunta secreta → nova senha, tudo via Supabase Auth.
- Toda leitura/escrita de dados passa por `src/services/profile-service.ts`, que
  escolhe Supabase (quando `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` existem) ou
  o repositório local. Não acesse tabelas direto de componentes.
- Componentes grandes vivem em pastas com arquivos pequenos: `components/auth/`,
  `components/config/`, `components/pages/`. Cada pasta tem um arquivo de entrada
  que monta a tela e módulos burros ao redor (sem lógica de dados).
- O primeiro capítulo vive em `components/onboarding/`: `copy.ts` (todo o texto),
  `threshold.tsx`, `ritual-question.tsx`, `seal-preview.tsx`. O orquestrador é
  `components/start-life-flow.tsx`, que decide qual tela mostrar e guarda as
  respostas — os módulos não conhecem o passo anterior nem o próximo.
- A copy do cadastro fica em `components/auth/copy.ts`; a validação dos três
  blocos (identidade, acesso, retorno) fica em `lib/signup-progress.ts`, uma
  função pura por bloco. Não replique essas regras dentro dos formulários.
- Texto de UI tem tom de marketing: frases curtas, benefício antes do mecanismo,
  sem jargão técnico e sem prometer o que o app não faz.
- Verificação antes de commitar: `npx tsc --noEmit`, `npm run lint`, `npx vitest run`,
  `npm run build`.
- UX não mostra tudo de uma vez: telas se organizam em blocos expansíveis usando
  `components/ui/disclosure.tsx` (padrão aplicado em Cadastro, Configurações,
  Agenda, Dashboard, Projetos, Realizações, Currículo e Planejamento). Abra por
  padrão só o que o usuário precisa agora (ex.: o dia de hoje na Agenda).
- Para testar a UI sem Supabase, remova temporariamente `.env.local`: o app cai no
  repositório local (localStorage por conta). Com `.env.local` presente ele exige
  Supabase em `127.0.0.1:54321`, que não existe neste ambiente.
- Acessibilidade é requisito, não enfeite: cor de texto precisa passar no WCAG AA
  sobre `background` **e** `card` (meça em oklch antes de escolher). Todo overlay
  (menu mobile, gaveta) usa `hooks/use-overlay-behavior.ts` para ESC, trava de
  rolagem e retorno de foco, e fica `inert` quando fora da tela.
- A suíte roda em ambiente `node` (`vitest.config.ts`) e só cobre lógica pura em
  `src/**/*.test.ts` — não há jsdom/testing-library. Comportamento de componente
  (React) é validado no navegador, não em teste unitário; se for adicionar testes
  de UI, é preciso trazer a infra de DOM primeiro.

## Arquitetura das ferramentas (mostrar > explicar)

Mapa fixo das telas — não volte a embrulhar estas páginas em narrativa:

- **Agenda = calendário real** (`components/agenda/`): grade mensal, alternância
  Mês/Semana/Hoje, painel do dia com CRUD de compromisso. A lógica pura da grade
  mora em `lib/calendar.ts` (datas locais `yyyy-mm-dd`, sem fuso; testes em
  `lib/calendar.test.ts`).
- **Currículo = linha do tempo da vida** (`components/pages/resume.tsx`): ano +
  acontecimento + uma linha de contexto. Sem blocos longos.
- **Realizações = vitrine de conquistas** (`components/pages/achievements.tsx`):
  cartões simples, só ano/título/categoria.
- **Projetos** (`components/pages/projects.tsx`): cartão com nome, status,
  progresso, link e "Abrir projeto".
- **Hoje/Dashboard** (`components/dashboard.tsx`): próximo compromisso, projeto
  principal, meta da semana, última realização e um resumo numérico. Sem capítulos.
- **Perfil público** (`components/public/`): compartilhável em `/@{handle}` e
  listado na Rede em `/rede`. `PublicProfileView` é a mesma vitrine para o dono
  (em Sobre) e para o visitante: números no topo, abas Agenda/Feitos/Projetos/
  Dados, agenda expansível (`public-agenda.tsx`). O handle é guardado no perfil e
  derivado do nome quando vazio (`lib/handle.ts`: `resolveHandle`/`sameHandle`);
  `ensurePublicHandle()` persiste na primeira visita a Sobre, senão o link
  compartilhado cai em "não encontrado". `publishToNetwork()` espelha o perfil no
  diretório local; a busca da Rede é pura em `lib/network.ts`. No modo visitante,
  `routes/__root.tsx` pula `AuthGate`/`AppShell` para `/@*` e `/rede`.
  No Supabase, a view `public_profiles` (migrations `20260926000000_*` e
  `20260928000000_*`) expõe os campos públicos e agrega milestones/projects/
  chapters/agenda/focus; o trigger `profiles_set_handle` preenche o handle.

Mutação de dados sempre via hooks React Query (`use-agenda-events.ts`,
`use-projects.ts`, `use-milestones.ts`, ...) com `invalidateQueries` no
`onSuccess`; a lista atualiza sozinha. Ao validar no navegador, cuidado:
`browser_get_content` pode devolver um snapshot em cache — confirme reatividade
com `browser_get_state` (lista de elementos) em vez de conteúdo.

`lib/life-story.ts` e `lib/placeholder.ts` NÃO são resquício narrativo: o
primeiro gera a vida inicial do onboarding e define os quatro `CYCLES` usados em
Planejamento; o segundo interpreta textos `[entre colchetes]` gravados por contas
antigas. Não remova nenhum dos dois sem substituir quem os importa.

