import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, Share2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <header className="visit-banner">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <span className="brand-mark">
            <Activity className="size-3.5" />
          </span>
          <span className="font-ui text-sm font-semibold">Perfil Vivo</span>
        </Link>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Share2 className="size-3.5" />
          Perfil público
        </span>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to="/">
            <ArrowLeft className="size-3.5" />
            Criar o meu
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        {query.isLoading ? (
          <PageSkeleton lines={2} rows={2} />
        ) : !query.data ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <h1 className="font-display text-lg font-semibold">Perfil não encontrado</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              @{handle} não existe ou não está público.
            </p>
          </div>
        ) : (
          <PublicProfileView
            profile={query.data.profile}
            milestones={query.data.milestones}
            projects={query.data.projects}
            chapters={query.data.chapters}
          />
        )}
      </main>
    </div>
  );
}
