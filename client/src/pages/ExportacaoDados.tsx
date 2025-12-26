import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, FileSpreadsheet, FileText, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

type ExportType = "funcionarios" | "avaliacoes" | "competencias" | "desempenho" | "pdi" | "todos";
type ExportFormat = "csv" | "excel" | "json";

export default function ExportacaoDados() {
  const { user } = useAuth();
  const [exportType, setExportType] = useState<ExportType>("funcionarios");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  // Buscar departamentos para filtro
  const { data: departments } = trpc.departments.list.useQuery({});

  // Mutations para exportação
  const exportEmployeesMutation = trpc.export.exportEmployeesCSV.useMutation();
  const exportEvaluationsMutation = trpc.export.exportEvaluationsCSV.useMutation();
  const generatePerformancePDFMutation = trpc.export.generatePerformancePDF.useMutation();
  const generateCompetenciesPDFMutation = trpc.export.generateCompetenciesPDF.useMutation();
  const generatePDIPDFMutation = trpc.export.generatePDIPDF.useMutation();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let result: any;
      
      // Escolher o procedimento correto baseado no tipo e formato
      if (exportFormat === "csv") {
        if (exportType === "funcionarios") {
          result = await exportEmployeesMutation.mutateAsync({
            departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
            status: selectedStatus !== "all" ? selectedStatus : undefined,
          });
          
          // Download do CSV
          const blob = new Blob([result.csv], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename;
          a.click();
        } else if (exportType === "avaliacoes") {
          result = await exportEvaluationsMutation.mutateAsync({});
          
          const blob = new Blob([result.csv], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename;
          a.click();
        }
      } else {
        // Geração de PDF
        if (exportType === "desempenho") {
          result = await generatePerformancePDFMutation.mutateAsync({
            employeeId: 1, // Exemplo - você precisaria selecionar o funcionário
          });
        } else if (exportType === "competencias") {
          result = await generateCompetenciesPDFMutation.mutateAsync({
            employeeId: 1,
          });
        } else if (exportType === "pdi") {
          result = await generatePDIPDFMutation.mutateAsync({
            employeeId: 1,
          });
        }
        
        if (result?.pdf) {
          // Download do PDF
          const byteCharacters = atob(result.pdf);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename;
          a.click();
        }
      }
      
      toast.success(`Exportação de ${exportType} concluída com sucesso!`);
      
    } catch (error) {
      toast.error(`Erro ao exportar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (user?.role !== "admin" && user?.role !== "rh") {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores e RH podem acessar esta página.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Download className="h-8 w-8" />
            Exportação de Dados
          </h1>
          <p className="text-muted-foreground mt-2">
            Exporte dados do sistema em diferentes formatos para análise externa
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card de Configuração de Exportação */}
          <Card>
            <CardHeader>
              <CardTitle>Configurar Exportação</CardTitle>
              <CardDescription>
                Selecione o tipo de dados e formato desejado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Exportação */}
              <div className="space-y-2">
                <Label htmlFor="export-type">Tipo de Dados</Label>
                <Select value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
                  <SelectTrigger id="export-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionarios">Funcionários</SelectItem>
                    <SelectItem value="avaliacoes">Avaliações de Desempenho</SelectItem>
                    <SelectItem value="competencias">Competências</SelectItem>
                    <SelectItem value="desempenho">Relatórios de Desempenho</SelectItem>
                    <SelectItem value="pdi">Planos de Desenvolvimento (PDI)</SelectItem>
                    <SelectItem value="todos">Todos os Dados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formato de Exportação */}
              <div className="space-y-2">
                <Label htmlFor="export-format">Formato</Label>
                <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                  <SelectTrigger id="export-format">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CSV (Excel compatível)
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel (.xlsx)
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        JSON
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros Adicionais */}
              {exportType === "funcionarios" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="department-filter">Departamento</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger id="department-filter">
                        <SelectValue placeholder="Todos os departamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os departamentos</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="ativo">Ativos</SelectItem>
                        <SelectItem value="afastado">Afastados</SelectItem>
                        <SelectItem value="desligado">Desligados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Dados
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Card de Informações */}
          <Card>
            <CardHeader>
              <CardTitle>Sobre a Exportação</CardTitle>
              <CardDescription>
                Informações importantes sobre o processo de exportação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Formatos Disponíveis</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>CSV:</strong> Compatível com Excel e Google Sheets</li>
                    <li><strong>Excel:</strong> Formato nativo do Microsoft Excel</li>
                    <li><strong>JSON:</strong> Para integração com outros sistemas</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Tipos de Dados</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Funcionários:</strong> Dados cadastrais e hierarquia</li>
                    <li><strong>Avaliações:</strong> Histórico de avaliações de desempenho</li>
                    <li><strong>Competências:</strong> Avaliações de competências</li>
                    <li><strong>Desempenho:</strong> Relatórios consolidados</li>
                    <li><strong>PDI:</strong> Planos de desenvolvimento individual</li>
                  </ul>
                </div>

                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    💡 Os arquivos exportados incluem data e hora de geração para controle de versão.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Histórico de Exportações (Futuro) */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Exportações</CardTitle>
            <CardDescription>
              Últimas exportações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma exportação realizada ainda</p>
              <p className="text-xs mt-1">O histórico aparecerá aqui após a primeira exportação</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
