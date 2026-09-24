import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Abertura de capítulo.
 *
 * Cada página abre como um capítulo de livro: numeral, título em serifada,
 * descrição funcional e — quando faz sentido — uma epígrafe historiográfica
 * que dá sentido ao que vem abaixo. A regra em degradê separa sem poluir.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  lede,
  mark,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Linha historiográfica: por que esta página existe na sua história. */
  lede?: string;
  /** Numeral do capítulo (ex.: "I", "II") para dar ritmo de livro. */
  mark?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header rise-in">
      <span className="page-header-glow" aria-hidden="true" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {mark && (
            <span className="chapter-mark mb-4" aria-hidden="true">
              {mark}
            </span>
          )}
          <p className="page-eyebrow">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
          {lede && <p className="page-lede">{lede}</p>}
        </div>
        {action && <div className="shrink-0 sm:pt-1">{action}</div>}
      </div>
      <span className="page-rule" aria-hidden="true" />
    </header>
  );
}
export function Section({
  title,
  detail,
  children,
  className = "",
}: {
  title: string;
  detail?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
export function Metric({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail?: string;
}) {
  return (
    <div className="border-l border-border pl-4">
      <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      {detail && <p className="mt-2 text-xs text-faint">{detail}</p>}
    </div>
  );
}
export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
export function TextLink({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
      {children}
      <ArrowUpRight className="size-3.5" />
    </span>
  );
}

/**
 * Espera silenciosa: em vez de caixas que piscam, blocos com brilho deslizante
 * que já desenham a silhueta do conteúdo. Mantém a calma da página durante o
 * carregamento, sem a sensação de app travado.
 */
export function PageSkeleton({
  lines = 3,
  className = "",
  rows = 0,
}: {
  /** Linhas de texto simuladas no topo. */
  lines?: number;
  /** Cartões empilhados abaixo, para páginas de lista. */
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`} aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="space-y-3">
        <div className="skeleton h-7 w-44" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            className="skeleton h-3.5"
            key={i}
            style={{ width: `${[92, 78, 61][i % 3]}%`, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton h-32 rounded-lg" key={i} />
      ))}
    </div>
  );
}
