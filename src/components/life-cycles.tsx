import { LockKeyhole, Sparkles } from "lucide-react";

const cycles = [
 ["0–25", "Aprendizado e base"], ["25–50", "Construção e legado"], ["50–75", "Mentoria e maturidade"], ["75–100", "Plenitude e sabedoria"],
];
export function LifeCycles({ age }: { age: number }) {
 const active = Math.min(Math.floor(age / 25), 3); const consumed = Math.min(age, 100);
 return <div className="life-panel"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tempo de vida</p><p className="mt-1 text-sm font-medium text-foreground">Ciclo {active + 1} em andamento</p></div>{age > 100 && <span className="status status-open"><Sparkles className="size-3" />Recordista do Tempo</span>}</div><div className="mt-5 flex items-center gap-5"><div className="life-donut shrink-0" style={{ "--life-progress": `${consumed * 3.6}deg` } as React.CSSProperties}><div><strong>{age}</strong><span>anos</span></div></div><div className="min-w-0 flex-1"><p className="text-xl font-semibold text-foreground">{consumed}%</p><p className="text-xs text-muted-foreground">do horizonte de 100 anos</p><p className="mt-3 flex items-center gap-1.5 text-xs text-faint"><LockKeyhole className="size-3" />{Math.max(100 - age, 0)} anos estimados restantes</p></div></div><div className="mt-5 grid grid-cols-4 gap-1.5">{cycles.map(([range, label], index) => <div key={range} title={label} className={`cycle-segment ${index < active ? "cycle-past" : index === active ? "cycle-active" : "cycle-future"}`}><span>{range}</span></div>)}</div></div>;
}
