import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, FileSpreadsheet, FileJson, Info, CheckCircle2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function ExportarOrganograma() {
  const [format, setFormat] = useState<"json" | "csv">("csv");
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: departments } = trpc.departments.list.useQuery();

  const exportMutation = trpc.orgChart.exportHierarchy.useQuery(
    {
      format,
      departmentId,
      includeInactive,
    },
    {
      enabled: false, // Não executar automaticamente
    }
  );

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await exportMutation.refetch();

      if (!result.data) {
        throw new Error("Nenhum dado retornado");
      }

      const data = result.data;

      if (format === "csv") {
        // Download CSV
        const blob = new Blob([data.data as string], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", data.filename || "organograma.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Arquivo CSV exportado com sucesso!");
      } else {
        // Download JSON
        const jsonString = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `organograma_${new Date().toISOString().split("T")[0]}.json`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Arquivo JSON exportado com sucesso!");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao exportar dados"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Exportar Organograma</h1>
          <p className="text-muted-foreground mt-2">
            Exporte a estrutura hierárquica completa em diferentes formatos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configurações de Exportação */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Selecione o formato e os filtros para exportação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Formato de Exportação</Label>
                <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (Excel)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                      <FileJson className="h-4 w-4" />
                      JSON
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="department">Departamento</Label>
                <Select
                  value={departmentId?.toString() || "all"}
                  onValueChange={(value) =>
                    setDepartmentId(value === "all" ? undefined : parseInt(value))
                  }
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {departments?.departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInactive"
                  checked={includeInactive}
                  onCheckedChange={(checked) => setIncludeInactive(checked as boolean)}
                />
                <Label
                  htmlFor="includeInactive"
                  className="text-sm font-normal cursor-pointer"
                >
                  Incluir funcionários inativos
                </Label>
              </div>

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

          {/* Informações sobre os Formatos */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Formato CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Compatível com Excel</p>
                    <p className="text-xs text-muted-foreground">
                      Abra diretamente no Microsoft Excel ou Google Sheets
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Formato Tabular</p>
                    <p className="text-xs text-muted-foreground">
                      Dados organizados em linhas e colunas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Fácil Análise</p>
                    <p className="text-xs text-muted-foreground">
                      Ideal para análises e relatórios
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Formato JSON
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Estrutura Completa</p>
                    <p className="text-xs text-muted-foreground">
                      Preserva toda a estrutura de dados
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Integrações</p>
                    <p className="text-xs text-muted-foreground">
                      Ideal para integração com outros sistemas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Programação</p>
                    <p className="text-xs text-muted-foreground">
                      Fácil processamento por scripts e APIs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Os dados exportados incluem informações como nome, código, departamento, cargo,
                gestor e status de cada funcionário.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
