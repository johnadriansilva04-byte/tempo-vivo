import { ImagePlus, MapPin, Pencil, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LifetimeTracker } from "@/components/lifetime-tracker";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";

/** Cabeçalho do perfil: avatar, nome, cargo, banner personalizável e o donut de finitude. */
export function ProfileHeader() {
  const { profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [bannerUrlOpen, setBannerUrlOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", role: "", location: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const isBlank = profile?.name.trim() === "" || (profile?.name ?? "") === "";

  if (!profile) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-3.5 w-32" />
      </div>
    );
  }

  const startEdit = () => {
    setDraft({ name: profile.name, role: profile.role, location: profile.location });
    setEditing(true);
  };

  const saveEdit = () => {
    updateProfile.mutate(draft);
    setEditing(false);
  };

  const setBanner = (url: string | null) => updateProfile.mutate({ cover_url: url });

  const onPickFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setBanner(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <section className="profile-header">
      {profile.cover_url ? (
        <div className="profile-banner" style={{ backgroundImage: `url(${profile.cover_url})` }} />
      ) : (
        <div className="profile-banner-default" />
      )}

      <button
        type="button"
        className="profile-banner-toggle"
        aria-label="Personalizar banner"
        onClick={() => {
          if (profile.cover_url) {
            setBanner(null);
            setBannerUrlOpen(false);
          } else {
            setBannerUrlOpen((v) => !v);
          }
        }}
      >
        {profile.cover_url ? <X className="size-3.5" /> : <ImagePlus className="size-3.5" />}
      </button>

      {bannerUrlOpen && (
        <div className="absolute right-3 top-12 z-30 w-72 rounded-lg border border-border bg-popover p-3 shadow-xl">
          <p className="text-xs font-semibold text-foreground">Paisagem de fundo</p>
          <p className="mt-1 text-[11px] text-faint">
            Cole a URL de uma imagem ou envie um arquivo.
          </p>
          <Input
            autoFocus
            placeholder="https://…"
            className="mt-2 h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value.trim();
                setBanner(value || null);
                setBannerUrlOpen(false);
              }
            }}
          />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 flex-1 text-xs"
              onClick={() => fileRef.current?.click()}
            >
              Enviar
            </Button>
            {profile.cover_url && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 flex-1 text-xs"
                onClick={() => {
                  setBanner(null);
                  setBannerUrlOpen(false);
                }}
              >
                Remover
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickFile(file);
              setBannerUrlOpen(false);
            }}
          />
        </div>
      )}

      <div className="profile-header-body">
        <div className="flex min-w-0 items-center gap-5">
          <div className="avatar-main">{profile.initials}</div>
          <div className="min-w-0">
            {editing ? (
              <div className="space-y-2">
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Nome"
                />
                <Input
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Cargo"
                />
                <Input
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Localização"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={saveEdit}
                    disabled={updateProfile.isPending}
                  >
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setEditing(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group/header">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent-foreground">
                  Trajetória viva
                  <button
                    type="button"
                    aria-label="Editar perfil"
                    className="opacity-0 transition-opacity group-hover/header:opacity-60 hover:!opacity-100"
                    onClick={startEdit}
                  >
                    <Pencil className="size-3" />
                  </button>
                </p>
                <h1 className="font-display text-3xl font-semibold text-foreground">
                  {isBlank ? "Seu nome" : profile.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isBlank ? (
                    <a
                      href="/configuracoes"
                      className="underline decoration-dotted underline-offset-4"
                    >
                      Preencha seu perfil em Configurações →
                    </a>
                  ) : (
                    profile.role
                  )}
                </p>
                {!isBlank && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-faint">
                    <MapPin className="size-3" />
                    {profile.location}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <LifetimeTracker />
      </div>
    </section>
  );
}
