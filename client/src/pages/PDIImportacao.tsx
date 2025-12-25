import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Página de Importação de PDI HTML
 * Permite upload e teste de arquivo HTML de PDI
 */
export default function PDIImportacao() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [cycleId, setCycleId] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const importMutation = trpc.pdi.importFromHtml.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      toast.success("PDI importado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao importar PDI: ${error.message}`);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      toast.error("Por favor, selecione um arquivo HTML");
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const text = await file.text();
      setHtmlContent(text);
      toast.success("Arquivo carregado com sucesso");
    } catch (error) {
      toast.error("Erro ao ler arquivo");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = () => {
    if (!htmlContent) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    importMutation.mutate({
      htmlContent,
      cycleId,
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Importação de PDI</h1>
          <p className="text-muted-foreground mt-2">
            Importe Planos de Desenvolvimento Individual a partir de arquivos HTML
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card de Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Arquivo
              </CardTitle>
              <CardDescription>
                Selecione um arquivo HTML de PDI para importar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Arquivo HTML</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileSelect}
                  disabled={isUploading || importMutation.isPending}
                />
              </div>

              {selectedFile && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Arquivo selecionado:</strong> {selectedFile.name}
                    <br />
                    <strong>Tamanho:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="cycle-id">Ciclo de Avaliação (ID)</Label>
                <Input
                  id="cycle-id"
                  type="number"
                  value={cycleId}
                  onChange={(e) => setCycleId(parseInt(e.target.value) || 1)}
                  disabled={importMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  ID do ciclo de avaliação ao qual o PDI será vinculado
                </p>
              </div>

              <Button
                onClick={handleImport}
                disabled={!htmlContent || importMutation.isPending}
                className="w-full"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar PDI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Card de Resultado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
                Resultado da Importação
              </CardTitle>
              <CardDescription>
                Informações sobre o PDI importado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!importResult ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum PDI importado ainda</p>
                  <p className="text-sm mt-2">
                    Selecione um arquivo HTML e clique em "Importar PDI"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      PDI importado com sucesso!
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">ID do PDI:</span>
                      <Badge variant="secondary">{importResult.planId}</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Colaborador:</span>
                      <span className="text-sm">{importResult.employeeName || 'N/A'}</span>
                    </div>

                    {importResult.parsedData && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Ações Importadas:</span>
                          <Badge>{importResult.actionsCount || 0}</Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Gaps de Competência:</span>
                          <Badge>{importResult.competencyGapsCount || 0}</Badge>
                        </div>

                        {importResult.parsedData.targetPosition && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Cargo Alvo:</span>
                            <span className="text-sm">{importResult.parsedData.targetPosition}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button
                      onClick={() => setLocation(`/pdi/${importResult.planId}`)}
                      className="flex-1"
                    >
                      Ver PDI Completo
                    </Button>
                    <Button
                      onClick={() => {
                        setImportResult(null);
                        setSelectedFile(null);
                        setHtmlContent("");
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Importar Outro
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card de Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona a Importação</CardTitle>
            <CardDescription>
              Passo a passo para importar PDIs de arquivos HTML
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="font-semibold">Selecione o Arquivo</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Escolha um arquivo HTML de PDI do seu computador
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="font-semibold">Configure o Ciclo</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Informe o ID do ciclo de avaliação correspondente
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="font-semibold">Importe e Revise</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Clique em "Importar PDI" e revise os dados importados
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> O sistema irá extrair automaticamente:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Dados pessoais do colaborador</li>
                  <li>Competências e gaps identificados</li>
                  <li>Ações de desenvolvimento (modelo 70-20-10)</li>
                  <li>KPIs e metas de remuneração</li>
                  <li>Sponsors e mentores</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
