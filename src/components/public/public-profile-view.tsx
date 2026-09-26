import { CalendarDays, Check, Clock, Link2, Target } from "lucide-react";
import { ProgressBar } from "@/components/page-kit";
import { PublicMeetingForm } from "@/components/public/public-meeting-form";
import { focusForCurrentWeek } from "@/hooks/use-weekly-focus";
import { isPlaceholderText, readableText } from "@/lib/placeholder";
import { fromIso, isRecurring, occurrencesInRange, toIso } from "@/lib/calendar";
import { formatDayMonth, weekdayName } from "@/lib/meetings";
import { DEFAULT_AVAILABILITY } from "@/types/profile";
import type {
  AgendaEvent,
  CareerChapter,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";

/**
 * Perfil público: a mesma vitrine para o dono e para o visitante.
 *
 * Tudo em uma tela. Nada de abas que escondem conteúdo atrás de rolagem: o
 * visitante vê quem é a pessoa, o que ela faz e como pedir uma reunião sem
 * precisar procurar. Mostrar primeiro, explicar depois.
 */
export function PublicProfileView({
  profile,
  milestones,
  projects,
  chapters,
  agenda = [],
  focus = [],
  live = false,
  onShare,
  onCopy,
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
  onCopy?: () => void;
}) {
  const achievements = milestones.filter((m) => !isPlaceholderText(m.title));
  // Só o contexto entre colchetes denuncia convite não preenchido. Título sem
  // contexto é entrada real do dono, porque o contexto é opcional no formulário.
  const timeline = chapters
    .filter((c) => !isPlaceholderText(c.content))
    .sort((a, b) => yearOf(a.period) - yearOf(b.period));
  const upcoming = upcomingEvents(agenda, 3);
  const weekFocus = focusForCurrentWeek(focus);
  const running = projects.filter((p) => /andamento|iniciado|ativo/i.test(p.status));
  const availability = profile.availability ?? DEFAULT_AVAILABILITY;
  // No preview do dono não faz sentido pedir reunião para si mesmo.
  const ownerPreview = !live;

  return (
    <div className="tile-page">
      <section className="tile-panel tile-hero">
        <div className="tile-head">
          <div className="avatar-main tile-avatar">
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

          <div className="tile-identity">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="tile-name">{profile.name}</h1>
              {live && <span className="status status-neutral">visão pública</span>}
            </div>
            <p className="tile-sub">
              {[profile.role, profile.location].filter((v) => v.trim() !== "").join(" · ")}
            </p>
          </div>

          <div className="tile-actions">
            {onCopy && (
              <button type="button" className="public-share" onClick={onCopy}>
                <Link2 className="size-3.5" />
                Copiar link
              </button>
            )}
            {onShare && (
              <button type="button" className="public-share" onClick={onShare}>
                <Link2 className="size-3.5" />
                Compartilhar
              </button>
            )}
          </div>
        </div>

        {profile.bio.trim() !== "" && <p className="tile-bio">{readableText(profile.bio)}</p>}

        <div className="tile-stats">
          <Stat value={agenda.length} label="compromissos" />
          <Stat value={achievements.length} label="conquistas" />
          <Stat value={projects.length} label="projetos" />
          <Stat value={timeline.length} label="marcos" />
        </div>
      </section>

      <div className="tile-grid">
        <section className="tile-panel">
          <h2 className="tile-title">
            <Clock className="size-3.5" />
            Próximos
          </h2>
          {upcoming.length === 0 ? (
            <p className="tile-empty">Agenda livre.</p>
          ) : (
            <ul className="tile-list">
              {upcoming.map((item, i) => (
                <li key={`${item.title}-${item.date}-${i}`}>
                  <span className="tile-date">
                    <b>{formatDayMonth(item.date)}</b>
                    {weekdayName(fromIso(item.date).getDay()).slice(0, 3)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {readableText(item.title)}
                    </span>
                    {item.time && (
                      <span className="block text-xs text-muted-foreground">{item.time}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tile-panel">
          <h2 className="tile-title">
            <Check className="size-3.5" />
            Conquistas
          </h2>
          {achievements.length === 0 ? (
            <p className="tile-empty">Nada publicado.</p>
          ) : (
            <ul className="tile-list">
              {achievements.slice(0, 4).map((milestone) => (
                <li key={milestone.id ?? milestone.title}>
                  <span className="tile-check">
                    <Check className="size-3" />
                  </span>
                  <span className="tile-clamp min-w-0 flex-1 text-sm font-medium">
                    {readableText(milestone.title)}
                  </span>
                  <span className="tile-year">{milestone.year}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tile-panel">
          <h2 className="tile-title">
            <Target className="size-3.5" />
            Projetos
            {running.length > 0 && <span className="tile-count">{running.length} ativos</span>}
          </h2>
          {projects.length === 0 ? (
            <p className="tile-empty">Nada publicado.</p>
          ) : (
            <ul className="tile-projects">
              {projects.slice(0, 3).map((project) => (
                <li key={project.name}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="tile-clamp text-sm font-semibold">{project.name}</span>
                    <span className="tile-progress">{project.progress}%</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={project.progress} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tile-panel">
          <h2 className="tile-title">
            <CalendarDays className="size-3.5" />
            Linha do tempo
          </h2>
          {timeline.length === 0 ? (
            <p className="tile-empty">Nada publicado.</p>
          ) : (
            <ol className="tile-timeline">
              {timeline.slice(0, 5).map((chapter) => (
                <li key={chapter.id}>
                  <span className="tile-year">{chapter.period}</span>
                  <span className="tile-clamp min-w-0 flex-1 text-sm font-medium">
                    {readableText(chapter.title)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {weekFocus.length > 0 && (
          <section className="tile-panel tile-panel-wide">
            <h2 className="tile-title">
              <Target className="size-3.5" />
              Meta da semana
            </h2>
            <ul className="tile-projects">
              {weekFocus.map((item) => (
                <li key={item.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{readableText(item.title)}</span>
                    <span className="tile-progress">{item.progress_pct}%</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={item.progress_pct} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!ownerPreview && (
          <PublicMeetingForm handle={profile.handle} availability={availability} events={agenda} />
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="tile-stat">
      <p className="tile-stat-value">{value}</p>
      <p className="tile-stat-label">{label}</p>
    </div>
  );
}

/** Próximas ocorrências da agenda pública, em ordem, sem repetir a série. */
function upcomingEvents(
  events: AgendaEvent[],
  limit: number,
): { title: string; date: string; time: string }[] {
  const today = toIso(new Date());
  const out: { title: string; date: string; time: string }[] = [];
  for (const event of events) {
    if (isRecurring(event)) {
      const [next] = occurrencesInRange(event, today, "2099-12-31");
      if (next) out.push({ title: event.title, date: next, time: event.start_time.slice(0, 5) });
    } else if (event.event_date >= today) {
      out.push({
        title: event.title,
        date: event.event_date,
        time: event.start_time.slice(0, 5),
      });
    }
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out.slice(0, limit);
}

function yearOf(period: string): number {
  const match = period.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}
