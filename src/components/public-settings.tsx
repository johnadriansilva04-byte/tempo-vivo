import { useEffect, useState } from "react";
import {
  CalendarCheck2,
  Check,
  Copy,
  Globe2,
  Link2,
  Lock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import {
  useAvailabilityRules,
  useUpdateAvailabilityRule,
} from "@/hooks/use-availability";
import { slugify, WEEKDAY_LABELS } from "@/lib/schedule";
import type { AvailabilityRule, Weekday } from "@/types/profile";

function SectionCard({
  icon: Icon,
  title,
  detail,
  children,
}: {
  icon: typeof Globe2;
  title: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-accent-foreground" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-faint">
          {title}
        </h2>
      </div>
      {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** Tudo que o dono controla sobre a janela pública: link, privacidade, reuniões, disponibilidade. */
export function PublicSettings() {
  const { profile } = useProfile();
  const update = useUpdateProfile();
  const { rules } = useAvailabilityRules();
  const upsertRule = useUpdateAvailabilityRule();
  const [slugDraft, setSlugDraft] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) setSlugDraft(profile.slug);
  }, [profile?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null;

  const publicUrl =
    slugDraft.trim() !== ""
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${slugDraft.trim()}`
      : null;

  const saveSlug = () => {
    const clean = slugify(slugDraft);
    if (clean === "") {
      toast.error("Escolha um nome para o link — letras, números e hífen.");
      return;
    }
    update.mutate(
      { slug: clean },
      {
        onSuccess: () => toast.success(`Link público salvo: /u/${clean}`),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Falha ao salvar."),
      },
    );
  };

  const copyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const setPrivacy = (
    key:
      | "is_public"
      | "show_schedule"
      | "show_projects"
      | "show_achievements"
      | "show_family",
    value: boolean,
  ) =>
    update.mutate(
      { [key]: value },
      {
        onError: (e) => toast.error(e instanceof Error ? e.message : "Falha."),
      },
    );

  const setMeetings = (key: string, value: boolean | number) =>
    update.mutate({ [key]: value } as never, {
      onError: (e) => toast.error(e instanceof Error ? e.message : "Falha."),
    });

  const ruleFor = (wd: number): AvailabilityRule =>
    rules.find((r) => r.weekday === wd) ?? {
      weekday: wd as Weekday,
      is_available: false,
      start_time: "09:00",
      end_time: "17:00",
    };

  const toggleDay = (wd: number, available: boolean) => {
    const rule = ruleFor(wd);
    upsertRule.mutate(
      { ...rule, is_available: available },
      {
        onSuccess: () =>
          toast.success(
            available
              ? `${WEEKDAY_LABELS[wd]} aberto para reuniões.`
              : `${WEEKDAY_LABELS[wd]} fechado para reuniões.`,
          ),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Falha."),
      },
    );
  };

  const setDayHours = (
    wd: number,
    field: "start_time" | "end_time",
    value: string,
  ) => {
    const rule = ruleFor(wd);
    upsertRule.mutate(
      { ...rule, [field]: value },
      { onError: () => undefined },
    );
  };

  return (
    <>
      <SectionCard
        icon={Link2}
        title="Link público"
        detail="Seu endereço único — coloque no Instagram, WhatsApp, LinkedIn, cartão de visita ou assinatura de e-mail."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center rounded-md border border-input bg-background">
            <span className="shrink-0 pl-3 text-xs text-faint">/u/</span>
            <Input
              value={slugDraft}
              onChange={(e) => setSlugDraft(slugify(e.target.value))}
              placeholder="seu-nome"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Button size="sm" disabled={update.isPending} onClick={saveSlug}>
            Salvar link
          </Button>
          {publicUrl && (
            <>
              <Button size="sm" variant="secondary" onClick={copyUrl}>
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}{" "}
                Copiar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => (window.location.href = publicUrl)}
              >
                Ver
              </Button>
            </>
          )}
        </div>
        {publicUrl && (
          <p className="mt-2 font-mono text-xs text-faint">
            {publicUrl.replace(/^https?:\/\//, "")}
          </p>
        )}
      </SectionCard>

      <SectionCard
        icon={Users}
        title="Apresentação pública"
        detail="A primeira frase que o visitante lê sobre você. Se vazia, cai para a bio."
      >
        <Textarea
          rows={3}
          value={profile.presentation}
          onChange={(e) => update.mutate({ presentation: e.target.value })}
          placeholder="Ex.: Pesquisadora e construtora de coisas — organizo minha vida em um link só."
        />
        <p className="mt-2 text-[11px] text-faint">
          Salvo automaticamente a cada edição. Limite de 600 caracteres.
        </p>
      </SectionCard>

      <SectionCard
        icon={Globe2}
        title="Privacidade"
        detail="O que a janela pública mostra. Cada camada fica sob seu controle — nada aparece sem você decidir."
      >
        <ToggleRow
          label="Perfil público"
          detail="Se desligado, seu link devolve 'perfil não encontrado'."
          checked={profile.is_public}
          onChange={(v) => setPrivacy("is_public", v)}
        />
        <ToggleRow
          label="Mostrar agenda (hoje/amanhã)"
          detail="A rotina concreta de hoje e amanhã no link público."
          checked={profile.show_schedule}
          onChange={(v) => setPrivacy("show_schedule", v)}
        />
        <ToggleRow
          label="Mostrar projetos"
          detail="Cartões de projetos ativos no link público."
          checked={profile.show_projects}
          onChange={(v) => setPrivacy("show_projects", v)}
        />
        <ToggleRow
          label="Mostrar realizações"
          detail="Seu histórico organizado de conquistas."
          checked={profile.show_achievements}
          onChange={(v) => setPrivacy("show_achievements", v)}
        />
        <ToggleRow
          label="Mostrar família"
          detail="Apenas relações marcadas como PÚBLICO na página Família."
          checked={profile.show_family}
          onChange={(v) => setPrivacy("show_family", v)}
        />
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-faint">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          Família tem privacidade própria por relação (Público / Família /
          Privado) em{" "}
          <a
            href="/familia"
            className="font-medium text-primary hover:underline"
          >
            Família
          </a>
          .
        </p>
      </SectionCard>

      <SectionCard
        icon={CalendarCheck2}
        title="Reuniões"
        detail="O visitante escolhe um horário livre e envia solicitação — você aceita, recusa ou propõe outro."
      >
        <ToggleRow
          label="Receber solicitações de reunião"
          detail="Liga o bloco 'Disponível para reuniões' no seu link público."
          checked={profile.meetings_enabled}
          onChange={(v) => setMeetings("meetings_enabled", v)}
        />
        <ToggleRow
          label="Exigir aprovação"
          detail="Nenhuma reunião entra na agenda sem o seu aceite."
          checked={profile.meeting_requires_approval}
          onChange={(v) => setMeetings("meeting_requires_approval", v)}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Duração (min)
            </Label>
            <Input
              type="number"
              min={10}
              max={240}
              value={profile.meeting_duration_min}
              onChange={(e) =>
                setMeetings(
                  "meeting_duration_min",
                  Number(e.target.value) || 30,
                )
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Intervalo (min)
            </Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={profile.meeting_buffer_min}
              onChange={(e) =>
                setMeetings("meeting_buffer_min", Number(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Máx. por dia
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={profile.meeting_max_per_day}
              onChange={(e) =>
                setMeetings("meeting_max_per_day", Number(e.target.value) || 2)
              }
            />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
            Requisitos para solicitar
          </Label>
          <Input
            value={profile.meeting_requirements}
            onChange={(e) =>
              update.mutate({ meeting_requirements: e.target.value })
            }
            placeholder="Ex.: traga pauta objetiva; reuniões de 30 min; sem vendas."
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={Users}
        title="Disponibilidade por dia"
        detail="Você decide quais dias da semana aceita reuniões e em que horário — o sistema só calcula os slots realmente livres."
      >
        <div className="divide-y divide-border rounded-md border border-border">
          {WEEKDAY_LABELS.map((label, wd) => {
            const rule = ruleFor(wd);
            return (
              <div
                key={wd}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5"
              >
                <span className="w-20 text-sm font-medium">{label}</span>
                <span
                  className={`status ${rule.is_available ? "status-open" : "status-archive"}`}
                >
                  {rule.is_available ? "Disponível" : "Indisponível"}
                </span>
                {rule.is_available && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="h-8 w-28 text-xs"
                      value={rule.start_time}
                      onChange={(e) =>
                        setDayHours(wd, "start_time", e.target.value)
                      }
                      aria-label={`Início de ${label}`}
                    />
                    <span className="text-xs text-faint">até</span>
                    <Input
                      type="time"
                      className="h-8 w-28 text-xs"
                      value={rule.end_time}
                      onChange={(e) =>
                        setDayHours(wd, "end_time", e.target.value)
                      }
                      aria-label={`Fim de ${label}`}
                    />
                  </div>
                )}
                <Button
                  size="sm"
                  variant={rule.is_available ? "ghost" : "secondary"}
                  className="ml-auto h-7 text-xs"
                  disabled={upsertRule.isPending}
                  onClick={() => toggleDay(wd, !rule.is_available)}
                >
                  {rule.is_available ? "Fechar dia" : "Abrir dia"}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-5 text-faint">
          Compromissos fixos, pontuais e reuniões já aceitas são subtraídos
          automaticamente — o visitante só enxerga horários de fato livres.
        </p>
      </SectionCard>
    </>
  );
}
