import { useAnalytics } from "@/hooks/use-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award,
  Clock,
  Flame,
  Zap
} from "lucide-react";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export function AnalyticsPage() {
  const analytics = useAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Analytics Avançado</h1>
        <p className="mt-2 text-muted-foreground">
          Insights sobre sua produtividade e padrões de comportamento
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistência</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.patterns.consistency}%</div>
            <p className="text-xs text-muted-foreground">
              Dias com resumo completado
            </p>
            <Progress value={analytics.patterns.consistency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Dia</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.patterns.bestDay}</div>
            <p className="text-xs text-muted-foreground">
              Dia mais produtivo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.patterns.averageDailyGoals}</div>
            <p className="text-xs text-muted-foreground">
              Metas por dia (média)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.projects.completed}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.projects.inProgress} em andamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtividade Semanal</CardTitle>
            <CardDescription>
              Evolução da sua produtividade ao longo das semanas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.productivity.weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="productivity" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtividade Mensal</CardTitle>
            <CardDescription>
              Comparação mensal da sua produtividade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.productivity.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="productivity" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projects and Milestones */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Projetos</CardTitle>
            <CardDescription>
              Visão geral do progresso dos seus projetos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Concluídos</span>
              <Badge variant="default">{analytics.projects.completed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Em Andamento</span>
              <Badge variant="secondary">{analytics.projects.inProgress}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Tempo Médio de Conclusão</span>
              <span className="text-sm font-medium">{analytics.projects.averageCompletionTime} dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marcos por Categoria</CardTitle>
            <CardDescription>
              Distribuição das suas realizações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.milestones.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.milestones.byCategory).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(analytics.milestones.byCategory).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhum marco registrado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Insights Personalizados
          </CardTitle>
          <CardDescription>
            Recomendações baseadas nos seus padrões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.patterns.consistency > 70 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-500">Excelente consistência!</p>
                <p className="text-sm text-muted-foreground">
                  Você está mantendo uma rotina sólide. Continue assim!
                </p>
              </div>
            </div>
          )}

          {analytics.patterns.consistency < 50 && analytics.patterns.consistency > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Espaço para melhorar</p>
                <p className="text-sm text-muted-foreground">
                  Tente aumentar a frequência dos seus registros diários.
                </p>
              </div>
            </div>
          )}

          {analytics.projects.inProgress > 3 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Target className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-500">Muitos projetos em andamento</p>
                <p className="text-sm text-muted-foreground">
                  Considere focar em concluir alguns projetos antes de começar novos.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}