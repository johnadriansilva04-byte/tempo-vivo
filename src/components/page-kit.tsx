import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Topo de página: título e ação. Sem epígrafe, sem numeral de capítulo, sem
 * parágrafo de contexto — a própria tela mostra o conteúdo. A `detail` opcional
 * existe só quando um número curto ajuda (ex.: "3 compromissos hoje").
 */
export function PageHeader({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
        {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Cabeçalho de seção: título curto e, quando faz sentido, um detalhe curto. */
export function Section({
  title,
  detail,
  action,
  children,
  className = "",
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          {detail && <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-border pl-4">
      <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
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

/** Espera silenciosa durante o carregamento. */
export function PageSkeleton({
  lines = 3,
  className = "",
  rows = 0,
}: {
  lines?: number;
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
