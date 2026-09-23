import type { AgendaEntry, Milestone, Profile, Project } from "@/types/profile";

export const profile: Profile = { name: "Ana Costa", role: "Pesquisadora de futuros humanos", location: "São Paulo, Brasil", age: 34, initials: "AC", bio: "Investigo como escolhas, memória e tecnologia transformam vidas ao longo do tempo." };
export const agenda: AgendaEntry[] = [
 { date: "23 SET", weekday: "Hoje", state: "Aberto", planned: ["Revisar pesquisa sobre longevidade", "Caminhar no parque às 17h"], executed: ["Entrevista com o grupo de pesquisa"], summary: "Um dia ainda em construção. A conversa da manhã abriu uma nova hipótese para o estudo." },
 { date: "22 SET", weekday: "Terça-feira", state: "Em validação", planned: ["Escrever duas páginas", "Ligar para minha mãe"], executed: ["Escrevi três páginas", "Jantar em família"], summary: "Produzi mais do que esperava e terminei o dia perto de quem importa." },
 { date: "18 SET", weekday: "Sexta-feira", state: "Travado", planned: ["Apresentar o projeto Memória Viva"], executed: ["Apresentação concluída", "Convite para nova parceria"], summary: "Um marco profissional: a pesquisa deixou o caderno e encontrou outras pessoas." },
];
export const projects: Project[] = [
 { name: "Atlas da Memória", description: "Arquivo narrativo de histórias familiares e lugares.", status: "Em andamento", progress: 68, objective: "Preservar 120 relatos até dezembro" },
 { name: "Cartas para 2040", description: "Ensaio sobre escolhas presentes e futuros possíveis.", status: "Pesquisa", progress: 42, objective: "Concluir a primeira versão" },
 { name: "Casa de Dentro", description: "Documentário sobre identidade, casa e pertencimento.", status: "Planejado", progress: 15, objective: "Finalizar roteiro e entrevistas" },
];
export const milestones: Milestone[] = [
 { year: "2026", title: "Pesquisa selecionada", description: "Atlas da Memória entrou no programa internacional de futuros humanos.", category: "Pesquisa" },
 { year: "2024", title: "Mestrado concluído", description: "Defesa da dissertação sobre memória coletiva e cidades.", category: "Formação" },
 { year: "2021", title: "Primeira exposição", description: "Curadoria de 42 relatos de moradores do centro de São Paulo.", category: "Cultura" },
 { year: "2018", title: "Uma nova cidade", description: "Mudança para São Paulo e início da trajetória em pesquisa.", category: "Vida" },
];
export const lifePrologue = `Nasci em 1992, numa manhã de verão, em uma família que sempre guardou histórias à mesa. Cresci entre livros, fotografias e viagens curtas pelo interior. Aos dezessete anos, mudei de cidade para estudar e descobri que os lugares também vivem dentro da gente.\n\nTrabalhei, errei, recomecei. Conheci pessoas que mudaram a direção da minha vida, viajei por cidades que ainda aparecem nos meus sonhos e aprendi a olhar para o tempo não como uma linha, mas como uma coleção de escolhas. Em 2018 cheguei a São Paulo. Em 2024 concluí meu mestrado. Hoje começo este registro para que os próximos dias não desapareçam sem deixar sentido.\n\nEste relatório reúne, com honestidade, tudo que consigo lembrar dos anos anteriores. Não pretende ser uma cronologia perfeita; é o ponto de partida da minha memória consciente.`;
