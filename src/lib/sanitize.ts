/** Pico de sanitização — trim + clamp básico antes do Zod. */
export function sanitizeText(s: string, max: number): string {
  return s.trim().slice(0, max);
}
export function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}
