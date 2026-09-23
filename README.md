# Perfil Vivo

SaaS pessoal minimalista — a trajetória viva de uma pessoa, registrada dia a dia.

Stack: **TanStack Start (React 19 + Vite) · Tailwind v4 · TanStack Query · Supabase (Postgres)**

## Arquitetura

```text
src/
  components/          # Componentes de UI reutilizáveis (Fase 2)
    profile-header.tsx   # Avatar, nome, cargo, banner personalizável + donut de finitude
    lifetime-tracker.tsx # Donut Memento Mori: 4 ciclos de 25 anos + cronômetro reverso
    daily-log-card.tsx   # Planejado / Executado / Resumo + trava 🔒 de 24h
    focus-card.tsx       # Metas semanais com barra de progresso %
    sidebar-nav.tsx      # Navegação lateral
  hooks/                 # Estado e lógica de dados (Fase 2)
    use-profile.ts       # Perfil + edição
    use-daily-logs.ts    # Livro de bordo + upsert
    use-lifetime.ts      # Idade, ciclos, % consumido, dias restantes (tick 60s)
    use-weekly-focus.ts  # Metas da semana
  services/
    profile-service.ts   # Fonte única de verdade: Supabase ⇄ repositório local
  repositories/
    profile-repository.ts# Persistência local (localStorage) enquanto não há credenciais
  lib/
    supabase.ts          # Client Supabase (ativado por env vars)
supabase/migrations/     # SQL: tabelas + trigger de Integridade Temporal + RLS
```

## Regra de Integridade Temporal (24h)

Cada registro diário nasce `OPEN`. Após salvar, entra em `VALIDATING` e, 24h depois
(`created_at` ou `log_date`), a **trigger no banco** muda o status para `LOCKED`
e o registro torna-se permanentemente somente leitura — histórico não é reescrito.
O client espelha a mesma regra (`computeStatus`) para o modo local.

## Rodando

```sh
npm install
npm run dev
```

## Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode `supabase/migrations/20260923000000_initial_schema.sql`.
3. Copie **Project URL** e **anon key** (Settings → API) para as variáveis de ambiente:

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Sem essas variáveis o app roda com o repositório local persistente (mesma forma de
dados). Com elas, toda leitura/escrita vai direto às tabelas SQL reais.

## Próximos passos sugeridos

- Autenticação Supabase (trocar policies singleton por `auth.uid()`)
- Upload de banner/avatar no Supabase Storage (hoje: URL ou arquivo local)
- Exportação do Currículo Vivo em PDF a partir de `career_chapters`
