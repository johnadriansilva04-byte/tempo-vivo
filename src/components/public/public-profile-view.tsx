import { Check, FolderKanban, MapPin, Trophy } from "lucide-react";
import { ProgressBar } from "@/components/page-kit";
import { isPlaceholderText, readableText } from "@/lib/placeholder";
import type { CareerChapter, Milestone, Profile, Project } from "@/types/profile";

/** Perfil público: a mesma vitrine para o dono e para o visitante. */
export function PublicProfileView({
  profile,
  milestones,
  projects,
  chapters,
}: {
  profile: Profile;
  milestones: Milestone[];
  projects: Project[];
  chapters: CareerChapter[];
}) {
  const achievements = milestones.filter((m) => !isPlaceholderText(m.title));
  const timeline = [...chapters].sort((a, b) => yearOf(a.period) - yearOf(b.period));

  return (
    <div className="space-y-6">
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
          <div className="min-w-0 pb-1">
            <h2 className="font-display text-2xl font-semibold text-foreground">{profile.name}</h2>
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
        </div>
      </div>

      {profile.bio.trim() !== "" && (
        <p className="text-sm leading-6 text-muted-foreground">{profile.bio}</p>
      )}

      {achievements.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <Trophy className="size-4 text-accent-foreground" />
            Conquistas
          </h3>
          <div className="achievement-grid">
            {achievements.map((milestone) => (
              <div className="achievement-card" key={milestone.id ?? milestone.title}>
                <span className="achievement-check">
                  <Check className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-faint">{milestone.year}</p>
                  <p className="mt-0.5 text-sm font-semibold">{readableText(milestone.title)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <FolderKanban className="size-4 text-accent-foreground" />
            Projetos
          </h3>
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
              </div>
            ))}
          </div>
        </section>
      )}

      {timeline.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-base font-semibold">Linha do tempo</h3>
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
        </section>
      )}
    </div>
  );
}

function yearOf(period: string): number {
  const match = period.match(/\d{4}/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}
