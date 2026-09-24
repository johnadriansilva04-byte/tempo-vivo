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
- Verificação antes de commitar: `npx tsc --noEmit`, `npm run lint`, `npx vitest run`,
  `npm run build`.
- UX não mostra tudo de uma vez: telas se organizam em blocos expansíveis usando
  `components/ui/disclosure.tsx` (padrão aplicado em Cadastro, Configurações,
  Agenda, Dashboard, Projetos, Realizações, Currículo e Planejamento). Abra por
  padrão só o que o usuário precisa agora (ex.: o dia de hoje na Agenda).
- Para testar a UI sem Supabase, remova temporariamente `.env.local`: o app cai no
  repositório local (localStorage por conta). Com `.env.local` presente ele exige
  Supabase em `127.0.0.1:54321`, que não existe neste ambiente.
