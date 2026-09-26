import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/page-kit";
import { PublicProfileView } from "@/components/public/public-profile-view";
import { getPublicProfile } from "@/services/profile-service";

/**
 * Modo visitante: quem abre perfilvivo.com/@handle sem conta vê o perfil
 * público e nada mais. Não há navegação do app aqui — só o que foi exposto.
 */
export function PublicProfilePage({ handle }: { handle: string }) {
  const query = useQuery({
    queryKey: ["public-profile", handle],
    queryFn: () => getPublicProfile(handle),
    staleTime: 60_000,
  });

  const share = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: query.data?.profile.name || "Perfil Vivo", url });
        return;
      } catch {
        /* cancelado: cai no copiar */
      }
    }
    copyLink();
  };

  const copyLink = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="visit-banner">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <span className="brand-mark">
            <Activity className="size-3.5" />
          </span>
          <span className="font-ui text-sm font-semibold">Perfil Vivo</span>
        </Link>
        <Link
          to="/rede"
          className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:underline"
        >
          <Users className="size-3.5" />
          Rede
        </Link>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to="/">
            <ArrowLeft className="size-3.5" />
            Criar o meu
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        {query.isLoading ? (
          <PageSkeleton lines={2} rows={2} />
        ) : !query.data ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <h1 className="font-display text-lg font-semibold">Perfil não encontrado</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              @{handle} não existe ou não está público.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-5">
              <Link to="/rede">
                <ArrowLeft className="size-3.5" />
                Ver a rede
              </Link>
            </Button>
          </div>
        ) : (
          <PublicProfileView
            profile={query.data.profile}
            milestones={query.data.milestones}
            projects={query.data.projects}
            chapters={query.data.chapters}
            agenda={query.data.agenda}
            focus={query.data.focus}
            live
            onShare={share}
            onCopy={copyLink}
          />
        )}
      </main>
    </div>
  );
}
