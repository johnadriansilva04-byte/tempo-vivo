import { lastDayOfMonth, lastDayOfYear } from "@/lib/calendar";

/**
 * Escalas prontas: o caso real de quem trabalha em horário fixo — "trabalho
 * das 18h às 23h59, de segunda a segunda, todo mês no ano". Um toque preenche
 * tudo; depois o usuário só ajusta folgas, se quiser.
 *
 * Lógica pura: devolve dados, não componentes.
 */
export type ScaleTemplate = {
  id: string;
  /** Rótulo curto do chip. */
  label: string;
  /** Descrição de uma linha, sem jargão. */
  hint: string;
  title: string;
  start_time: string;
  end_time: string;
  /** Dias da semana (0=domingo). */
  days: number[];
};

export const SCALE_TEMPLATES: ScaleTemplate[] = [
  {
    id: "noite",
    label: "Noite",
    hint: "18:00 – 23:59, seg a dom, o ano inteiro",
    title: "Trabalho",
    start_time: "18:00",
    end_time: "23:59",
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "comercial",
    label: "Comercial",
    hint: "08:00 – 17:00, dias úteis",
    title: "Trabalho",
    start_time: "08:00",
    end_time: "17:00",
    days: [1, 2, 3, 4, 5],
  },
  {
    id: "manha",
    label: "Manhã",
    hint: "06:00 – 12:00, dias úteis",
    title: "Turno da manhã",
    start_time: "06:00",
    end_time: "12:00",
    days: [1, 2, 3, 4, 5],
  },
  {
    id: "escala12x36",
    label: "12x36",
    hint: "19:00 – 07:00, um dia sim, um não",
    title: "Plantão",
    start_time: "19:00",
    end_time: "23:59",
    days: [1, 3, 5],
  },
  {
    id: "segunda",
    label: "Só segunda",
    hint: "Reunião fixa de semana",
    title: "Reunião semanal",
    start_time: "09:00",
    end_time: "10:00",
    days: [1],
  },
  {
    id: "fimsemana",
    label: "Fim de semana",
    hint: "Sáb e dom",
    title: "Trabalho de fim de semana",
    start_time: "09:00",
    end_time: "18:00",
    days: [0, 6],
  },
];

/** Até quando a escala vale. */
export type ScaleWindow = "mes" | "ano" | "sempre";

export const SCALE_WINDOWS: [ScaleWindow, string][] = [
  ["mes", "Este mês"],
  ["ano", "Este ano"],
  ["sempre", "Sem fim"],
];

/**
 * Aplica um modelo à data de origem e devolve o rascunho de repetição:
 * dias marcados, limite calculado pela janela escolhida.
 */
export function escalaPlan(
  template: ScaleTemplate,
  from: string,
  window: ScaleWindow = "ano",
): { repeatDays: number[]; repeatUntil: string } {
  const repeatUntil =
    window === "mes" ? lastDayOfMonth(from) : window === "ano" ? lastDayOfYear(from) : "";
  return { repeatDays: [...template.days], repeatUntil };
}
