import { useInsights } from "@/hooks/use-insights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3
} from "lucide-react";
import { AnimatedCard, FadeIn } from "@/components/animated-card";

const INSIGHT_ICONS = {
  achievement: "🏆",
  improvement: "📈",
  pattern: "📊",
  suggestion: "💡",
};

const SEVERITY_COLORS = {
  low: "bg-green-500/10 border-green-500/30 text-green-500",
  medium: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
  high: "bg-red-500/10 border-red-500/30 text-red-500",
};

const TYPE_ICONS = {
  achievement: Sparkles,
  improvement: TrendingUp,
  pattern: BarChart3,
  suggestion: Lightbulb,
};

export function InsightsPage() {
  const { insights, patterns, hasInsights } = useInsights();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Insights Inteligentes</h1>
        <p className="mt-2 text-muted-foreground">
          Análise de padrões e sugestões personalizadas baseadas no seu comportamento
        </p>
      </div>

      {!hasInsights && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎯</div>
              <div>
                <h3 className="font-semibold">Comece a receber insights</h3>
                <p className="text-sm text-muted-foreground">
                  Registre seus primeiros dias na Agenda para começar a receber insights personalizados.
                </p>
                <Button className="mt-3" size="sm">
                  Ir para Agenda
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasInsights && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, index) => {
              const IconComponent = TYPE_ICONS[insight.type];
              return (
                <AnimatedCard key={insight.id} delay={index * 0.1}>
                  <Card className={`border-2 ${SEVERITY_COLORS[insight.severity]}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">{INSIGHT_ICONS[insight.type]}</div>
                          <div>
                            <CardTitle className="text-base">{insight.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {insight.type === "achievement" && "Conquista"}
                              {insight.type === "improvement" && "Melhoria sugerida"}
                              {insight.type === "pattern" && "Padrão identificado"}
                              {insight.type === "suggestion" && "Sugestão"}
                            </CardDescription>
                          </div>
                        </div>
                        <IconComponent className="h-4 w-4 opacity-50" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6">{insight.description}</p>
                      {insight.actionable && (
                        <Button variant="outline" size="sm" className="mt-4">
                          <Target className="mr-2 h-3 w-3" />
                          Ação sugerida
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </AnimatedCard>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Padrões de Comportamento
              </CardTitle>
              <CardDescription>
                Análise dos seus hábitos e tendências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns.map((pattern, index) => (
                  <FadeIn key={pattern.category} delay={index * 0.1}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex-1">
                        <h3 className="font-semibold">{pattern.category}</h3>
                        <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {pattern.trend === "increasing" && (
                          <Badge variant="default" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Crescendo
                          </Badge>
                        )}
                        {pattern.trend === "decreasing" && (
                          <Badge variant="destructive" className="gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Reduzindo
                          </Badge>
                        )}
                        {pattern.trend === "stable" && (
                          <Badge variant="secondary" className="gap-1">
                            <Minus className="h-3 w-3" />
                            Estável
                          </Badge>
                        )}
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🧠</div>
                <div>
                  <h3 className="font-semibold">IA de Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Os insights são gerados automaticamente baseados nos seus dados reais.
                    Quanto mais você registrar, mais precisos serão os insights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}