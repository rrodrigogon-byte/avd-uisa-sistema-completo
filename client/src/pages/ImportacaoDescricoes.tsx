import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function ImportacaoDescricoes() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const importMutation = trpc.import.importBulk.useMutation({
    onSuccess: (data: any) => {
      setResults(data);
      setImporting(false);
      toast.success(`Importação concluída! ${data.success} descrições importadas.`);
    },
    onError: (error: any) => {
      setImporting(false);
      toast.error("Erro na importação: " + error.message);
    },
  });

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setResults(null);

    // Simular progresso
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      await importMutation.mutateAsync({});
      setProgress(100);
      clearInterval(interval);
    } catch (err) {
      clearInterval(interval);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Importação em Massa de Descrições de Cargo</h1>
          <p className="text-muted-foreground">
            Importe automaticamente todas as descrições de cargo dos arquivos .docx
          </p>
        </div>

        {/* Status da Importação */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Status da Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!importing && !results && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Pronto para importar 100+ descrições de cargo
                </p>
                <Button onClick={handleImport} size="lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Iniciar Importação
                </Button>
              </div>
            )}

            {importing && (
              <div className="py-8">
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <p className="text-center text-muted-foreground mb-4">
                  Importando descrições de cargo...
                </p>
                <Progress value={progress} className="h-3" />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {progress}% concluído
                </p>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{results.success}</div>
                    <div className="text-sm text-muted-foreground">Sucesso</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                    <div className="text-sm text-muted-foreground">Falhas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                {results.errors && results.errors.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Erros Encontrados
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {results.errors.map((error: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-md text-sm">
                          <strong>{error.file}:</strong> {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button onClick={() => setResults(null)} variant="outline">
                    Limpar Resultados
                  </Button>
                  <Button onClick={handleImport}>
                    Importar Novamente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>1. Extração Automática:</strong> O sistema lê todos os arquivos .docx de descrições de cargo
                e extrai automaticamente as seções: Objetivo Principal, Responsabilidades, Conhecimentos Técnicos,
                Treinamentos, Competências, Qualificação e e-Social.
              </p>
              <p>
                <strong>2. Validação:</strong> Cada descrição é validada antes de ser inserida no banco de dados.
                Campos obrigatórios são verificados e dados inconsistentes são reportados.
              </p>
              <p>
                <strong>3. População do Banco:</strong> Descrições válidas são inseridas no banco com todas as
                relações (responsabilidades, conhecimentos, competências) já vinculadas.
              </p>
              <p>
                <strong>4. Relatório:</strong> Ao final, você recebe um relatório completo com sucessos, falhas
                e detalhes de cada erro encontrado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
