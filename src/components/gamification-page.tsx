import { Link } from "@tanstack/react-router";
import { useGamification } from "@/hooks/use-gamification";
import type { Achievement } from "@/hooks/use-gamification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Award, Crown, Sparkles } from "lucide-react";

const ICON_EMOJI: Record<Achievement["icon"], string> = {
  flame: "🔥",
  trophy: "🏆",
  target: "🎯",
  book: "📖",
  star: "⭐",
  lock: "🔒",
};

export function GamificationPage() {
  const gamification = useGamification();
  const unlocked = gamification.achievements.filter((a) => a.unlocked);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Gamificação</h1>
        <p className="mt-2 text-muted-foreground">
          Conquistas, sequências e o seu progresso
        </p>
      </div>

      {/* Nível e XP */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Nível {gamification.level} · {gamification.levelTitle}
              </CardTitle>
              <CardDescription>
                {gamification.xpIntoLevel} / {gamification.xpForNextLevel} XP
                para o próximo nível
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {gamification.totalXp}
              </div>
              <div className="text-sm text-muted-foreground">XP Total</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={gamification.levelProgressPct} className="h-3" />
        </CardContent>
      </Card>

      {/* Sequências */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Sequência Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-orange-500">
              {gamification.streak}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {gamification.streak === 1
                ? "dia consecutivo"
                : "dias consecutivos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Recorde Pessoal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-yellow-500">
              {gamification.bestStreak}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              maior sequência
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conquistas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Conquistas
          </CardTitle>
          <CardDescription>
            {unlocked.length} de {gamification.achievements.length}{" "}
            desbloqueadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gamification.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? "bg-primary/10 border-primary/40"
                    : "bg-muted/30 border-muted/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{ICON_EMOJI[achievement.icon]}</div>
                  {achievement.unlocked && (
                    <Badge variant="secondary" className="text-xs">
                      Desbloqueada
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-sm">{achievement.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivação */}
      {gamification.streak >= 7 && (
        <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🔥</div>
              <div>
                <h3 className="font-bold text-lg">Você está em chamas!</h3>
                <p className="text-sm text-muted-foreground">
                  Mantenha essa sequência para desbloquear conquistas ainda mais
                  épicas!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {unlocked.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🎯</div>
              <div>
                <h3 className="font-bold text-lg">Comece sua jornada!</h3>
                <p className="text-sm text-muted-foreground">
                  Registre seu primeiro dia para desbloquear sua primeira
                  conquista.
                </p>
                <Button className="mt-3" size="sm" asChild>
                  <Link to="/agenda">Ir para Agenda</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
