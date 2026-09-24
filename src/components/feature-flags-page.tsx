import { getFeatureFlags, isFeatureEnabled } from "@/lib/feature-flags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle2, 
  XCircle, 
  Settings,
  Sparkles,
  Shield
} from "lucide-react";

export function FeatureFlagsPage() {
  const flags = getFeatureFlags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Feature Flags</h1>
        <p className="mt-2 text-muted-foreground">
          Gerencie recursos experimentais e funcionalidades do sistema
        </p>
      </div>

      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>
            <div>
              <h3 className="font-semibold">Sistema de Feature Flags</h3>
              <p className="text-sm text-muted-foreground">
                Controle quais funcionalidades estão ativas no seu Perfil Vivo.
                Algumas features podem estar em rollout gradual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {flag.enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                    {flag.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {flag.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={flag.enabled ? "default" : "secondary"}>
                    {flag.enabled ? "Ativo" : "Inativo"}
                  </Badge>
                  {flag.rolloutPercentage && (
                    <Badge variant="outline" className="text-xs">
                      {flag.rolloutPercentage}% rollout
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  <span>Status do sistema</span>
                </div>
                <Switch
                  checked={flag.enabled}
                  disabled={true} // In a real app, this would be editable
                  aria-label={`Toggle ${flag.name}`}
                />
              </div>
              {flag.rolloutPercentage && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Rollout gradual</span>
                    <span>{flag.rolloutPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${flag.rolloutPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações sobre Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">🎯 Controle de Funcionalidades</h3>
            <p className="text-sm text-muted-foreground">
              Feature flags permitem ativar/desativar funcionalidades sem precisar fazer deploy.
              Isso é útil para testes A/B, lançamentos graduais e rollback rápido.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📊 Rollout Gradual</h3>
            <p className="text-sm text-muted-foreground">
              Algumas features são lançadas gradualmente para um percentual de usuários,
              permitindo testar estabilidade antes do lançamento completo.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🔒 Segurança</h3>
            <p className="text-sm text-muted-foreground">
              As configurações de feature flags são determinísticas baseadas no seu usuário,
              garantindo uma experiência consistente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">✨</div>
            <div>
              <h3 className="font-semibold">Features Ativas</h3>
              <p className="text-sm text-muted-foreground">
                {flags.filter(f => f.enabled).length} de {flags.length} funcionalidades estão ativas no momento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}