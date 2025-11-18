import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileJson, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function SuccessionImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const importMutation = trpc.succession.importSuccessionData.useMutation();
  const importUIPlans = trpc.succession.importUIPlans.useMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Por favor, selecione um arquivo JSON");
      return;
    }

    setSelectedFile(file);
    setImportResult(null);

    // Ler conteúdo do arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setJsonData(data);
        toast.success("Arquivo carregado com sucesso!");
      } catch (error) {
        toast.error("Erro ao ler arquivo JSON");
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!jsonData) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    try {
      // Detectar formato do JSON
      const isSimplifiedFormat = Array.isArray(jsonData);
      
      const result = isSimplifiedFormat
        ? await importUIPlans.mutateAsync(jsonData)
        : await importMutation.mutateAsync(jsonData);
        
      setImportResult(result);

      if (result.errors.length === 0) {
        toast.success(`${result.success} planos importados com sucesso!`);
      } else {
        toast.warning(
          `${result.success} planos importados, ${result.errors.length} erros encontrados`
        );
      }
    } catch (error: any) {
      toast.error(`Erro ao importar: ${error.message}`);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setJsonData(null);
    setImportResult(null);
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Importação de Dados UISA</h1>
          <p className="text-muted-foreground mt-2">
            Importe planos de sucessão a partir de arquivo JSON
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Arquivo
            </CardTitle>
            <CardDescription>
              Selecione um arquivo JSON com os dados dos planos de sucessão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Input */}
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <FileJson className="w-4 h-4 mr-2" />
                    Selecionar Arquivo JSON
                  </span>
                </Button>
              </label>

              <Button
                variant="secondary"
                onClick={() => {
                  // Dados de exemplo dos 5 planos UISA
                  const exampleData = {
                    plans: [
                      {
                        positionTitle: "Gerente Jurídico",
                        positionCode: "GER-JUR-001",
                        currentHolderName: "João Silva",
                        isCritical: true,
                        riskLevel: "alto" as const,
                        exitRisk: "medio" as const,
                        competencyGap: "Gestão de equipes, Negociação avançada",
                        preparationTime: 12,
                        notes: "Posição estratégica",
                        successors: [
                          {
                            employeeName: "Maria Santos",
                            employeeCode: "EMP-JUR-001",
                            readinessLevel: "1_ano" as const,
                            priority: 1,
                          },
                        ],
                      },
                    ],
                  };
                  setJsonData(exampleData);
                  setSelectedFile(new File([JSON.stringify(exampleData)], "exemplo.json"));
                  toast.success("Dados de exemplo carregados!");
                }}
              >
                Carregar Exemplo
              </Button>

              <Button
                variant="default"
                onClick={async () => {
                  try {
                    const response = await fetch("/uisa-all-succession-plans.json");
                    if (!response.ok) throw new Error("Erro ao carregar arquivo");
                    const data = await response.json();
                    setJsonData(data);
                    setSelectedFile(new File([JSON.stringify(data)], "uisa-5-planos.json"));
                    toast.success("🎯 5 Planos UISA carregados!");
                  } catch (error) {
                    toast.error("Erro ao carregar planos UISA");
                  }
                }}
              >
                🎯 Importar 5 Planos UISA
              </Button>

              {selectedFile && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    Limpar
                  </Button>
                </div>
              )}
            </div>

            {/* Preview */}
            {jsonData && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Preview dos Dados:</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Total de Planos:</strong> {Array.isArray(jsonData) ? jsonData.length : (jsonData.plans?.length || 0)}
                  </p>
                  {((Array.isArray(jsonData) && jsonData.length > 0) || (jsonData.plans && jsonData.plans.length > 0)) && (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(Array.isArray(jsonData) ? jsonData : jsonData.plans).slice(0, 5).map((plan: any, idx: number) => (
                        <li key={idx}>
                          • {plan.positionName || plan.positionTitle} ({plan.successors?.length || 0} sucessores)
                        </li>
                      ))}
                      {(Array.isArray(jsonData) ? jsonData.length : jsonData.plans.length) > 5 && (
                        <li>... e mais {(Array.isArray(jsonData) ? jsonData.length : jsonData.plans.length) - 5} planos</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Import Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!jsonData || importMutation.isPending}
                className="w-full"
              >
                {importMutation.isPending ? (
                  <>Importando...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Dados
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.errors.length === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Importação Concluída
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Importação Concluída com Avisos
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Success Summary */}
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">
                    {importResult.success} planos importados com sucesso
                  </span>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold">
                    <XCircle className="w-5 h-5" />
                    <span>{importResult.errors.length} erros encontrados:</span>
                  </div>
                  <ul className="space-y-1 text-sm text-red-600 dark:text-red-400 ml-7">
                    {importResult.errors.map((error: string, idx: number) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClear} className="flex-1">
                  Importar Outro Arquivo
                </Button>
                <Button
                  variant="default"
                  onClick={() => (window.location.href = "/sucessao")}
                  className="flex-1"
                >
                  Ver Planos de Sucessão
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Formato do Arquivo JSON</CardTitle>
            <CardDescription>Estrutura esperada para importação</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "plans": [
    {
      "positionTitle": "Gerente Jurídico",
      "positionCode": "GER-JUR-001",
      "currentHolderName": "João Silva",
      "isCritical": true,
      "riskLevel": "alto",
      "exitRisk": "medio",
      "competencyGap": "Gestão de equipes, Negociação",
      "preparationTime": 12,
      "notes": "Posição estratégica",
      "successors": [
        {
          "employeeName": "Maria Santos",
          "employeeCode": "EMP-001",
          "readinessLevel": "1_ano",
          "priority": 1
        }
      ]
    }
  ]
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
