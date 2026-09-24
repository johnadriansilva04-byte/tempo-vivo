import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { useFeatureFlag } from "@/lib/feature-flags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Link2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X
} from "lucide-react";

export function GoogleCalendarIntegration() {
  const calendarEnabled = useFeatureFlag("google_calendar_integration");
  const {
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    disconnect,
  } = useGoogleCalendar();

  if (!calendarEnabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Integração Google Calendar
        </CardTitle>
        <CardDescription>
          Sincronize suas tarefas diárias com o Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isAuthenticated ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Link2 className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-500">Conecte seu Google Calendar</p>
                <p className="text-sm text-muted-foreground">
                  Sincronize automaticamente suas tarefas planejadas com eventos no seu calendário.
                </p>
              </div>
            </div>

            <Button 
              onClick={authenticate} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Conectar Google Calendar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-500">Conectado com sucesso!</p>
                <p className="text-sm text-muted-foreground">
                  Suas tarefas serão sincronizadas automaticamente com o Google Calendar.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Tarefas planejadas viram eventos de dia inteiro</p>
              <p>• Sincronização automática ao salvar</p>
              <p>• Títulos baseados nas tarefas</p>
              <p>• Descrições com contexto do Perfil Vivo</p>
            </div>

            <Button 
              onClick={disconnect} 
              variant="outline"
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}