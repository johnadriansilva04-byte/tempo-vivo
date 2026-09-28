# Perfil Vivo — estado e próximos passos

Documento vivo: reflete o **código atual**, não ideias antigas.

## Concluído

- [x] Design system dark premium (Tailwind v4 + tokens oklch) e shell de navegação
- [x] Persistência real com dupla via: Supabase ⇄ localStorage (v3), export/import JSON
- [x] Regra de Integridade Temporal (OPEN → VALIDATING → LOCKED em 24h) no banco e no client
- [x] Currículo, Projetos, Realizações, Planejamento, Sobre, Cápsulas do Tempo — CRUD persistido
- [x] **Agenda real**: compromissos fixos recorrentes + exceções pontuais + eventos
- [x] **Disponibilidade pública** por dia da semana (manual) + cálculo automático de slots livres
- [x] **Solicitações de reunião**: visitante solicita → aceitar / recusar / propor outro horário
- [x] **Visão HOJE/AMANHÃ** no Dashboard, na Agenda e no perfil público
- [x] **Link público** `/u/:slug` com privacidade em camadas (agenda/projetos/realizações/família)
- [x] **Família**: adição por celular (vínculo por ID ou convite), graus, privacidade por relação
- [x] Dashboard com dados reais: próximo compromisso, próximas atividades, disponibilidade, estatísticas
- [x] Migração de storage v2 → v3 e migrations SQL idempotentes (5 arquivos)
- [x] Wiki/README coerente com a arquitetura atual

## Próximos passos (reais, em ordem)

- [ ] Autenticação Supabase (trocar singleton + RLS aberta por `auth.uid()`)
- [ ] Confirmação de convite familiar pela própria pessoa (via telefone autenticado)
- [ ] Avisos de solicitação de reunião (e-mail/SMS quando chegar pedido)
- [ ] Histórico mensal/agenda de futuro além dos 7 dias (visual calendário)
- [ ] Exportação de currículo em PDF a partir de `career_chapters`
- [ ] Área **Legado**: sucessão de acesso, backup automático e portabilidade
