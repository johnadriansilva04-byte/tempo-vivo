import { useEffect, useState } from "react";
import { Check, Copy, Eye, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { PublicProfileView } from "@/components/public/public-profile-view";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useCareerChapters } from "@/hooks/use-career-chapters";
import { useMilestones } from "@/hooks/use-milestones";
import { useProjects } from "@/hooks/use-projects";
import { useAgendaEvents } from "@/hooks/use-agenda-events";
import { useWeeklyFocus } from "@/hooks/use-weekly-focus";
import { handleFromName, isValidHandle, normalizeHandle, resolveHandle } from "@/lib/handle";
import { ensurePublicHandle, publishToNetwork } from "@/services/profile-service";
import { cn } from "@/lib/utils";

/** Sobre = perfil público: veja como os outros veem você e compartilhe o link. */
export function AboutPage() {
  const { profile } = useProfile();
  const update = useUpdateProfile();
  const { milestones } = useMilestones();
  const { projects } = useProjects();
  const { chapters } = useCareerChapters();
  const { events } = useAgendaEvents();
  const { focus } = useWeeklyFocus();
  const [copied, setCopied] = useState(false);
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");

  // O link só existe se o handle existir: cria a partir do nome quando vazio.
  useEffect(() => {
    if (profile && profile.name.trim() !== "") void ensurePublicHandle();
  }, [profile]);

  // Mantém o diretório da rede (/rede) em dia com o que foi publicado aqui.
  useEffect(() => {
    if (profile?.name.trim()) void publishToNetwork();
  }, [profile, milestones, projects, chapters, events, focus]);

  if (!profile) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-64 rounded-lg" />
      </div>
    );
  }

  const handle = resolveHandle(profile) || handleFromName(profile.name);
  const publicUrl =
    typeof window === "undefined"
      ? `perfilvivo.com/@${handle}`
      : `${window.location.origin}/@${handle}`;
  const isBlank = profile.name.trim() === "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: profile.name || "Perfil Vivo", url: publicUrl });
        return;
      } catch {
        /* cancelado: cai no copiar */
      }
    }
    void copyLink();
  };

  const saveHandle = () => {
    const clean = normalizeHandle(handleDraft);
    if (!isValidHandle(clean)) {
      toast.error("Use ao menos 2 letras ou números, sem espaços.");
      return;
    }
    update.mutate({ handle: clean }, { onSuccess: () => setEditingHandle(false) });
  };

  if (isBlank) {
    return (
      <>
        <PageHeader title="Sobre" detail="Perfil público" />
        <EmptyState
          icon={<Eye className="size-5" />}
          title="Complete seu perfil"
          description="Preencha seu nome em Configurações para gerar seu perfil público."
          actionLabel="Abrir Configurações"
          to="/configuracoes"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Perfil público"
        detail="Como os outros veem você"
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={copyLink}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              Copiar link
            </Button>
            <Button size="sm" onClick={share}>
              <Share2 className="size-3.5" /> Compartilhar
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <Link2 className="size-4 shrink-0 text-accent-foreground" />
        {editingHandle ? (
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm text-muted-foreground">perfilvivo.com/@</span>
            <Input
              autoFocus
              value={handleDraft}
              onChange={(e) => setHandleDraft(e.target.value)}
              className="h-8 max-w-48"
              onKeyDown={(e) => e.key === "Enter" && saveHandle()}
            />
            <Button size="sm" onClick={saveHandle} disabled={update.isPending}>
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingHandle(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <>
            <span className="truncate text-sm font-medium text-foreground">
              perfilvivo.com/@{handle}
            </span>
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-4"
              onClick={() => {
                setHandleDraft(handle);
                setEditingHandle(true);
              }}
            >
              Editar
            </button>
          </>
        )}
      </div>

      <div className={cn("mx-auto max-w-3xl")}>
        <PublicProfileView
          profile={{ ...profile, handle }}
          milestones={milestones}
          projects={projects}
          chapters={chapters}
          agenda={events}
          focus={focus}
          onShare={share}
          onCopy={copyLink}
        />
      </div>
    </>
  );
}
