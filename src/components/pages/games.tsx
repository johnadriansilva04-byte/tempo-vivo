import { ArrowUpRight, Brain, Gamepad2, GraduationCap, Sparkles, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/page-kit";

const PRACINHA = "https://pracinha.online";

const PRACTICE_GROUNDS = [
  {
    href: `${PRACINHA}/teste-de-qi`,
    icon: Brain,
    name: "Teste de QI",
    tag: "Raciocínio",
    description:
      "Trilha de treino com matrizes lógicas geradas na hora e explicação das regras a cada resposta, ou simulação completa e cronometrada.",
  },
  {
    href: `${PRACINHA}/cidadela`,
    icon: Swords,
    name: "Cidadela dos Clássicos",
    tag: "Estratégia",
    description:
      "Xadrez, dama, trilha, sumô de carros e futebol do campus. Partidas rápidas para exercitar a cabeça entre um registro e outro.",
  },
  {
    href: `${PRACINHA}/campus`,
    icon: GraduationCap,
    name: "Campus Universitário",
    tag: "Comunidade",
    description:
      "Escolha uma função, circule pela biblioteca e pelos laboratórios e use o gerador de texto do campus.",
  },
] as const;

export function GamesPage() {
  return (
    <>
      <PageHeader title="Jogos" detail="Parceria Pracinha" />

      <div className="games-stage">
        <div className="game-orbit">
          <Gamepad2 />
        </div>
        <span className="status status-open">
          <Sparkles className="size-3" />
          Ligado à pracinha.online
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold">
          Uma pracinha inteira para jogar
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          O Perfil Vivo guarda sua trajetória. A pracinha cuida do intervalo: teste de QI, clássicos
          de tabuleiro e o campus da Cidadela.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild>
            <a href={PRACINHA} target="_blank" rel="noopener noreferrer">
              Visitar a Cidadela
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      <Section
        className="mt-10"
        title="Caminhos da pracinha"
        detail="Abre em uma nova aba, no site da Cidadela do Pracinha."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {PRACTICE_GROUNDS.map(({ href, icon: Icon, name, tag, description }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="game-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="icon-tile">
                  <Icon />
                </div>
                <ArrowUpRight className="size-4 text-faint" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
                {tag}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </a>
          ))}
        </div>
      </Section>
    </>
  );
}
