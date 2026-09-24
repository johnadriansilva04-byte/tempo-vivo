import { FileText, Globe2, Heart, MapPin } from "lucide-react";
import { PageHeader } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { useProfile } from "@/hooks/use-profile";
import { SmallFact } from "@/components/pages/shared";

// ------------------------------------------------------------------ AboutPage

export function AboutPage() {
  const { profile } = useProfile();
  const isBlank = !profile || profile.name.trim() === "";

  return (
    <>
      <PageHeader
        eyebrow="Quem sou"
        title={isBlank ? "Sobre" : `Sobre ${profile.name.split(" ")[0]}`}
        mark="VI"
        description="A pessoa por trás dos registros, seus vínculos e o sentido que atravessa sua trajetória."
        lede="Um perfil não é vitrine: é o retrato de quem está por trás dos registros."
      />
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {isBlank ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="Complete seu perfil"
              description="Sua apresentação e família aparecerão aqui quando você preencher suas informações."
              actionLabel="Abrir Configurações"
              onAction={() => (window.location.href = "/configuracoes")}
            />
          ) : (
            <>
              {profile.bio.trim() !== "" ? (
                <p className="font-display text-2xl leading-relaxed text-foreground">
                  “{profile.bio}”
                </p>
              ) : (
                <p className="text-sm leading-7 text-muted-foreground">
                  Escreva sua bio em Configurações para apresentar sua trajetória aqui.
                </p>
              )}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <SmallFact icon={MapPin} label="Vive em" value={profile.location || "—"} />
                <SmallFact
                  icon={Globe2}
                  label="Nasceu em"
                  value={profile.birth_date ? profile.birth_date.slice(0, 4) : "—"}
                />
              </div>
            </>
          )}
        </div>
        <div className="family-panel">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-accent-foreground" />
            <h2 className="font-display text-lg font-semibold">Núcleo familiar</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Edite seus vínculos em Configurações para vê-los aqui. Seus dados não são uma rede
            social — são sua história.
          </p>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-faint">
            Vínculos preservados como parte da trajetória, não como conexões sociais.
          </p>
        </div>
      </div>
    </>
  );
}
