import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
 return <header className="mb-8 flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">{eyebrow}</p><h1 className="font-display text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</header>;
}
export function Section({ title, detail, children, className = "" }: { title: string; detail?: string; children: ReactNode; className?: string }) {
 return <section className={className}><div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>{detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}</div></div>{children}</section>;
}
export function Metric({ value, label, detail }: { value: string; label: string; detail?: string }) {
 return <div className="border-l border-border pl-4"><p className="font-display text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>{detail && <p className="mt-2 text-xs text-faint">{detail}</p>}</div>;
}
export function ProgressBar({ value }: { value: number }) { return <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} /></div>; }
export function TextLink({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">{children}<ArrowUpRight className="size-3.5" /></span>; }
