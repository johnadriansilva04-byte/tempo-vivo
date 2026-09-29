import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Link2, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section } from "@/components/page-kit";
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
import {
  clearLocalDB,
  exportAllData,
  importAllData,
} from "@/services/profile-service";
import { uploadAvatar } from "@/lib/storage";
import { slugify } from "@/lib/schedule";
import {
  playMeetingAlert,
  setSoundEnabled,
  soundEnabled,
} from "@/lib/notification-sound";
import { WEEKDAY_LABELS } from "@/lib/schedule";
import type { Profile } from "@/types/profile";
import type { Weekday } from "@/types/profile";

type Draft = Pick<
  Profile,
  | "name"
  | "role"
  | "location"
  | "presentation"
  | "birth_date"
  | "avatar_url"
  | "cover_url"
  | "slug"
  | "is_public"
  | "meetings_enabled"
  | "meeting_duration_min"
  | "meeting_buffer_min"
  | "meeting_max_per_day"
  | "meeting_requires_approval"
  | "meeting_requirements"
>;

const EMPTY: Draft = {
  name: "",
  role: "",
  location: "",
  presentation: "",
  birth_date: "",
  avatar_url: null,
  cover_url: null,
  slug: "",
  is_public: true,
  meetings_enabled: false,
  meeting_duration_min: 30,
  meeting_buffer_min: 15,
  meeting_max_per_day: 2,
  meeting_requires_approval: true,
  meeting_requirements: "",
};

/**
 * Configurações — tudo o que dá forma à agenda: quem você é no seu link, quando
 * aceita reuniões e por quantas horas, o limite por dia e o aviso sonoro.
 */
export function ConfigPage() {
  const { profile } = useProfile();
  const update = useUpdateProfile();
  const { rules } = useAvailabilityRules();
  const updateRule = useUpdateAvailabilityRule();

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [sound, setSound] = useState(true);
  const fileAvatarRef = useRef<HTMLInputElement>(null);
  const fileCoverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSound(soundEnabled());
  }, []);

  useEffect(() => {
    if (!profile || touched) return;
    setDraft({
      name: profile.name,
      role: profile.role,
      location: profile.location,
      presentation: profile.presentation,
      birth_date: profile.birth_date,
      avatar_url: profile.avatar_url,
      cover_url: profile.cover_url,
      slug: profile.slug,
      is_public: profile.is_public,
      meetings_enabled: profile.meetings_enabled,
      meeting_duration_min: profile.meeting_duration_min,
      meeting_buffer_min: profile.meeting_buffer_min,
      meeting_max_per_day: profile.meeting_max_per_day,
      meeting_requires_approval: profile.meeting_requires_approval,
      meeting_requirements: profile.meeting_requirements,
    });
  }, [profile, touched]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setTouched(true);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const save = () => {
    const payload: Partial<Omit<Profile, "id">> = {
      name: draft.name.trim(),
      role: draft.role.trim(),
      location: draft.location.trim(),
      presentation: draft.presentation.trim(),
      birth_date: draft.birth_date,
      avatar_url: draft.avatar_url,
      cover_url: draft.cover_url,
      slug: slugify(draft.slug),
      is_public: draft.is_public,
      meetings_enabled: draft.meetings_enabled,
      meeting_duration_min: draft.meeting_duration_min,
      meeting_buffer_min: draft.meeting_buffer_min,
      meeting_max_per_day: draft.meeting_max_per_day,
      meeting_requires_approval: draft.meeting_requires_approval,
      meeting_requirements: draft.meeting_requirements.trim(),
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.success("Configurações salvas.");
        setTouched(false);
      },
      onError: (e) =>
        toast.error(
          e instanceof Error ? e.message : "Não foi possível salvar.",
        ),
    });
  };

  const onPick = async (file: File, field: "avatar_url" | "cover_url") => {
    try {
      const url = await uploadAvatar(
        file,
        field === "avatar_url" ? "avatar" : "cover",
      );
      set(field, url);
      toast.success(field === "avatar_url" ? "Foto enviada." : "Capa enviada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload.");
    }
  };

  const toggleSound = (next: boolean) => {
    setSound(next);
    setSoundEnabled(next);
    if (next) playMeetingAlert();
  };

  const ruleFor = (weekday: number) =>
    rules.find((r) => r.weekday === weekday) ?? {
      weekday: weekday as Weekday,
      is_available: false,
      start_time: "09:00",
      end_time: "18:00",
    };

  if (!profile) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  const slug = slugify(draft.slug);
  const previewUrl =
    slug === ""
      ? null
      : `${typeof window !== "undefined" ? window.location.origin : ""}/u/${slug}`;

  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        title="Configurações"
        description="Seu link, seus horários e as regras das suas reuniões."
        action={
          <Button size="sm" onClick={save} disabled={update.isPending}>
            <Save className="size-3.5" /> Salvar
          </Button>
        }
      />

      <div className="space-y-10">
        <Section
          title="Seu link público"
          detail="O que aparece quando alguém abre o seu endereço"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome de link">
              <div className="flex items-center gap-2">
                <span className="text-xs text-faint">/u/</span>
                <Input
                  value={draft.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="seu-nome"
                />
              </div>
            </Field>
            <Field label="Ocupação">
              <Input
                value={draft.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="Ex.: Cabeleireira, personal, dentista…"
              />
            </Field>
            <Field label="Nome completo">
              <Input
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
              />
            </Field>
            <Field label="Cidade">
              <Input
                value={draft.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Ex.: São Paulo, Brasil"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Apresentação">
                <Textarea
                  rows={3}
                  value={draft.presentation}
                  onChange={(e) => set("presentation", e.target.value)}
                  placeholder="Uma frase curta que aparece acima da sua agenda."
                />
              </Field>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Foto de perfil">
              <div className="flex gap-2">
                <Input
                  value={draft.avatar_url ?? ""}
                  onChange={(e) => set("avatar_url", e.target.value || null)}
                  placeholder="https://… ou envie um arquivo"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => fileAvatarRef.current?.click()}
                >
                  <ImagePlus className="size-3.5" /> Arquivo
                </Button>
                <input
                  ref={fileAvatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onPick(f, "avatar_url");
                  }}
                />
              </div>
            </Field>
            <Field label="Capa">
              <div className="flex gap-2">
                <Input
                  value={draft.cover_url ?? ""}
                  onChange={(e) => set("cover_url", e.target.value || null)}
                  placeholder="https://… ou envie um arquivo"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => fileCoverRef.current?.click()}
                >
                  <ImagePlus className="size-3.5" /> Arquivo
                </Button>
                <input
                  ref={fileCoverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onPick(f, "cover_url");
                  }}
                />
              </div>
            </Field>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
            <div>
              <p className="text-sm font-medium">Link ativo</p>
              <p className="text-xs text-muted-foreground">
                Desligue para tirar sua página pública do ar.
              </p>
            </div>
            <Switch
              checked={draft.is_public}
              onCheckedChange={(v) => set("is_public", v)}
            />
          </div>

          {previewUrl && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 className="size-3.5" />
              <a
                href={`/u/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {previewUrl.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}
        </Section>

        <Section
          title="Dias e horários de reunião"
          detail="Escolha em que dias e janelas você aceita pedidos. Fora daqui, ninguém vê horário."
        >
          <div className="space-y-2">
            {WEEKDAY_LABELS.map((label, weekday) => {
              const rule = ruleFor(weekday);
              return (
                <div
                  key={weekday}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-4 py-2.5"
                >
                  <Switch
                    checked={rule.is_available}
                    onCheckedChange={(v) =>
                      updateRule.mutate({ ...rule, is_available: v })
                    }
                    aria-label={`Abrir ${label}`}
                  />
                  <span className="w-24 text-sm font-medium">{label}</span>
                  {rule.is_available ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        className="w-28"
                        value={rule.start_time}
                        onChange={(e) =>
                          updateRule.mutate({
                            ...rule,
                            start_time: e.target.value,
                          })
                        }
                        aria-label={`Início ${label}`}
                      />
                      <span className="text-xs text-faint">até</span>
                      <Input
                        type="time"
                        className="w-28"
                        value={rule.end_time}
                        onChange={(e) =>
                          updateRule.mutate({
                            ...rule,
                            end_time: e.target.value,
                          })
                        }
                        aria-label={`Fim ${label}`}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-faint">
                      Fechado — sem horários neste dia
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="Regras de reunião"
          detail="Duração, intervalo e limite de pedidos"
        >
          <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
            <div>
              <p className="text-sm font-medium">Receber pedidos de reunião</p>
              <p className="text-xs text-muted-foreground">
                Com isso desligado, seu link não mostra a opção de agendar.
              </p>
            </div>
            <Switch
              checked={draft.meetings_enabled}
              onCheckedChange={(v) => set("meetings_enabled", v)}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Duração (min)">
              <Input
                type="number"
                min={10}
                max={240}
                value={draft.meeting_duration_min}
                onChange={(e) =>
                  set("meeting_duration_min", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Intervalo (min)">
              <Input
                type="number"
                min={0}
                max={120}
                value={draft.meeting_buffer_min}
                onChange={(e) =>
                  set("meeting_buffer_min", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Máximo por dia">
              <Input
                type="number"
                min={1}
                max={10}
                value={draft.meeting_max_per_day}
                onChange={(e) =>
                  set("meeting_max_per_day", Number(e.target.value))
                }
              />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
            <div>
              <p className="text-sm font-medium">Aprovar antes de confirmar</p>
              <p className="text-xs text-muted-foreground">
                O pedido cai para você aprovar ou recusar antes de entrar na
                agenda.
              </p>
            </div>
            <Switch
              checked={draft.meeting_requires_approval}
              onCheckedChange={(v) => set("meeting_requires_approval", v)}
            />
          </div>

          <div className="mt-4">
            <Field label="Observações para quem agenda">
              <Textarea
                rows={2}
                value={draft.meeting_requirements}
                onChange={(e) => set("meeting_requirements", e.target.value)}
                placeholder="Ex.: Traga referências; atendo só presencial…"
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Aviso de novo pedido"
          detail="Um pedido de reunião não pode passar despercebido"
        >
          <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
            <div>
              <p className="text-sm font-medium">Tocar som</p>
              <p className="text-xs text-muted-foreground">
                Quando alguém pedir uma reunião, o app apita e mostra o aviso.
              </p>
            </div>
            <Switch checked={sound} onCheckedChange={toggleSound} />
          </div>
        </Section>

        <Section
          title="Seus dados"
          detail="Faça backup, restaure ou comece de novo"
        >
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onExport}>
              <Download className="size-3.5" /> Exportar JSON
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent">
              <Upload className="size-3.5" /> Importar JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const parsed = JSON.parse(await f.text());
                    await importAllData(parsed);
                    toast.success("Importado — recarregando.");
                    setTimeout(() => window.location.reload(), 400);
                  } catch {
                    toast.error("JSON inválido ou importação falhou.");
                  }
                }}
              />
            </label>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                if (!window.confirm("Apagar todos os dados locais?")) return;
                clearLocalDB();
                window.location.reload();
              }}
            >
              <Trash2 className="size-3.5" /> Limpar dados locais
            </Button>
          </div>
        </Section>

        <div className="flex justify-end border-t border-border pt-6">
          <Button onClick={save} disabled={update.isPending}>
            <Save className="size-4" /> Salvar alterações
          </Button>
        </div>
      </div>
    </>
  );
}

async function onExport() {
  try {
    const dump = await exportAllData();
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tempo-vivo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado — guarde o JSON como backup.");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Falha ao exportar.");
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
        {label}
      </Label>
      {children}
    </div>
  );
}
