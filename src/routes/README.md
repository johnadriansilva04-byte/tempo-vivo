# Routes

TanStack Start usa **file-based routing**. Cada `.tsx` deste diretório vira uma
rota. Não crie `src/pages/`, `app/layout.tsx` nem outras convenções de
Next.js/Remix — o único layout raiz é `src/routes/__root.tsx`.

## Rotas do Perfil Vivo

| Arquivo | URL | O que renderiza |
| --- | --- | --- |
| `index.tsx` | `/` | Dashboard (HOJE/AMANHÃ, próximo compromisso, stats) |
| `agenda.tsx` | `/agenda` | Núcleo: recorrências, exceções, reuniões, histórico |
| `curriculo.tsx` | `/curriculo` | Currículo vivo |
| `planejamento.tsx` | `/planejamento` | Metas da semana + panorama do ano |
| `realizacoes.tsx` | `/realizacoes` | Realizações (histórico organizado) |
| `projetos.tsx` | `/projetos` | Projetos ativos |
| `sobre.tsx` | `/sobre` | Apresentação + família conectada |
| `familia.tsx` | `/familia` | Família: telefone, graus, privacidade, legado |
| `jogos.tsx` | `/jogos` | Módulo visual (Cápsulas do Tempo) |
| `configuracoes.tsx` | `/configuracoes` | Perfil, link público, privacidade, reuniões |
| `u.$slug.tsx` | `/u/:slug` | **Janela pública** do visitante (sem sidebar) |

## Convenções

- Parâmetros dinâmicos usam `$` sem chaves: `u.$slug.tsx` → `/u/$slug`.
- `routeTree.gen.ts` é **auto-gerado** — nunca edite à mão. Após criar/remover
  uma rota, regenere com `bunx @tanstack/router-cli generate`.
- O shell condicional (sidebar privada × página pública limpa) vive em
  `__root.tsx` e decide por `pathname.startsWith("/u/")`.
- Metadados de cada rota ficam no `head` do próprio arquivo de rota.
