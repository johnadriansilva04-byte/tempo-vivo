import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, CalendarDays, Copy, MapPin, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/page-kit";
import { useNetwork } from "@/hooks/use-network";
import { filterPeople } from "@/lib/network";
import type { PublicProfileSummary } from "@/services/profile-service";

function profileUrl(handle: string): string {
  if (typeof window === "undefined") return `perfilvivo.com/@${handle}`;
  return `${window.location.origin}/@${handle}`;
}

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Rede: todos os perfis públicos do Perfil Vivo num só lugar.
 * Cada cartão é um atalho para perfilvivo.com/@handle — com a agenda de quem
 * compartilhou. Nada de texto: nome, @, o que faz e o próximo compromisso.
 */
export function NetworkPage() {
  const { people, isLoading } = useNetwork();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterPeople(people, query), [people, query]);

  const copy = async (person: PublicProfileSummary) => {
    try {
      await navigator.clipboard.writeText(profileUrl(person.handle));
      toast.success(`Link de ${person.name} copiado.`);
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
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Users className="size-3.5" />
          Rede
        </span>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to="/">
            <ArrowLeft className="size-3.5" />
            Criar o meu
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Rede</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {people.length === 0
                ? "Perfis públicos do Perfil Vivo"
                : `${people.length} ${people.length === 1 ? "perfil público" : "perfis públicos"}`}
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, @ ou cidade"
              className="pl-9"
              aria-label="Buscar perfis"
            />
          </div>
        </div>

        {isLoading ? (
          <PageSkeleton lines={1} rows={3} />
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <h2 className="font-display text-base font-semibold">
              {people.length === 0 ? "Ninguém na rede ainda" : "Nenhum perfil encontrado"}
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              {people.length === 0
                ? "Quando alguém preencher o perfil em Sobre, o cartão aparece aqui com a agenda pública."
                : "Tente outro nome, @ ou cidade."}
            </p>
          </div>
        ) : (
          <ul className="network-grid">
            {filtered.map((person) => (
              <li key={person.handle}>
                <article className="network-card">
                  <Link
                    to="/@{$handle}"
                    params={{ handle: person.handle }}
                    className="network-card-main"
                  >
                    <span className="network-avatar">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="size-full object-cover" />
                      ) : (
                        person.initials
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-semibold text-foreground">
                        {person.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        @{person.handle}
                      </span>
                      {person.role.trim() !== "" && (
                        <span className="mt-1 block truncate text-xs text-faint">
                          {person.role}
                        </span>
                      )}
                    </span>
                  </Link>

                  <div className="network-card-meta">
                    {person.location.trim() !== "" && (
                      <span className="network-chip">
                        <MapPin className="size-3" />
                        {person.location}
                      </span>
                    )}
                    <span className="network-chip">{person.items} itens</span>
                    {person.next_event && (
                      <span className="network-chip">
                        <CalendarDays className="size-3" />
                        {dateLabel(person.next_event)}
                      </span>
                    )}
                  </div>

                  <div className="network-card-actions">
                    <Button asChild size="sm" variant="outline" className="h-8 flex-1 text-xs">
                      <Link to="/@{$handle}" params={{ handle: person.handle }}>
                        Abrir perfil
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={`Copiar link de ${person.name}`}
                      onClick={() => void copy(person)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
