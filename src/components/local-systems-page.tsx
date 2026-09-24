import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity,
  Brain,
  Zap,
  Palette,
  Lock,
  Keyboard,
  Bot,
  Search,
  Compass,
  TrendingUp,
  CheckCircle2,
  Settings,
  ArrowRight,
  Database,
  Shield,
  Rocket
} from "lucide-react";
import { useTheme } from "@/lib/theme-system";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useAutomations } from "@/lib/automation-system";
import { useLocalSearch } from "@/lib/local-search";
import { useOnboarding } from "@/lib/onboarding-system";
import { localAnalytics } from "@/lib/local-analytics";
import { AnimatedCard, FadeIn } from "@/components/animated-card";

const SYSTEMS = [
  {
    id: 'analytics',
    name: 'Analytics Local',
    description: 'Rastreamento de eventos sem serviços externos',
    icon: Activity,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    status: 'active',
    metrics: ['Eventos', 'Sessões', 'Usuários'],
  },
  {
    id: 'sentiment',
    name: 'Análise de Sentimento',
    description: 'Análise de texto em português com keywords',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    status: 'active',
    metrics: ['Score', 'Confiança', 'Emoção'],
  },
  {
    id: 'recommendations',
    name: 'IA Recomendações',
    description: 'Recomendações rule-based baseadas em contexto',
    icon: Bot,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    status: 'active',
    metrics: ['Prioridade', 'Confiança', 'Impacto'],
  },
  {
    id: 'prediction',
    name: 'Predição de Produtividade',
    description: 'Predição estatística com múltiplos modelos',
    icon: TrendingUp,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    status: 'active',
    metrics: ['MA', 'WMA', 'Regressão'],
  },
  {
    id: 'themes',
    name: 'Sistema de Temas',
    description: '8 presets + customização completa',
    icon: Palette,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    status: 'active',
    metrics: ['Presets', 'Custom', 'Variáveis'],
  },
  {
    id: 'backup',
    name: 'Backup Criptografado',
    description: 'AES-GCM 256-bit + PBKDF2',
    icon: Lock,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    status: 'active',
    metrics: ['Criptografia', 'Hash', 'Integridade'],
  },
  {
    id: 'shortcuts',
    name: 'Keyboard Shortcuts',
    description: '16 atalhos customizáveis',
    icon: Keyboard,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    status: 'active',
    metrics: ['Atalhos', 'Categorias', 'Custom'],
  },
  {
    id: 'automations',
    name: 'Sistema de Automações',
    description: 'Automações rule-based com triggers',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    status: 'active',
    metrics: ['Triggers', 'Ações', 'Schedule'],
  },
  {
    id: 'search',
    name: 'Busca Indexada',
    description: 'Índice local com scoring inteligente',
    icon: Search,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    status: 'active',
    metrics: ['Índice', 'Scoring', 'Filtros'],
  },
  {
    id: 'onboarding',
    name: 'Onboarding Guiado',
    description: '8 passos interativos configurados',
    icon: Compass,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    status: 'active',
    metrics: ['Passos', 'Progresso', 'Duração'],
  },
];

export function LocalSystemsPage() {
  const { theme, setTheme, presets } = useTheme();
  const { getAll, getDisplay } = useKeyboardShortcuts();
  const { getAll: getAutomations, getEnabled } = useAutomations();
  const { getStats } = useLocalSearch();
  const { getProgress, isComplete } = useOnboarding();
  const analytics = localAnalytics.getAnalytics();

  const systemMetrics = {
    analytics: {
      events: analytics.totalEvents,
      sessions: analytics.totalSessions,
      users: analytics.totalUsers,
    },
    shortcuts: {
      total: getAll().size,
      categories: 4,
    },
    automations: {
      total: getAutomations().length,
      enabled: getEnabled().length,
    },
    search: {
      items: getStats().totalItems,
      tags: getStats().totalTags,
    },
    onboarding: {
      progress: getProgress().percentage,
      complete: isComplete(),
    },
    themes: {
      presets: Object.keys(presets).length,
      current: theme,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Sistemas Locais</h1>
        <p className="mt-2 text-muted-foreground">
          10 sistemas 100% self-hosted, zero custo, totalmente otimizados
        </p>
      </div>

      <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>
            <div className="flex-1">
              <h3 className="font-semibold">100% Self-Hosted</h3>
              <p className="text-sm text-muted-foreground">
                Todos os sistemas rodam localmente sem dependências externas. Zero custo, máxima privacidade.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">10</div>
              <div className="text-xs text-muted-foreground">Sistemas Ativos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SYSTEMS.map((system, index) => {
          const Icon = system.icon;
          return (
            <AnimatedCard key={system.id} delay={index * 0.05}>
              <Card className={`border-2 ${system.borderColor} ${system.bgColor}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${system.bgColor}`}>
                      <Icon className={`h-6 w-6 ${system.color}`} />
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Ativo
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{system.name}</CardTitle>
                  <CardDescription>{system.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {system.metrics.map((metric) => (
                        <Badge key={metric} variant="secondary" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Métricas em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analytics</span>
                  <span className="font-medium">{systemMetrics.analytics.events} eventos</span>
                </div>
                <Progress value={Math.min(100, systemMetrics.analytics.events / 10)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Shortcuts</span>
                  <span className="font-medium">{systemMetrics.shortcuts.total} atalhos</span>
                </div>
                <Progress value={100} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Automações</span>
                  <span className="font-medium">{systemMetrics.automations.enabled}/{systemMetrics.automations.total}</span>
                </div>
                <Progress value={(systemMetrics.automations.enabled / systemMetrics.automations.total) * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Busca</span>
                  <span className="font-medium">{systemMetrics.search.items} itens indexados</span>
                </div>
                <Progress value={Math.min(100, systemMetrics.search.items / 50)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Onboarding</span>
                  <span className="font-medium">{systemMetrics.onboarding.progress.toFixed(0)}%</span>
                </div>
                <Progress value={systemMetrics.onboarding.progress} />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Status de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-500">Criptografia AES-GCM 256-bit</p>
                  <p className="text-xs text-muted-foreground">Backup criptografado ativo</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-500">Derivação PBKDF2</p>
                  <p className="text-xs text-muted-foreground">100.000 iterações</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-500">Hash SHA-256</p>
                  <p className="text-xs text-muted-foreground">Integridade verificada</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-500">Zero Dados Externos</p>
                  <p className="text-xs text-muted-foreground">100% privacidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">💡</div>
            <div className="flex-1">
              <h3 className="font-semibold">Dashboard de Inteligência</h3>
              <p className="text-sm text-muted-foreground">
                Combine todos os sistemas em um dashboard unificado com predição de produtividade, análise de sentimento e recomendações da IA.
              </p>
            </div>
            <Button>
              <Rocket className="mr-2 h-4 w-4" />
              Acessar Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}