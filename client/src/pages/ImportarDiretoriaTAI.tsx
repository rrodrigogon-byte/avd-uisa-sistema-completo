import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  FileSpreadsheet,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

export default function ImportarDiretoriaTAI() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Verificar status da importação
  const statusQuery = trpc.importTai.checkImportStatus.useQuery(undefined, {
    refetchInterval: false,
  });

  // Mutation para importar
  const importMutation = trpc.importTai.importDiretoriaTai.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setImporting(false);
      
      if (data.errors === 0) {
        toast.success("Importação concluída com sucesso!");
      } else {
        toast.warning(`Importação concluída com ${data.errors} erros`);
      }
      
      // Refetch status
      statusQuery.refetch();
    },
    onError: (error) => {
      setImporting(false);
      toast.error(`Erro na importação: ${error.message}`);
    },
  });

  const handleImport = (dryRun: boolean = false) => {
    setImporting(true);
    setResult(null);
    importMutation.mutate({ dryRun });
  };

  const progress = statusQuery.data
    ? (statusQuery.data.existing / statusQuery.data.total) * 100
    : 0;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Importar Diretoria TAI</h1>
        <p className="text-muted-foreground">
          Importação de dados dos funcionários da Diretoria de Gente, Inovação e Administração
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Status da Importação
          </CardTitle>
          <CardDescription>
            Verificação dos dados no banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando status...
            </div>
          ) : statusQuery.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{statusQuery.data.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {statusQuery.data.existing}
                  </div>
                  <div className="text-sm text-muted-foreground">Já Importados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {statusQuery.data.missing}
                  </div>
                  <div className="text-sm text-muted-foreground">Faltando</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {statusQuery.data.needsImport ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Importação Necessária</AlertTitle>
                  <AlertDescription>
                    Existem {statusQuery.data.missing} funcionários que ainda não foram importados.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-400">
                    Importação Completa
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-500">
                    Todos os funcionários da Diretoria TAI já foram importados.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ações de Importação
          </CardTitle>
          <CardDescription>
            Execute a importação dos dados ou simule para verificar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => handleImport(true)}
              disabled={importing}
              variant="outline"
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Simular Importação
                </>
              )}
            </Button>

            <Button
              onClick={() => handleImport(false)}
              disabled={importing || !statusQuery.data?.needsImport}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Executar Importação
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>Simular:</strong> Verifica quantos registros seriam criados/atualizados sem salvar no banco.
            <br />
            <strong>Executar:</strong> Realiza a importação completa dos dados no banco de dados.
          </p>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              Resultado da {result.dryRun ? "Simulação" : "Importação"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.dryRun && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Modo Simulação</AlertTitle>
                <AlertDescription>
                  Nenhum dado foi salvo no banco. Estes são os resultados esperados.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-4 border rounded-lg border-green-200 bg-green-50 dark:bg-green-950/20">
                <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                <div className="text-sm text-muted-foreground">Novos</div>
              </div>
              <div className="text-center p-4 border rounded-lg border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                <div className="text-sm text-muted-foreground">Atualizados</div>
              </div>
              <div className="text-center p-4 border rounded-lg border-red-200 bg-red-50 dark:bg-red-950/20">
                <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </div>

            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Erros Encontrados:</h3>
                <div className="space-y-1">
                  {result.errorDetails.map((err: any, idx: number) => (
                    <Alert key={idx} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>{err.name}</AlertTitle>
                      <AlertDescription className="text-xs">{err.error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {result.errors === 0 && !result.dryRun && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-400">
                  Importação Concluída com Sucesso!
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-500">
                  Todos os {result.total} funcionários foram processados sem erros.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
