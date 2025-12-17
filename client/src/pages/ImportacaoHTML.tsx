import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import { FileUp, CheckCircle2, XCircle, AlertCircle, Download, Upload } from "lucide-react";

type ImportType = "employees" | "evaluations" | "goals";

export default function ImportacaoHTML() {
  const [htmlContent, setHtmlContent] = useState("");
  const [importType, setImportType] = useState<ImportType>("employees");
  const [previewData, setPreviewData] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const previewMutation = trpc.htmlImport.previewHTML.useMutation();
  const importEmployeesMutation = trpc.htmlImport.importEmployees.useMutation();
  const importEvaluationsMutation = trpc.htmlImport.importEvaluations.useMutation();
  const importGoalsMutation = trpc.htmlImport.importGoals.useMutation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlContent(content);
      toast.success("Arquivo carregado com sucesso!");
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!htmlContent.trim()) {
      toast.error("Por favor, insira ou carregue um arquivo HTML");
      return;
    }

    try {
      const result = await previewMutation.mutateAsync({
        html: htmlContent,
        type: importType,
      });

      setPreviewData(result);
      
      if (result.success) {
        toast.success(`Preview gerado: ${result.validRows} linhas válidas de ${result.totalRows}`);
      } else {
        toast.error(result.error || "Erro ao processar HTML");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar preview");
    }
  };

  const handleImport = async () => {
    if (!previewData || !previewData.validData || previewData.validData.length === 0) {
      toast.error("Nenhum dado válido para importar");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      let result;

      if (importType === "employees") {
        result = await importEmployeesMutation.mutateAsync({
          data: previewData.validData,
        });
      } else if (importType === "evaluations") {
        result = await importEvaluationsMutation.mutateAsync({
          data: previewData.validData,
        });
      } else if (importType === "goals") {
        result = await importGoalsMutation.mutateAsync({
          data: previewData.validData,
        });
      }

      setImportResult(result);

      if (result && result.success > 0) {
        toast.success(`Importação concluída: ${result.success} registros importados`);
      }

      if (result && result.failed > 0) {
        toast.warning(`${result.failed} registros falharam`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar dados");
    } finally {
      setIsImporting(false);
    }
  };

  const getTypeLabel = (type: ImportType) => {
    const labels = {
      employees: "Funcionários",
      evaluations: "Avaliações",
      goals: "Metas",
    };
    return labels[type];
  };

  const getExampleHTML = (type: ImportType) => {
    const examples = {
      employees: `<table>
  <tr>
    <th>Chapa</th>
    <th>Nome</th>
    <th>Email</th>
    <th>Status</th>
  </tr>
  <tr>
    <td>12345</td>
    <td>João Silva</td>
    <td>joao@empresa.com</td>
    <td>ativo</td>
  </tr>
</table>`,
      evaluations: `<table>
  <tr>
    <th>Chapa</th>
    <th>Ciclo ID</th>
    <th>Nota</th>
    <th>Comentários</th>
  </tr>
  <tr>
    <td>12345</td>
    <td>1</td>
    <td>4.5</td>
    <td>Excelente desempenho</td>
  </tr>
</table>`,
      goals: `<table>
  <tr>
    <th>Chapa</th>
    <th>Título</th>
    <th>Descrição</th>
    <th>Status</th>
  </tr>
  <tr>
    <td>12345</td>
    <td>Aumentar vendas</td>
    <td>Aumentar vendas em 20%</td>
    <td>em_andamento</td>
  </tr>
</table>`,
    };
    return examples[type];
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importação de Dados via HTML</h1>
        <p className="text-muted-foreground mt-2">
          Importe dados de funcionários, avaliações ou metas a partir de tabelas HTML
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuração */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Configuração
            </CardTitle>
            <CardDescription>
              Configure o tipo de importação e carregue o arquivo HTML
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Importação</Label>
              <Select value={importType} onValueChange={(value) => setImportType(value as ImportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employees">Funcionários</SelectItem>
                  <SelectItem value="evaluations">Avaliações</SelectItem>
                  <SelectItem value="goals">Metas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Carregar Arquivo HTML</Label>
              <input
                type="file"
                accept=".html,.htm"
                onChange={handleFileUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>

            <div className="space-y-2">
              <Label>Ou Cole o HTML Aqui</Label>
              <Textarea
                placeholder="Cole o código HTML da tabela aqui..."
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            </div>

            <Button onClick={handlePreview} disabled={!htmlContent.trim() || previewMutation.isPending} className="w-full">
              {previewMutation.isPending ? "Processando..." : "Gerar Preview"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview e Resultados */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Preview e Importação
            </CardTitle>
            <CardDescription>
              Visualize os dados antes de importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!previewData && !importResult && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formato esperado para {getTypeLabel(importType)}:</strong>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    {getExampleHTML(importType)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}

            {previewData && previewData.success && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-base">
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                    {previewData.validRows} válidos
                  </Badge>
                  <Badge variant="outline" className="text-base">
                    <XCircle className="h-4 w-4 mr-1 text-red-600" />
                    {previewData.invalidRows} inválidos
                  </Badge>
                  <Badge variant="outline" className="text-base">
                    Total: {previewData.totalRows}
                  </Badge>
                </div>

                {previewData.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Erros encontrados:</strong>
                      <ul className="mt-2 list-disc list-inside text-sm">
                        {previewData.errors.slice(0, 5).map((error: any, index: number) => (
                          <li key={index}>
                            Linha {error.row}: {error.error}
                          </li>
                        ))}
                        {previewData.errors.length > 5 && (
                          <li>... e mais {previewData.errors.length - 5} erros</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {previewData.data.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(previewData.data[0]).map((key) => (
                              <TableHead key={key}>{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.data.slice(0, 10).map((row: any, index: number) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value: any, cellIndex: number) => (
                                <TableCell key={cellIndex}>{value?.toString() || "-"}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {previewData.data.length > 10 && (
                      <div className="p-2 bg-muted text-center text-sm text-muted-foreground">
                        Mostrando 10 de {previewData.data.length} registros
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={isImporting || previewData.validRows === 0}
                  className="w-full"
                  size="lg"
                >
                  {isImporting ? "Importando..." : `Importar ${previewData.validRows} Registros`}
                </Button>
              </div>
            )}

            {importResult && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>Importação Concluída!</strong>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Sucesso:</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {importResult.success}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Falhas:</span>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        {importResult.failed}
                      </Badge>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <strong className="text-red-600">Erros:</strong>
                      <ul className="mt-1 list-disc list-inside text-sm">
                        {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                          <li key={index}>
                            {error.chapa || error.employeeChapa}: {error.error}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>... e mais {importResult.errors.length - 5} erros</li>
                        )}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação</CardTitle>
          <CardDescription>Formatos aceitos e campos disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Funcionários</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Campos aceitos: Chapa (obrigatório), Nome (obrigatório), Email, Cargo ID, Departamento ID, Data Admissão, Salário, Status
              </p>
              <p className="text-sm text-muted-foreground">
                Status possíveis: ativo, inativo, ferias, afastado
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Avaliações</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Campos aceitos: Chapa (obrigatório), Ciclo ID (obrigatório), Nota (obrigatório, 1-5), Comentários, Avaliador
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Metas</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Campos aceitos: Chapa (obrigatório), Título (obrigatório), Descrição, Meta, Valor Atual, Prazo, Status
              </p>
              <p className="text-sm text-muted-foreground">
                Status possíveis: nao_iniciada, em_andamento, concluida, cancelada
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
