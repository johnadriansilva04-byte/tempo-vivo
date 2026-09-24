import { useExport } from "@/hooks/use-export";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileJson, 
  FileText, 
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

export function ExportPage() {
  const { exportToJSON, exportToPDF, exportToCSV, hasData } = useExport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Exportar Dados</h1>
        <p className="mt-2 text-muted-foreground">
          Exporte seu Perfil Vivo em diferentes formatos
        </p>
      </div>

      {!hasData && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="font-semibold">Sem dados para exportar</h3>
                <p className="text-sm text-muted-foreground">
                  Comece registrando dados na Agenda para poder exportar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-blue-500" />
              JSON
            </CardTitle>
            <CardDescription>
              Exportação completa em formato JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Todos os dados do perfil</p>
                <p>• Registro diário completo</p>
                <p>• Capítulos de carreira</p>
                <p>• Marcos e projetos</p>
                <p>• Foco semanal</p>
              </div>
              <Button 
                onClick={exportToJSON} 
                className="w-full"
                disabled={!hasData}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              PDF
            </CardTitle>
            <CardDescription>
              Relatório formatado para impressão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Layout profissional</p>
                <p>• Formato A4</p>
                <p>• Ideal para impressão</p>
                <p>• Inclui todos os dados</p>
                <p>• Pronto para compartilhar</p>
              </div>
              <Button 
                onClick={exportToPDF} 
                className="w-full"
                disabled={!hasData}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
              CSV
            </CardTitle>
            <CardDescription>
              Agenda em formato de planilha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Apenas registro diário</p>
                <p>• Compatível com Excel</p>
                <p>• Fácil análise de dados</p>
                <p>• Leve e rápido</p>
                <p>• Ideal para backups</p>
              </div>
              <Button 
                onClick={exportToCSV} 
                className="w-full"
                disabled={!hasData}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Exportação</CardTitle>
          <CardDescription>
            Saiba mais sobre os formatos disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">📋 JSON (Recomendado)</h3>
            <p className="text-sm text-muted-foreground">
              Formato completo que preserva todos os dados e metadados. Ideal para backups 
              e importação futura. Pode ser aberto em qualquer editor de texto.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📄 PDF (Para Compartilhar)</h3>
            <p className="text-sm text-muted-foreground">
              Formato visual pronto para impressão e compartilhamento. Perfeito para 
              mostrar seu progresso para outros ou criar arquivos físicos.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📊 CSV (Para Análise)</h3>
            <p className="text-sm text-muted-foreground">
              Formato de planilha contendo apenas o registro diário. Ideal para análise 
              de dados no Excel, Google Sheets ou outras ferramentas.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="font-semibold">Dica de Produtividade</h3>
              <p className="text-sm text-muted-foreground">
                Exporte seus dados regularmente para manter backups seguros. 
                O formato JSON é recomendado para restaurações completas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}