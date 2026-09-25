import { useState } from "react";
import { CalendarDays, Check, Link2, MapPin, Target, UserRound } from "lucide-react";
import { ProgressBar } from "@/components/page-kit";
import { PublicAgenda } from "@/components/public/public-agenda";
import { focusForCurrentWeek } from "@/hooks/use-weekly-focus";
import { isPlaceholderText, readableText } from "@/lib/placeholder";
import { isRecurring, occurrencesInRange, toIso } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type {
  AgendaEvent,
  CareerChapter,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";

type Tab = "agenda" | "feitos" | "projetos" | "dados";

/** Perfil público: a mesma vitrine para o dono e para o visitante. */
export function PublicProfileView({
  profile,
  milestones,
  projects,
  chapters,
  agenda = [],
  focus = [],
  live = false,
  onShare,
}: {
  profile: Profile;
  milestones: Milestone[];
  projects: Project[];
  chapters: CareerChapter[];
  agenda?: AgendaEvent[];
  focus?: WeeklyFocus[];
  /** No modo visitante a visão assume que veio de um link compartilhado. */
  live?: boolean;
  onShare?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("agenda");

  const achievements = milestones.filter((m) => !isPlaceholderText(m.title));
  const timeline = [...chapters].sort((a, b) => yearOf(a.period) - yearOf(b.period));
  const running = projects.filter((p) => /andamento|iniciado|ativo/i.test(p.status));
  const year = new Date().getFullYear();
  const weekFocus = focusForCurrentWeek(focus);

  const upcoming = nextOccurrenceDate(agenda);
  const counts: [Tab, string, number][] = [
    ["agenda", "Agenda", agenda.length],
    ["feitos", "Feitos", achievements.length],
    ["projetos", "Projetos", projects.length],
    ["dados", "Dados", timeline.length],
  ];

  return (
    <div className="space-y-5">
      <div className="public-hero">
        {profile.cover_url ? (
          <div className="public-banner" style={{ backgroundImage: `url(${profile.cover_url})` }} />
        ) : (
          <div className="public-banner" />
        )}
        <div className="flex items-end gap-4 px-5 pb-5">
          <div className="avatar-main -mt-8 border-4 border-card">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="size-full rounded-full object-cover"
              />
            ) : (
              profile.initials
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {profile.name}
              </h2>
              {live && <span className="status status-neutral">visão pública</span>}
            </div>
            {profile.role.trim() !== "" && (
              <p className="text-sm text-muted-foreground">{profile.role}</p>
            )}
            {profile.location.trim() !== "" && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-faint">
                <MapPin className="size-3" />
                {profile.location}
              </p>
            )}
          </div>
          {onShare && (
            <button type="button" className="public-share" onClick={onShare}>
              <Link2 className="size-3.5" />
              Link
            </button>
          )}
        </div>

        <div className="public-stats">
          <Stat value={agenda.length} label="compromissos" />
          <Stat value={achievements.length} label="conquistas" />
          <Stat value={projects.length} label="projetos" />
          <Stat value={timeline.length} label="marcos de vida" />
        </div>
      </div>

      {profile.bio.trim() !== "" && (
        <p className="text-sm leading-6 text-muted-foreground">{profile.bio}</p>
      )}

      <div className="public-tabs" role="tablist" aria-label="Seções do perfil">
        {counts.map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn(tab === id && "selected")}
            onClick={() => setTab(id)}
          >
            {label}
            {count > 0 && <span className="public-tab-count">{count}</span>}
          </button>
        ))}
      </div>

      {tab === "agenda" && (
        <section className="space-y-3">
          {upcoming && (
            <p className="text-xs text-muted-foreground">
              Próximo compromisso: <b className="text-foreground">{readableText(upcoming.title)}</b>{" "}
              em {weekdayOf(upcoming.date)}
            </p>
          )}
          {agenda.length === 0 ? (
            <EmptyLine text="Agenda ainda não publicada." />
          ) : (
            <PublicAgenda events={agenda} />
          )}
          {weekFocus.length > 0 && (
            <div className="public-block">
              <h3 className="public-block-title">
                <Target className="size-3.5" />
                Meta da semana
              </h3>
              <ul className="space-y-2">
                {weekFocus.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{readableText(item.title)}</span>
                      <span className="text-xs text-muted-foreground">{item.progress_pct}%</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={item.progress_pct} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {tab === "feitos" && (
        <section>
          {achievements.length === 0 ? (
            <EmptyLine text="Nenhuma conquista publicada ainda." />
          ) : (
            <div className="achievement-grid">
              {achievements.map((milestone) => (
                <div className="achievement-card" key={milestone.id ?? milestone.title}>
                  <span className="achievement-check">
                    <Check className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-faint">{milestone.year}</p>
                    <p className="mt-0.5 text-sm font-semibold">{readableText(milestone.title)}</p>
                    {milestone.category && milestone.category !== "Vida" && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{milestone.category}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "projetos" && (
        <section>
          {projects.length === 0 ? (
            <EmptyLine text="Nenhum projeto publicado ainda." />
          ) : (
            <>
              {running.length > 0 && (
                <p className="mb-3 text-xs text-muted-foreground">
                  {running.length} em andamento agora.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((project) => (
                  <div className="project-card" key={project.name}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="status status-neutral">{project.status}</span>
                      <span className="text-xs font-medium">{project.progress}%</span>
                    </div>
                    <h4 className="mt-3 text-sm font-semibold">{project.name}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {readableText(project.description)}
                    </p>
                    <div className="mt-3">
                      <ProgressBar value={project.progress} />
                    </div>
                    {project.link.trim() !== "" && (
                      <a
                        className="public-link mt-3"
                        href={project.link}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <Link2 className="size-3" />
                        Abrir
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "dados" && (
        <section className="space-y-4">
          <div className="public-block">
            <h3 className="public-block-title">
              <UserRound className="size-3.5" />
              Dados
            </h3>
            <dl className="public-facts">
              {profile.role.trim() !== "" && <Fact label="Atuação" value={profile.role} />}
              {profile.location.trim() !== "" && (
                <Fact label="Onde vive" value={profile.location} />
              )}
              {profile.birth_date && (
                <Fact label="Nascimento" value={dateLabel(profile.birth_date)} />
              )}
              <Fact label="Perfil desde" value={String(year)} />
            </dl>
          </div>

          {timeline.length > 0 && (
            <div className="public-block">
              <h3 className="public-block-title">
                <CalendarDays className="size-3.5" />
                Linha do tempo
              </h3>
              <ol className="timeline">
                {timeline.map((chapter) => (
                  <li className="timeline-entry" key={chapter.id}>
                    <span className="timeline-dot" aria-hidden="true" />
                    {!isPlaceholderText(chapter.period) && (
                      <p className="timeline-year">{chapter.period}</p>
                    )}
                    <p className="mt-0.5 text-sm font-medium">{readableText(chapter.title)}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="public-stat">
      <p className="public-stat-value">{value}</p>
      <p className="public-stat-label">{label}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="public-fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

/** Próxima ocorrência de qualquer compromisso da agenda pública. */
function nextOccurrenceDate(events: AgendaEvent[]): { title: string; date: string } | null {
  const today = toIso(new Date());
  const candidates: { title: string; date: string }[] = [];
  for (const event of events) {
    if (isRecurring(event)) {
      const [next] = occurrencesInRange(event, today, "2099-12-31");
      if (next) candidates.push({ title: event.title, date: next });
    } else if (event.event_date >= today) {
      candidates.push({ title: event.title, date: event.event_date });
    }
  }
  candidates.sort((a, b) => a.date.localeCompare(b.date));
  return candidates[0] ?? null;
}

function weekdayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function yearOf(period: string): number {
  const match = period.match(/\d{4}/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}
