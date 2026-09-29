import { useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
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
import { usePublicProfile } from "@/hooks/use-public-profile";
import { useUpcomingMeetingSlots } from "@/hooks/use-availability";
import { useCreateMeetingRequest } from "@/hooks/use-meeting-requests";
import { formatDayLabel } from "@/lib/schedule";
import type { DaySlot } from "@/types/profile";

type RequestTarget = { date: string; slot: DaySlot } | null;

/**
 * Página pública — o que qualquer pessoa vê ao abrir o seu link: quem você é e
 * os horários livres para marcar uma reunião.
 *
 * Nada da sua rotina aparece aqui: o visitante não vê seus compromissos nem
 * quais dias você folga. Ele só vê os horários que você abriu para reunião.
 */
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
          <h1 className="mt-4 text-xl font-semibold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link não existe ou a pessoa o desativou.
          </p>
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
            "Pedido enviado — a resposta chega pelo contato que você informou.",
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

  const dayCards = slotDays.filter((d) => d.slices.length > 0).slice(0, 6);

  return (
    <PublicShell>
      <header className="relative overflow-hidden rounded-xl border border-border bg-card">
        {profile.cover_url ? (
          <div
            className="h-32 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.cover_url})` }}
          />
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-primary/15 via-card to-muted" />
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
                profile.initials || "··"
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
          {profile.presentation && (
            <p className="mt-4 max-w-3xl font-display text-base leading-7 text-muted-foreground">
              {profile.presentation}
            </p>
          )}
          {profile.meetings_enabled && (
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#reunioes" className="status status-open">
                <CalendarCheck2 className="size-3" /> Marque uma reunião
              </a>
            </div>
          )}
        </div>
      </header>

      {profile.meetings_enabled && (
        <section id="reunioes" className="mt-8 scroll-mt-6">
          <h2 className="font-display text-lg font-semibold">
            Marque uma reunião
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha um horário livre abaixo. Duração:{" "}
            {profile.meeting_duration_min} min.
            {profile.meeting_requires_approval
              ? " O pedido passa pela aprovação de " + firstName + "."
              : ""}
          </p>

          {slotsLoading ? (
            <div className="mt-4 h-32 animate-pulse rounded-lg border border-border bg-card" />
          ) : dayCards.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-border px-4 py-5 text-sm text-faint">
              Nenhum horário livre nos próximos dias. Tente mais tarde.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dayCards.map((d) => (
                <div
                  key={d.date}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <p className="text-sm font-semibold first-letter:capitalize">
                    {formatDayLabel(d.date)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.slices.slice(0, 8).map((s) => (
                      <button
                        key={`${s.start_time}-${s.end_time}`}
                        type="button"
                        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium tabular-nums text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        onClick={() => setTarget({ date: d.date, slot: s })}
                      >
                        {s.start_time}
                      </button>
                    ))}
                    {d.slices.length > 8 && (
                      <span className="self-center text-[11px] text-faint">
                        +{d.slices.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {profile.meeting_requirements && (
            <p className="mt-4 rounded-md border border-border bg-muted/50 px-4 py-3 text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">Antes de pedir:</strong>{" "}
              {profile.meeting_requirements}
            </p>
          )}
        </section>
      )}

      <footer className="mt-14 flex items-center gap-2 border-t border-border pt-6 text-xs text-faint">
        <CheckCircle2 className="size-3.5" />
        Página atualizada pela própria pessoa.
        <a
          href="/"
          className="ml-auto font-medium text-primary hover:underline"
        >
          Crie a sua
        </a>
      </footer>

      <Dialog
        open={target !== null}
        onOpenChange={(v) => !v && setTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pedir uma reunião</DialogTitle>
            <DialogDescription>
              {target && (
                <>
                  {formatDayLabel(target.date)} · {target.slot.start_time} —{" "}
                  {target.slot.end_time}
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
                Contato
              </Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Telefone ou e-mail"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Motivo
              </Label>
              <Textarea
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Do que você quer falar?"
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
              {createRequest.isPending ? "Enviando…" : "Enviar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="page-enter mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="brand-mark">
              <CalendarDays className="size-4" />
            </span>
            <span className="font-display text-sm font-semibold">
              Perfil Vivo
            </span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
