import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  User,
  Phone,
  Calendar,
  Target,
  Brain,
  Award,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

export function WelcomePage() {
  const [showAbout, setShowAbout] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full space-y-6">
        {/* Hero Compact */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <Sparkles className="h-3 w-3 text-purple-500" />
            <span className="text-xs font-medium text-purple-500">
              Perfil Vivo
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Sua Vida, Sua História
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Transforme cada dia em uma página da sua trajetória. Registre,
            analise e evolua com inteligência local.
          </p>
        </div>

        {/* CTA Principal */}
        <div className="grid gap-3 md:grid-cols-2">
          <Link to="/sobre" className="block">
            <Button variant="outline" size="lg" className="w-full">
              <User className="mr-2 h-5 w-5" />
              Criar Perfil
            </Button>
          </Link>
          <Link to="/agenda" className="block">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Criar Registro
            </Button>
          </Link>
        </div>

        {/* Expansíveis */}
        <div className="space-y-2">
          <Collapsible open={showAbout} onOpenChange={setShowAbout}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span className="text-sm font-medium">
                  O que é Perfil Vivo?
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm leading-6">
                    <strong className="text-purple-500">Perfil Vivo</strong> é
                    um companion pessoal que transforma sua vida diária em uma
                    trajetória significativa. Cada dia é uma página da sua
                    história, registrada, analisada e evoluída com inteligência
                    local.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>100% self-hosted</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Zero custo</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Máxima privacidade</span>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={showFeatures} onOpenChange={setShowFeatures}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span className="text-sm font-medium">Features</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent className="pt-4 grid gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Brain className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Inteligência Local</p>
                      <p className="text-xs text-muted-foreground">
                        Sentimento, predição e recomendações
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Award className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Gamificação</p>
                      <p className="text-xs text-muted-foreground">
                        Streaks, conquistas e XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Shield className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">100% Privado</p>
                      <p className="text-xs text-muted-foreground">
                        Dados nunca saem do seu dispositivo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Zap className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Offline-First</p>
                      <p className="text-xs text-muted-foreground">
                        Funciona sem internet
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-6 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">26</div>
            <p className="text-xs text-muted-foreground">Features</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">100%</div>
            <p className="text-xs text-muted-foreground">Local</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">R$0</div>
            <p className="text-xs text-muted-foreground">Custo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
