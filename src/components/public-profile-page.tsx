import { useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  HeartHandshake,
  Inbox,
  MapPin,
  Send,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DayAgenda } from "@/components/schedule-kit";
import { usePublicProfile } from "@/hooks/use-public-profile";
import { useUpcomingMeetingSlots } from "@/hooks/use-availability";
import { useCreateMeetingRequest } from "@/hooks/use-meeting-requests";
import { FAMILY_RELATION_LABELS } from "@/lib/validators";
import {
  addDaysIso,
  formatDayLabel,
  todayIso,
  WEEKDAY_SHORT,
} from "@/lib/schedule";
import type { DaySlot } from "@/types/profile";

type RequestTarget = { date: string; slot: DaySlot } | null;

/** Janela pública — perfilvivo.com/nome. Sem sidebar: é o mundo visitando. */
export function PublicProfilePage({ slug }: { slug: string }) {
  const { bundle, isLoading } = usePublicProfile(slug);
  const { days: slotDays, isLoading: slotsLoading } =
    useUpcomingMeetingSlots(7);
  const createRequest = useCreateMeetingRequest();
  const [target, setTarget] = useState<RequestTarget>(null);
  const [form, setForm] = useState({ name: "", contact: "", reason: "" });

  if (isLoading) {
    return (
      <PublicShell>
        <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
      </PublicShell>
    );
  }

  if (!bundle) {
    return (
      <PublicShell>
        <div className="py-24 text-center">
          <p className="font-display text-5xl font-semibold text-foreground">
            404
          </p>
          <h1 className="mt-4 text-xl font-semibold">Perfil não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link não existe ou o dono tornou o perfil privado.
          </p>
          <Button
            size="sm"
            className="mt-6"
            onClick={() => (window.location.href = "/")}
          >
            Conhecer o Perfil Vivo
          </Button>
        </div>
      </PublicShell>
    );
  }

  const { profile } = bundle;
  const firstName = profile.name.trim().split(/\s+/)[0] || profile.name;

  const submitRequest = () => {
    if (!target) return;
    if (!form.name.trim() || !form.contact.trim() || !form.reason.trim()) {
      toast.error("Preencha nome, contato e motivo.");
      return;
    }
    createRequest.mutate(
      {
        event_date: target.date,
        start_time: target.slot.start_time,
        end_time: target.slot.end_time,
        requester_name: form.name.trim(),
        requester_contact: form.contact.trim(),
        reason: form.reason.trim(),
      },
      {
        onSuccess: () => {
          toast.success(
            "Solicitação enviada — você receberá a resposta pelo contato informado.",
          );
          setTarget(null);
          setForm({ name: "", contact: "", reason: "" });
        },
        onError: (e) =>
          toast.error(
            e instanceof Error ? e.message : "Não foi possível enviar.",
          ),
      },
    );
  };

  const dayCards = slotDays.filter((d) => d.slices.length > 0).slice(0, 5);

  return (
    <PublicShell>
      {/* Identidade */}
      <header className="relative overflow-hidden rounded-xl border border-border bg-card">
        {profile.cover_url ? (
          <div
            className="h-36 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.cover_url})` }}
          />
        ) : (
          <div className="h-36 w-full bg-gradient-to-br from-primary/15 via-card to-muted" />
        )}
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="avatar-main border-4 border-card">
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
              <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                {profile.name || "Sem nome"}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {profile.role}
                {profile.location && (
                  <span className="ml-2 inline-flex items-center gap-1 text-faint">
                    <MapPin className="size-3" />
                    {profile.location}
                  </span>
                )}
              </p>
            </div>
          </div>
          {(profile.presentation || profile.bio) && (
            <p className="mt-4 max-w-3xl font-display text-base leading-7 text-muted-foreground">
              {profile.presentation || profile.bio}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.show_schedule && (
              <a href="#agenda" className="status status-open">
                <CalendarDays className="size-3" /> Hoje & amanhã
              </a>
            )}
            {profile.meetings_enabled && (
              <a href="#reunioes" className="status status-open">
                <CalendarCheck2 className="size-3" /> Disponível para reuniões
              </a>
            )}
            {profile.show_projects && (
              <a href="#projetos" className="status status-neutral">
                Projetos
              </a>
            )}
            {profile.show_achievements && (
              <a href="#realizacoes" className="status status-neutral">
                Realizações
              </a>
            )}
            {profile.show_family && bundle.family.length > 0 && (
              <a href="#familia" className="status status-neutral">
                Família
              </a>
            )}
          </div>
        </div>
      </header>

      {/* HOJE / AMANHÃ */}
      {profile.show_schedule && (
        <section id="agenda" className="mt-8 scroll-mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Como é o dia
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A rotina real de {firstName} — sem precisar perguntar no
                WhatsApp.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DayAgenda
              title="Hoje"
              dateIso={todayIso()}
              occurrences={bundle.occurrencesToday}
              emptyLabel="Dia livre."
            />
            <DayAgenda
              title="Amanhã"
              dateIso={addDaysIso(todayIso(), 1)}
              occurrences={bundle.occurrencesTomorrow}
              emptyLabel="Dia livre."
            />
          </div>
        </section>
      )}

      {/* Disponibilidade + solicitação */}
      {profile.meetings_enabled && (
        <section id="reunioes" className="mt-10 scroll-mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Disponível para reuniões
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {firstName} abre horários nestes dias — escolha um slot livre e
                envie sua solicitação. Duração: {profile.meeting_duration_min}{" "}
                min.
                {profile.meeting_requires_approval ? " Requer aprovação." : ""}
              </p>
            </div>
          </div>

          {bundle.availability.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {bundle.availability.map((r) => (
                <span key={r.weekday} className="status status-open">
                  {WEEKDAY_SHORT[r.weekday % 7]} · {r.start_time}–{r.end_time}
                </span>
              ))}
            </div>
          )}

          {slotsLoading ? (
            <div className="h-32 animate-pulse rounded-lg border border-border bg-card" />
          ) : dayCards.length === 0 ? (
            <p className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-5 text-sm text-faint">
              <Inbox className="size-3.5" />
              Nenhum horário livre nos próximos dias. Volte mais tarde.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {dayCards.map((d) => (
                <div
                  key={d.date}
                  className="card-interactive !transform-none !p-4"
                >
                  <p className="text-sm font-semibold first-letter:capitalize">
                    {formatDayLabel(d.date)}
                  </p>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {d.slices.slice(0, 6).map((s) => (
                      <button
                        key={`${s.start_time}-${s.end_time}`}
                        type="button"
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium tabular-nums text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        onClick={() => setTarget({ date: d.date, slot: s })}
                      >
                        {s.start_time} — {s.end_time}
                      </button>
                    ))}
                    {d.slices.length > 6 && (
                      <span className="text-[11px] text-faint">
                        +{d.slices.length - 6} horários
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {profile.meeting_requirements && (
            <p className="mt-4 rounded-md border border-border bg-muted/50 px-4 py-3 text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">Para solicitar:</strong>{" "}
              {profile.meeting_requirements}
            </p>
          )}
        </section>
      )}

      {/* Projetos */}
      {profile.show_projects && (
        <section id="projetos" className="mt-10 scroll-mt-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Projetos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O que {firstName} está construindo agora.
            </p>
          </div>
          {bundle.projects.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-faint">
              <FolderKanban className="size-3.5" /> Nenhum projeto publicado.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bundle.projects.map((p) => (
                <article key={p.name} className="project-card">
                  <div className="flex items-center justify-between">
                    <span className="status status-neutral">{p.status}</span>
                    <span className="text-xs font-medium text-primary">
                      {p.progress}%
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">
                    {p.name}
                  </h3>
                  {p.period && (
                    <p className="mt-1 text-xs text-faint">{p.period}</p>
                  )}
                  <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {p.description}
                  </p>
                  {p.objective && (
                    <p className="mt-3 text-xs text-faint">
                      Objetivo: {p.objective}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Realizações */}
      {profile.show_achievements && (
        <section id="realizacoes" className="mt-10 scroll-mt-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Realizações</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Um histórico organizado — não um feed.
            </p>
          </div>
          {bundle.milestones.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-faint">
              <Trophy className="size-3.5" /> Nada publicado ainda.
            </p>
          ) : (
            <div className="achievement-list">
              {bundle.milestones.slice(0, 6).map((m) => (
                <article key={m.title}>
                  <div className="achievement-year">{m.year}</div>
                  <div className="achievement-dot" />
                  <div className="pb-8">
                    <span className="status status-neutral">{m.category}</span>
                    <h3 className="mt-2 font-display text-base font-semibold">
                      {m.title}
                    </h3>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                      {m.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Família */}
      {profile.show_family && bundle.family.length > 0 && (
        <section id="familia" className="mt-10 scroll-mt-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">
              Família conectada
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              As relações que {firstName} decidiu tornar públicas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {bundle.family.map((f) => (
              <span key={f.display_name} className="status status-open">
                <HeartHandshake className="size-3" /> {f.display_name} ·{" "}
                {FAMILY_RELATION_LABELS[f.relation]}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Rodapé */}
      <footer className="mt-14 border-t border-border pt-6">
        <p className="flex items-center gap-2 text-xs text-faint">
          <Activity className="size-3.5" />
          Este perfil é atualizado pela própria pessoa — agenda real, projetos
          reais, história real.
          <ArrowRight className="size-3" />
          <a href="/" className="font-medium text-primary hover:underline">
            Crie o seu Perfil Vivo
          </a>
          <CheckCircle2 className="size-3" />
        </p>
      </footer>

      {/* Solicitação de reunião */}
      <Dialog
        open={target !== null}
        onOpenChange={(v) => !v && setTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar reunião</DialogTitle>
            <DialogDescription>
              {target && (
                <>
                  {formatDayLabel(target.date)} · {target.slot.start_time} —{" "}
                  {target.slot.end_time} · {bundle.profile.meeting_duration_min}{" "}
                  min
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Seu nome
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Como você se chama"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Contato (e-mail ou telefone)
              </Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Para receber a resposta"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Motivo da reunião
              </Label>
              <Textarea
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Do que você gostaria de conversar?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setTarget(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={createRequest.isPending}
              onClick={submitRequest}
            >
              <Send className="size-3.5" />
              {createRequest.isPending ? "Enviando…" : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}

/** Shell enxuto da página pública — fora da sidebar do app autenticado. */
function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12 page-enter">
        <div className="mb-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="brand-mark">
              <Activity className="size-4" />
            </span>
            <span className="font-display text-sm font-semibold">
              Perfil Vivo
            </span>
          </a>
          <span className="status status-neutral">Janela pública</span>
        </div>
        {children}
      </div>
    </div>
  );
}
