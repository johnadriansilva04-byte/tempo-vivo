export type AgendaState = "Aberto" | "Em validação" | "Travado";
export type AgendaEntry = { date: string; weekday: string; state: AgendaState; planned: string[]; executed: string[]; summary: string };
export type Project = { name: string; description: string; status: string; progress: number; objective: string };
export type Milestone = { year: string; title: string; description: string; category: string };
export type Profile = { name: string; role: string; location: string; age: number; bio: string; initials: string };
