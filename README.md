# Tempo Vivo

# Plano — Perfil Vivo MVP



## Objetivo

Construir o MVP front-end do Perfil Vivo como um SaaS premium, minimalista e responsivo, com navegação lateral fixa e conteúdo mockado para representar a trajetória viva de uma pessoa.



## Escopo incluído

• Dashboard como tela inicial com foto, apresentação, objetivos, projetos, próximas atividades, realizações e estatísticas pessoais.

• Navegação lateral compacta sempre visível com: Dashboard, Agenda, Currículo, Planejamento, Realizações, Projetos, Sobre e Jogos.

• Troca de conteúdo principal por páginas/rotas funcionais, sem backend.

• Páginas completas para Agenda, Currículo, Planejamento, Realizações, Projetos, Sobre e Jogos.

• Página visual para Jogos, sem lógica de jogos ou integração.

• Seção visual de família e vínculos familiares preparada no produto, com dados mockados.

• Integridade histórica da Agenda com três estados visuais: Aberto, Em validação e Travado.

• Primazia da realidade: separar Planejado, Executado e Resumo como blocos independentes.

• Perfil público tratado como navegação pela trajetória humana, não como rede social ou portfólio.

• Design premium inspirado em Linear, Arc Browser, Notion, Raycast e Vercel.

• Estrutura preparada para troca futura de dados mockados por Supabase.



## Regra central da Agenda

A Agenda será tratada como livro de bordo da vida real, memória cronológica e registro histórico confiável, não como agenda tradicional.



Cada dia terá um estado claro:



• **Aberto:** dia atual, com aparência editável.

• **Em validação:** até 24 horas após o encerramento do dia, com indicação de prazo para correção.

• **Travado:** histórico permanente, somente leitura, com selo “Registro Histórico” ou “Arquivado”.



Cada registro diário manterá três blocos separados:



• **Planejado:** intenção do dia.

• **Executado:** realidade do que aconteceu.

• **Resumo:** interpretação narrativa daquele dia.



Mesmo com dados mockados, a interface demonstrará essa filosofia desde o MVP: o passado não pode ser reescrito indefinidamente.



## Estrutura preparada para dados futuros

Criar as pastas solicitadas, mesmo sem integração real:



```text

/src/services

/src/repositories

/src/types

/src/mock

/src/store

/src/lib

/supabase

```



A camada visual consumirá dados via repositórios mockados, deixando a futura troca para dados reais simples e localizada.



## Experiência do produto

• Visual limpo, elegante, sem poluição e sem aparência genérica.

• Layout de aplicativo SaaS maduro, com barra lateral pequena e área principal bem organizada.

• Cards, timelines, listas e indicadores com hierarquia clara.

• Interface responsiva para desktop, tablet e celular.

• Conteúdo em português, focado na ideia de “trajetória viva de uma pessoa”.

• O produto deve parecer um organismo vivo que ganha valor histórico com o tempo, não uma coleção de CRUDs.



## Páginas

• **Dashboard:** visão geral da pessoa, objetivos atuais, projetos ativos, agenda próxima, conquistas recentes e estatísticas.

• **Agenda:** memória cronológica com Planejado, Executado e Resumo separados; alternância visual entre dia, semana, mês e ano; estados Aberto, Em validação e Travado.

• **Currículo:** formação, experiências, certificados, habilidades, idiomas e produções em formato humano e compartilhável.

• **Planejamento:** objetivos, metas, roadmaps e progresso visual.

• **Realizações:** linha do tempo de marcos importantes.

• **Projetos:** projetos com nome, descrição, status, objetivo e histórico.

• **Sobre:** biografia, história, experiências, objetivos e núcleo familiar.

• **Jogos:** página visual indicando integrações futuras, sem mecânicas.



## Detalhes técnicos

• Usar TanStack Router com uma rota para cada área principal.

• Manter tudo front-end com dados mockados.

• Definir tokens visuais em `src/styles.css` usando Tailwind v4 e variáveis semânticas.

• Criar componentes reutilizáveis para layout, sidebar, cards, timelines, progresso e seções.

• Não criar autenticação, APIs, banco, pagamentos ou integrações.

• Adicionar metadados próprios por rota.



## Validação

• Conferir que a tela inicial não mantém o placeholder.

• Conferir navegação entre todas as páginas.

• Conferir os três estados da Agenda: Aberto, Em validação e Travado.

• Conferir responsividade básica em largura desktop e mobile.

• Conferir logs de build após a implementação.

e quando for pra iniciar a agenda o usuario pode iniciar com um resumo de todos os anos passados entendeu. tipo um texto gigante, porem fica como um pdf dentro do nosso app mas ele escreveu normal entendeu e expancivel ai apare



Aí aparece assim, o início da agenda aparece: "início". Relatório dos anos anteriores, que é o que o cara escreveu, tipo: "Eu nasci em tal dia, fiz tal coisa, viajei pra tal cidade, cheguei em tal lugar e agora eu estou aqui". Tipo isso, ele vai escrever. Daí que vai começar a agenda normal dele daquele dia que ele encontrou o aplicativo pra frente. Coloca só mais isso e aí vai ficar 100%, vai ficar aprovado # ATUALIZAÇÃO DE LAYOUT E MVP: Módulo de Finitude e Expectativa de Vida (Gráfico de Pizza 100 Anos)



Adicione uma nova funcionalidade e componente visual no Perfil Vivo dedicada à consciência e métrica de tempo de vida do usuário, localizada estrategicamente no cabeçalho do perfil.



## Posicionamento no Layout

• O componente deve ficar posicionado no cabeçalho/card principal do perfil, na **extremidade superior direita** (no espaço em branco ao lado da foto, do nome "Ana Costa" e da descrição/cargo de Pesquisador).

• Deve manter um visual limpo, elegante e integrado com a estética premium (estilo Vercel/Linear).



## Métrica e Indicador Visual (Gráfico em Fatia/Pizza)

• **Gráfico de Pizza (Donut / Segmentado):** Criar um indicador visual circular dividido em **4 blocos iguais de 25%** (representando cada ciclo de 25 anos até atingir a meta base de 100 anos).

• **Gamificação de Recorde:** Se o usuário ultrapassar os 100 anos, exibir a badge/conquista especial: "Recordista / Campeão do Tempo".



## Os 4 Ciclos de Vida (25 Anos Cada)

1. Primeiro Ciclo (0 a 25 anos): Aprendizado, Formação e Base.

2. Segundo Ciclo (25 a 50 anos): Construção, Execução e Legado Ativo.

3. Terceiro Ciclo (50 a 75 anos): Consolidação, Mentoria e Maturidade.

4. Quarto Ciclo (75 a 100 anos): Plenitude, História Preservada e Sabedoria.



## Lógica de Funcionamento e Destaque

1. **Identificação do Ciclo Atual:** O sistema deve ler a idade do perfil e preencher/destacar dinamicamente as fatias do gráfico:

   - Fatias passadas: indicadas como "Concluídas / Consumidas" (destacando que a maioria das pessoas desperdiça os primeiros 25 anos sem consciência temporal).

   - Fatia ativa: marcada com brilho ou destaque de "Ciclo em Andamento" com base na idade atual.

   - Fatias futuras: em estado opaco/bloqueado.

2. **Legenda e Cronômetro Dinâmico:** Logo abaixo ou ao lado do gráfico circular, incluir uma legenda compacta contendo:

   - O ciclo ativo no qual o usuário se encontra.

   - A % total de tempo consumido.

   - O tempo restante estimado para a meta dos 100 anos.



## Filosofia e Integração

• A fatia de pizza consome-se gradualmente conforme os dias da Agenda/Livro de Bordo vão sendo travados (🔒) ao longo dos anos.

-

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a6dc68d0-a265-4249-b63f-344b18a541c5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
