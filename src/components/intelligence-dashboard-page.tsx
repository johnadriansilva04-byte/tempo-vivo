import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain,
  TrendingUp,
  Lightbulb,
  Activity,
  Target,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  BarChart3,
  Clock,
  Award
} from "lucide-react";
import { useIntelligenceDashboard } from "@/hooks/use-intelligence-dashboard";
import { AnimatedCard, FadeIn } from "@/components/animated-card";

export function IntelligenceDashboardPage() {
  const {
    predictions,
    productivityInsights,
    sentimentData,
    sentimentTrend,
    recommendations,
    analytics,
    userContext,
  } = useIntelligenceDashboard();

  const highPriorityRecommendations = recommendations.filter(r => r.priority === 'high');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard de Inteligência</h1>
        <p className="mt-2 text-muted-foreground">
          IA local combinando predição, sentimento e recomendações
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AnimatedCard delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-purple-500" />
                Sentimento Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tendência</span>
                  <Badge variant={sentimentTrend === 'improving' ? 'default' : sentimentTrend === 'declining' ? 'destructive' : 'secondary'}>
                    {sentimentTrend === 'improving' && <ArrowUp className="h-3 w-3 mr-1" />}
                    {sentimentTrend === 'declining' && <ArrowDown className="h-3 w-3 mr-1" />}
                    {sentimentTrend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                    {sentimentTrend === 'improving' ? 'Melhorando' : sentimentTrend === 'declining' ? 'Piorando' : 'Estável'}
                  </Badge>
                </div>
                <div className="text-3xl font-bold">
                  {sentimentData.length > 0 
                    ? (sentimentData.reduce((sum, s) => sum + s.sentiment.score, 0) / sentimentData.length).toFixed(2)
                    : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Score médio de sentimento</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Produtividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Média</span>
                  <Badge variant={productivityInsights.trend === 'increasing' ? 'default' : productivityInsights.trend === 'decreasing' ? 'destructive' : 'secondary'}>
                    {productivityInsights.trend === 'increasing' && <ArrowUp className="h-3 w-3 mr-1" />}
                    {productivityInsights.trend === 'decreasing' && <ArrowDown className="h-3 w-3 mr-1" />}
                    {productivityInsights.trend === 'increasing' ? 'Crescendo' : productivityInsights.trend === 'decreasing' ? 'Queda' : 'Estável'}
                  </Badge>
                </div>
                <div className="text-3xl font-bold">
                  {productivityInsights.averageProductivity.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">Caracteres por dia</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-blue-500" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Eventos</span>
                  <Badge variant="outline">{analytics.totalEvents}</Badge>
                </div>
                <div className="text-3xl font-bold">
                  {analytics.activeUsers}
                </div>
                <p className="text-xs text-muted-foreground">Usuários ativos (7 dias)</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FadeIn delay={0.4}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Predição da Próxima Semana
              </CardTitle>
              <CardDescription>
                Produtividade prevista baseada em padrões históricos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.slice(0, 5).map((prediction, index) => (
                  <div key={prediction.date} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="text-sm font-medium w-24">
                      {new Date(prediction.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                    <div className="flex-1">
                      <Progress value={Math.min(100, prediction.predictedProductivity / 3)} />
                    </div>
                    <div className="text-sm font-medium w-16 text-right">
                      {prediction.predictedProductivity.toFixed(0)}
                    </div>
                    <Badge variant={prediction.trend === 'increasing' ? 'default' : prediction.trend === 'decreasing' ? 'destructive' : 'secondary'} className="text-xs">
                      {prediction.trend === 'increasing' && <ArrowUp className="h-3 w-3" />}
                      {prediction.trend === 'decreasing' && <ArrowDown className="h-3 w-3" />}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.5}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recomendações da IA
              </CardTitle>
              <CardDescription>
                Sugestões personalizadas baseadas no seu contexto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {highPriorityRecommendations.length > 0 ? (
                  highPriorityRecommendations.slice(0, 3).map((rec, index) => (
                    <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Alta
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Tudo em ordem!</p>
                      <p className="text-xs text-muted-foreground">Sem recomendações de alta prioridade</p>
                    </div>
                  </div>
                )}
                {recommendations.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todas as {recommendations.length} recomendações
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FadeIn delay={0.6}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Padrões de Sentimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sentimentData.slice(-7).map((data, index) => (
                  <div key={data.date} className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground w-24">
                      {new Date(data.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={((data.sentiment.score + 1) / 2) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="text-sm font-medium w-12 text-right">
                      {data.sentiment.score.toFixed(1)}
                    </div>
                    <Badge 
                      variant={data.sentiment.type === 'positive' ? 'default' : data.sentiment.type === 'negative' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {data.sentiment.type === 'positive' ? 'Positivo' : data.sentiment.type === 'negative' ? 'Negativo' : 'Neutro'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.7}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Insights de Produtividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Total de Entradas</p>
                    <p className="text-xs text-muted-foreground">Dias registrados</p>
                  </div>
                  <div className="text-2xl font-bold">{productivityInsights.totalEntries}</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Melhor Dia</p>
                    <p className="text-xs text-muted-foreground">Produtividade máxima</p>
                  </div>
                  <div className="text-sm font-medium">
                    {productivityInsights.bestDay !== 'N/A' 
                      ? new Date(productivityInsights.bestDay).toLocaleDateString('pt-BR')
                      : 'N/A'}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Zap className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Streak Atual</p>
                    <p className="text-xs text-muted-foreground">Dias consecutivos</p>
                  </div>
                  <div className="text-2xl font-bold">{userContext.currentStreak}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">✨</div>
            <div className="flex-1">
              <h3 className="font-semibold">IA Local Funcionando</h3>
              <p className="text-sm text-muted-foreground">
                Todos os sistemas de inteligência estão rodando 100% localmente, sem dependências externas e zero custo.
              </p>
            </div>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Ver Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}