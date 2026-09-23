import { useEffect, useRef, useState } from "react";
import { Eye, ImagePlus, Save, Trash2 } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { PageHeader } from "@/components/page-kit";
import { LifetimeTracker } from "@/components/lifetime-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

type Draft = {
  name: string;
  role: string;
  location: string;
  bio: string;
  birth_date: string;
  target_lifespan: number;
  avatar_url: string;
  cover_url: string;
};

const empty: Draft = {
  name: "",
  role: "",
  location: "",
  bio: "",
  birth_date: "",
  target_lifespan: 100,
  avatar_url: "",
  cover_url: "",
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function ConfigPage() {
  const { profile } = useProfile();
  const update = useUpdateProfile();
  const [draft, setDraft] = useState<Draft>(empty);
  const [touched, setTouched] = useState(false);
  const fileAvatarRef = useRef<HTMLInputElement>(null);
  const fileCoverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile || touched) return;
    setDraft({
      name: profile.name,
      role: profile.role,
      location: profile.location,
      bio: profile.bio,
      birth_date: profile.birth_date,
      target_lifespan: profile.target_lifespan,
      avatar_url: profile.avatar_url ?? "",
      cover_url: profile.cover_url ?? "",
    });
  }, [profile, touched]);

  if (!profile) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setTouched(true);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const incomplete = profile.name.trim() === "";

  const save = () => {
    const payload = {
      name: draft.name.trim() || "",
      role: draft.role.trim(),
      location: draft.location.trim(),
      bio: draft.bio.trim(),
      birth_date: draft.birth_date || "",
      target_lifespan: Math.max(40, Math.min(150, draft.target_lifespan)),
      avatar_url: draft.avatar_url.trim() || null,
      cover_url: draft.cover_url.trim() || null,
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.success("Perfil salvo. Suas alterações já estão visíveis em todo o app.");
        setTouched(false);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
    });
  };

  const clearLocal = () => {
    try {
      window.localStorage.removeItem("perfil-vivo:db:v2");
      window.localStorage.removeItem("perfil-vivo:db:v1");
    } catch {
      // armazenamento local pode não existir neste ambiente
    }
    window.location.reload();
  };

  const onPick = (file: File, field: "avatar_url" | "cover_url") => {
    const reader = new FileReader();
    reader.onload = () => set(field, String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        title="Configurações"
        description="Defina quem é você no Perfil Vivo. Todos os dados ficam salvos — no seu banco quando Supabase está configurado, ou localmente até lá."
        action={
          <Button size="sm" onClick={save} disabled={update.isPending}>
            <Save className="size-3.5" /> Salvar
          </Button>
        }
      />

      {incomplete && (
        <div className="mb-6 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3">
          <p className="text-sm font-medium text-primary">Complete seu perfil</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Preencha seu nome e demais dados abaixo. O app começa vazio — só o que você escrever vai
            aparecer.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* Formulário */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-faint">
              Identidade
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo">
                <Input
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </Field>
              <Field label="O que você faz">
                <Input
                  value={draft.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="Ex.: Pesquisadora, engenheiro, artista…"
                />
              </Field>
              <Field label="Onde vive">
                <Input
                  value={draft.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Ex.: São Paulo, Brasil"
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="Data de nascimento">
                <Input
                  type="date"
                  value={draft.birth_date}
                  onChange={(e) => set("birth_date", e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Bio curta">
                  <Textarea
                    rows={3}
                    value={draft.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Uma frase que resume sua trajetória…"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-faint">
              Tempo de vida
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Ajusta o horizonte do donut Memento Mori e os 4 ciclos de 25 anos.
            </p>
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Horizonte alvo
                </Label>
                <span className="font-display text-sm font-bold text-primary">
                  {draft.target_lifespan} anos
                </span>
              </div>
              <Slider
                className="mt-3"
                value={[draft.target_lifespan]}
                min={40}
                max={150}
                step={1}
                onValueChange={(arr) => set("target_lifespan", arr[0] ?? 100)}
              />
              <p className="mt-2 text-[11px] text-faint">40–150 anos. Padrão: 100.</p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-faint">
              Visual
            </h2>
            <div className="mt-5 grid gap-4">
              <Field label="Foto do perfil (URL)">
                <div className="flex gap-2">
                  <Input
                    value={draft.avatar_url}
                    onChange={(e) => set("avatar_url", e.target.value)}
                    placeholder="https://… ou deixe vazio para usar iniciais"
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
                      if (f) onPick(f, "avatar_url");
                    }}
                  />
                </div>
              </Field>
              <Field label="Banner de fundo (URL)">
                <div className="flex gap-2">
                  <Input
                    value={draft.cover_url}
                    onChange={(e) => set("cover_url", e.target.value)}
                    placeholder="https://… — aparece no topo do Dashboard"
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
                      if (f) onPick(f, "cover_url");
                    }}
                  />
                </div>
              </Field>
            </div>
          </section>

          <div className="flex flex-wrap gap-2 border-t border-border pt-6">
            <Button onClick={save} disabled={update.isPending}>
              <Save className="size-4" /> Salvar alterações
            </Button>
            <Button variant="ghost" onClick={clearLocal} className="gap-1.5 text-xs text-faint">
              <Trash2 className="size-3.5" /> Limpar dados locais e recarregar
            </Button>
          </div>
        </div>

        {/* Preview ao vivo */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
            <Eye className="size-3.5" /> Preview do perfil
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="relative h-28">
              {draft.cover_url ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${draft.cover_url})` }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="flex gap-4 p-5 pt-0">
              <div className="-mt-8 grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-card bg-primary text-sm font-bold text-primary-foreground shadow-lg">
                {draft.avatar_url ? (
                  <img src={draft.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  initialsOf(draft.name || "?")
                )}
              </div>
              <div className="min-w-0 pt-2">
                <p className="truncate font-display text-base font-semibold text-foreground">
                  {draft.name || "Seu nome"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {draft.role || "Sua ocupação"}
                </p>
                <p className="mt-1 text-xs text-faint">{draft.location || "Sua cidade"}</p>
                {draft.bio && (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">{draft.bio}</p>
                )}
              </div>
            </div>
            <div className="border-t border-border p-4">
              <PreviewLifetime
                birth_date={draft.birth_date}
                target_lifespan={draft.target_lifespan}
              />
            </div>
          </div>
          <p className="text-xs leading-5 text-faint">
            Suas alterações aparecem em todo o app imediatamente. Quando o Supabase estiver
            configurado, ficam persistidas no banco para o usuário logado.
          </p>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</Label>
      {children}
    </div>
  );
}

function PreviewLifetime({
  birth_date,
  target_lifespan,
}: {
  birth_date: string;
  target_lifespan: number;
}) {
  const now = new Date();
  const birth = new Date(`${birth_date}T00:00:00`);
  const valid =
    birth_date !== "" && !Number.isNaN(birth.getTime()) && birth.getTime() <= now.getTime();
  if (!valid) {
    return (
      <p className="text-xs text-faint">
        Informe uma data de nascimento válida para ver o Memento Mori.
      </p>
    );
  }
  const daysLived = Math.floor((now.getTime() - birth.getTime()) / (24 * 60 * 60 * 1000));
  const age = Math.floor(daysLived / 365.2425);
  const targetDays = Math.round(target_lifespan * 365.2425);
  const pct = Math.min(100, (daysLived / targetDays) * 100);
  const idx = Math.min(Math.floor(age / 25), 3);
  const names = ["Aprendizado", "Construção", "Consolidação", "Plenitude"];
  return (
    <div className="flex items-center gap-4">
      <div className="size-20 shrink-0 rounded-full border border-border bg-muted p-2">
        <LifetimeTracker compact />
      </div>
      <div className="text-xs">
        <p className="font-semibold text-foreground">
          {age} anos · {pct.toFixed(1)}% de {target_lifespan}
        </p>
        <p className="text-muted-foreground">
          Ciclo {idx + 1} · {names[idx]}
        </p>
      </div>
    </div>
  );
}
