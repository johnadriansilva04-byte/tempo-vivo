# Perfil Vivo

SaaS pessoal minimalista — a trajetória viva de uma pessoa, registrada dia a dia.

Stack: **TanStack Start (React 19 + Vite) · Tailwind v4 · TanStack Query · Supabase (Postgres)**

## Arquitetura

```text
src/
  components/          # Componentes de UI reutilizáveis (Fase 2)
    auth-screen.tsx      # Porta de entrada: criar conta / entrar (telefone + senha)
    auth-gate.tsx        # Porteiro: sem conta → entrada; primeiro acesso → criar história
    start-life-flow.tsx  # Primeira entrada: cria a história e a vida inicial
    profile-header.tsx   # Avatar, nome, cargo, banner personalizável + donut de finitude
    lifetime-tracker.tsx # Donut Memento Mori: 4 ciclos de 25 anos + cronômetro reverso
    daily-log-card.tsx   # Planejado / Executado / Resumo + trava 🔒 de 24h
    focus-card.tsx       # Metas semanais com barra de progresso %
    sidebar-nav.tsx      # Navegação lateral + conta logada
  hooks/                 # Estado e lógica de dados (Fase 2)
    use-auth.ts          # Conta logada, entrar/sair/criar (store local reativo)
    use-profile.ts       # Perfil + edição
    use-daily-logs.ts    # Livro de bordo + upsert
    use-lifetime.ts      # Idade de calendário, ciclos, % consumido, dias restantes (tick 60s)
    use-weekly-focus.ts  # Metas da semana
  services/
    onboarding-service.ts # Cria a vida inicial do usuário na primeira entrada
    profile-service.ts   # Fonte única de verdade: Supabase ⇄ repositório local
  repositories/
    profile-repository.ts# Persistência local por conta (localStorage)
  store/
    auth-store.ts        # Contas locais (hash de senha) + sessão persistente
  lib/
    life-story.ts        # Gerador da história inicial (prólogo, agenda, metas, marcos)
    local-user.ts        # Id do usuário logado (escopo do banco local)
    supabase.ts          # Client Supabase (ativado por env vars)
supabase/migrations/     # SQL: tabelas + trigger de Integridade Temporal + RLS
```

## Fluxo de entrada

1. **Criar conta** — telefone, senha, nome e idade.
2. **Primeira entrada** — duas opções:
   - *Começar com uma história base*: cria prólogo, registro do dia, 3 metas da semana,
     capítulos de currículo, marcos e projetos. Os trechos entre `[ ]` são esqueletos
     para o dono substituir pela vida real — nenhum fato é inventado.
   - *Começar do zero*: só nome e data de nascimento já preenchidos.
3. **Entrar** — telefone + senha; a sessão fica salva no navegador.
4. **Sair** — no rodapé da barra lateral ou em Configurações → Conta.

A idade informada define `birth_date` e o ciclo de 25 anos (Aprendizado, Construção,
Consolidação, Plenitude). Cada conta tem seu próprio banco local: a história de um
usuário nunca aparece no outro.

> **Sobre a senha**: as contas são locais a este navegador e a senha é guardada como
> hash SHA-256 com salt — nunca em texto puro. Isso habilita o fluxo completo de
> entrada, mas não substitui um provedor de identidade real (Supabase Auth). Enquanto
> o Supabase estiver configurado, todas as contas compartilham o registro singleton.

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

- Migrar o fluxo de entrada local para Supabase Auth (hoje: contas por telefone/senha no navegador)
- Upload de banner/avatar no Supabase Storage (hoje: URL ou arquivo local)
- Exportação do Currículo Vivo em PDF a partir de `career_chapters`
