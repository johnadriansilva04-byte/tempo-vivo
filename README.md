# Perfil Vivo

Identidade digital viva da pessoa. Um link público único reúne a vida organizada:
quem é, o que faz, **hoje**, **amanhã**, projetos, realizações, disponibilidade
para reuniões e família. Não é rede social, não é feed: é vida real documentada.

Stack: **TanStack Start (React 19 + Vite) · Tailwind v4 · TanStack Query · Zod · Supabase (Postgres) · Bun**

## Conceito em uma frase

> Como uma pessoa pode organizar, documentar e compartilhar a própria vida de
> forma contínua — e como outra pessoa pode conhecer essa rotina sem perguntar
> tudo no WhatsApp?

## Arquitetura (código atual)

```text
src/
  routes/                  # Rotas file-based (routeTree.gen.ts é auto-gerado)
    index.tsx              # /        Dashboard (HOJE/AMANHÃ, próximo compromisso)
    agenda.tsx             # /agenda  Núcleo: recorrências, exceções, reuniões, histórico
    familia.tsx            # /família Família (telefone → vínculo por ID ou convite)
    u.$slug.tsx            # /u/:slug Janela PÚBLICA do visitante (fora da sidebar)
    curriculo|planejamento|realizacoes|projetos|sobre|jogos|configuracoes
  components/
    pages.tsx              # AgendaPage, ResumePage, PlanningPage, Achievements, Projects, About, Games
    dashboard.tsx          # Dashboard com dados reais (agenda, projetos, disponibilidade, stats)
    schedule-kit.tsx       # DayAgenda, OccurrenceRow, WeekdayPicker, CommitmentList
    agenda-planner.tsx     # CRUD de compromissos fixos + exceções + eventos pontuais
    meeting-requests-panel.tsx # Aceitar / Recusar / Propor outro horário
    family-manager.tsx     # Adicionar familiar por celular, graus, privacidade, legado
    public-profile-page.tsx# Janela pública: HOJE/AMANHÃ, slots, solicitar reunião
    public-settings.tsx    # Config: link público, privacidade, reuniões, disponibilidade
  hooks/                   # use-schedule, use-availability, use-meeting-requests,
                           # use-family, use-public-profile + domínios da fase 1
  lib/
    schedule.ts            # Motor PURO de agenda: ocorrências, slots livres, slug, telefone
    validators.ts          # Zod: todos os domínios antes de persistir
    query-keys.ts          # qk.* centralizado
    database.types.ts      # Tipos Database manuais + SINGLETON_USER_ID (sem auth)
    supabase.ts            # Client + fallback de rede
  services/profile-service.ts   # Fonte única: Supabase ⇄ repositório local
  repositories/profile-repository.ts # localStorage v3 (persistência real no modo local)
supabase/migrations/       # SQL idempotente (5 migrations)
```

## Regras de negócio centrais

1. **Agenda = núcleo.** Compromissos fixos recorrentes (regra: dias + horário)
   geram as ocorrências diárias; **exceções** alteram só uma ocorrência (folga
   numa quarta) sem destruir a regra; eventos pontuais entram no dia exato.
2. **Disponibilidade é manual.** O dono escolhe dia a dia, horário inicial/fim,
   duração, intervalo e máximo por dia. O sistema **não decide sozinho**.
3. **Slots livres = fixos + eventuais + reuniões aceitas + regras.** O visitante
   só vê horários realmente livres (`lib/schedule.ts` calcula).
4. **Solicitação de reunião.** Visitante envia data/hora/nome/contato/motivo →
   dono ACEITA (entra na agenda e o slot some), RECUSA ou PROPÕE OUTRO HORÁRIO.
5. **Histórico permanente (24h).** `daily_logs` nasce OPEN → VALIDATING →
   LOCKED por trigger no banco; o client espelha (`computeStatus`).
6. **Família por telefone.** Número descobre conta existente → vínculo pelo ID
   único; sem conta → convite PENDING, **nunca conta falsa**; a relação é
   confirmada. Privacidade por relação: PÚBLICO / FAMÍLIA / PRIVADO.
7. **Link público** (`/u/:slug`) é uma janela com privacidade configurável —
   agenda, projetos, realizações e família aparecem só se o dono ligar.

## Persistência

Sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` o app roda em **modo local**
(localStorage `perfil-vivo:db:v3`, mesma forma de dados). Com as env vars, toda
leitura/escrita vai às tabelas SQL reais. Export/import JSON (Configurações)
cobre todos os domínios (cápsulas ficam de fora por integridade temporal).

## Banco (Supabase)

1. Crie o projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, rode as 5 migrations de `supabase/migrations/` em ordem
   (`20260923000000` → `20260928000000`), todas idempotentes.
3. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Settings → Environment.

Sem auth (modo singleton): RLS aberta; ao ativar Supabase Auth, troque as
policies por `user_id = auth.uid()` e o vínculo familiar por convite confirmado.

## Desenvolvimento

```sh
bun install
bun run dev        # gerenciado pelo Freebuff (não iniciar manualmente)
bun tsc -b --noEmit
bunx eslint src --fix
```

Rotas novas: crie o arquivo em `src/routes/` e regenere a árvore com
`bunx @tanstack/router-cli generate` (nunca edite `routeTree.gen.ts` à mão).
