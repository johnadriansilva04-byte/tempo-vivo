import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Singular/plural: `plural(1, "meta da semana", "metas da semana")`. */
export function plural(count: number, singular: string, many: string): string {
  return count === 1 ? singular : many;
}
