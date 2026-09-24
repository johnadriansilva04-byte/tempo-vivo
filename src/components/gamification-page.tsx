import { useGamification } from "@/hooks/use-gamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Flame, 
  Star, 
  Award,
  Zap,
  TrendingUp,
  Crown,
  Sparkles
} from "lucide-react";

const RARITY_COLORS = {
  common: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
  rare: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  epic: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
  legendary: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
};

const RARITY_BADGES = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

export function GamificationPage() {
  const gamification = useGamification();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Gamificação</h1>
        <p className="mt-2 text-muted-foreground">
          Conquistas, streaks e o seu progresso
        </p>
      </div>

      {/* Level and XP */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Nível {gamification.level}
              </CardTitle>
              <CardDescription>
                {gamification.xp} / {gamification.xpToNextLevel} XP para o próximo nível
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{gamification.totalXP}</div>
              <div className="text-sm text-muted-foreground">XP Total</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={(gamification.xp / gamification.xpToNextLevel) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Streak Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Streak Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-orange-500">{gamification.streak.currentStreak}</div>
            <p className="text-sm text-muted-foreground mt-2">dias consecutivos</p>
            {gamification.streak.currentStreak > 0 && (
              <div className="mt-4 text-sm">
                <span className="text-muted-foreground">Último registro: </span>
                <span className="font-medium">{gamification.streak.lastLogDate}</span>
              </div>
            )}
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
            <div className="text-5xl font-bold text-yellow-500">{gamification.streak.longestStreak}</div>
            <p className="text-sm text-muted-foreground mt-2">maior streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Conquistas
          </CardTitle>
          <CardDescription>
            {gamification.achievements.filter(a => a.unlocked).length} de {gamification.achievements.length} desbloqueadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gamification.achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked 
                    ? RARITY_COLORS[achievement.rarity] 
                    : 'bg-muted/30 border-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{achievement.icon}</div>
                  {achievement.unlocked && (
                    <Badge variant="secondary" className="text-xs">
                      {RARITY_BADGES[achievement.rarity]}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-sm">{achievement.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                {!achievement.unlocked && (
                  <div className="mt-3">
                    <Progress 
                      value={(achievement.progress / achievement.maxProgress) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.progress} / {achievement.maxProgress}
                    </p>
                  </div>
                )}
                {achievement.unlocked && achievement.unlockedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Badges Especiais
          </CardTitle>
          <CardDescription>
            {gamification.badges.filter(b => b.earned).length} de {gamification.badges.length} conquistados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {gamification.badges.map(badge => (
              <div
                key={badge.id}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  badge.earned 
                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50' 
                    : 'bg-muted/30 border-muted/50 opacity-40 grayscale'
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="text-xs font-medium text-center">{badge.name}</div>
                {badge.earned && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Conquistado
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivation Section */}
      {gamification.streak.currentStreak >= 7 && (
        <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🔥</div>
              <div>
                <h3 className="font-bold text-lg">Você está em chamas!</h3>
                <p className="text-sm text-muted-foreground">
                  Mantenha esse streak para desbloquear conquistas ainda mais épicas!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {gamification.achievements.filter(a => a.unlocked).length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🎯</div>
              <div>
                <h3 className="font-bold text-lg">Comece sua jornada!</h3>
                <p className="text-sm text-muted-foreground">
                  Registre seu primeiro dia para desbloquear sua primeira conquista.
                </p>
                <Button className="mt-3" size="sm">
                  Ir para Agenda
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}