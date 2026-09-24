import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Target, 
  Award, 
  Brain,
  CheckCircle2,
  Zap,
  BookOpen,
  Rocket
} from "lucide-react";

export function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-500">Bem-vindo ao Perfil Vivo</span>
          </div>
          <h1 className="font-display text-5xl font-bold">
            Sua jornada começa aqui
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transforme sua vida diária em uma trajetória significativa. 
            Registre, analise e evolua com inteligência local.
          </p>
        </div>

        {/* Quick Start Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/agenda">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Começar Agora</CardTitle>
                    <CardDescription>Registre seu primeiro dia</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Rocket className="mr-2 h-4 w-4" />
                  Criar Registro
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/projetos">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Target className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Criar Projeto</CardTitle>
                    <CardDescription>Defina seus objetivos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Target className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/planejamento">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Zap className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Planejar Semana</CardTitle>
                    <CardDescription>Metas e foco semanal</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Zap className="mr-2 h-4 w-4" />
                  Planejar
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Features Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Inteligência Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Análise de Sentimento</p>
                  <p className="text-xs text-muted-foreground">Entenda suas emoções diárias</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Predição de Produtividade</p>
                  <p className="text-xs text-muted-foreground">Preveja seus melhores dias</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Recomendações da IA</p>
                  <p className="text-xs text-muted-foreground">Sugestões personalizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Gamificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Sistema de Streaks</p>
                  <p className="text-xs text-muted-foreground">Mantenha a consistência</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Conquistas e Badges</p>
                  <p className="text-xs text-muted-foreground">Celebre seu progresso</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">XP e Níveis</p>
                  <p className="text-xs text-muted-foreground">Evolua continuamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🚀 Como Começar em 3 Passos</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Vá para a Agenda</p>
                    <p className="text-sm text-muted-foreground">Registre suas intenções para hoje</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Ao final do dia, atualize</p>
                    <p className="text-sm text-muted-foreground">Registre o que executou e faça um resumo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Acompanhe sua evolução</p>
                    <p className="text-sm text-muted-foreground">Veja analytics, sentiment e recomendações</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Link to="/agenda">
                  <Button size="lg">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Começar Jornada
                  </Button>
                </Link>
                <Link to="/intelligence-dashboard">
                  <Button size="lg" variant="outline">
                    <Brain className="mr-2 h-4 w-4" />
                    Ver Inteligência
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-3xl">100%</div>
                <p className="text-sm text-muted-foreground">Self-Hosted</p>
                <p className="text-xs text-faint">Zero custo, máxima privacidade</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-3xl">26</div>
                <p className="text-sm text-muted-foreground">Features</p>
                <p className="text-xs text-faint">Sistemas locais completos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-3xl">∞</div>
                <p className="text-sm text-muted-foreground">Offline-First</p>
                <p className="text-xs text-faint">Funciona sem internet</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}