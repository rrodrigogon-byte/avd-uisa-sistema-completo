import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileCode, CheckCircle2, AlertCircle, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ExportarFolha() {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "xml" | "totvs" | "sap">("csv");
  const [isExporting, setIsExporting] = useState(false);

  const { data: calculations } = trpc.bonus.listCalculations.useQuery({
    status: "aprovado",
    referenceMonth: selectedMonth + "-01",
  });

  // TODO: Implementar getExportHistory no payrollRouter
  const exportHistory: any[] = [];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simular exportação (implementar endpoint real depois)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Gerar arquivo baseado no formato
      if (selectedFormat === "csv") {
        exportToCSV();
      } else if (selectedFormat === "xml") {
        exportToXML();
      } else if (selectedFormat === "totvs") {
        exportToTOTVS();
      } else if (selectedFormat === "sap") {
        exportToSAP();
      }
      
      toast.success("Exportação concluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!calculations) return;

    const headers = [
      "Chapa",
      "Nome",
      "CPF",
      "Departamento",
      "Cargo",
      "Mês Referência",
      "Valor Bônus",
      "Data Aprovação",
    ];

    const rows = calculations.map((calc: any) => [
      calc.employeeCode || "",
      calc.employeeName || "",
      calc.employeeCPF || "",
      calc.departmentName || "",
      calc.positionTitle || "",
      format(new Date(calc.referenceMonth), "MM/yyyy"),
      (calc.totalAmount / 100).toFixed(2),
      calc.approvedAt ? format(new Date(calc.approvedAt), "dd/MM/yyyy") : "",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bonus_folha_${selectedMonth}.csv`;
    link.click();
  };

  const exportToXML = () => {
    if (!calculations) return;

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<FolhaPagamento>
  <Competencia>${selectedMonth}</Competencia>
  <DataGeracao>${format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")}</DataGeracao>
  <TotalRegistros>${calculations.length}</TotalRegistros>
  <ValorTotal>${(calculations.reduce((sum: number, c: any) => sum + c.totalAmount, 0) / 100).toFixed(2)}</ValorTotal>
  <Bonus>
${calculations.map((calc: any) => `    <Registro>
      <Chapa>${calc.employeeCode || ""}</Chapa>
      <Nome>${calc.employeeName || ""}</Nome>
      <CPF>${calc.employeeCPF || ""}</CPF>
      <Departamento>${calc.departmentName || ""}</Departamento>
      <Cargo>${calc.positionTitle || ""}</Cargo>
      <MesReferencia>${format(new Date(calc.referenceMonth), "MM/yyyy")}</MesReferencia>
      <ValorBonus>${(calc.totalAmount / 100).toFixed(2)}</ValorBonus>
      <DataAprovacao>${calc.approvedAt ? format(new Date(calc.approvedAt), "dd/MM/yyyy") : ""}</DataAprovacao>
    </Registro>`).join("\n")}
  </Bonus>
</FolhaPagamento>`;

    const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bonus_folha_${selectedMonth}.xml`;
    link.click();
  };

  const exportToTOTVS = () => {
    if (!calculations) return;

    // Layout TOTVS RM (exemplo simplificado)
    const rows = calculations.map((calc: any) => {
      const chapa = (calc.employeeCode || "").padEnd(10);
      const valor = (calc.totalAmount / 100).toFixed(2).padStart(15, "0");
      const competencia = format(new Date(calc.referenceMonth), "yyyyMM");
      const evento = "0301"; // Código de evento de bônus (exemplo)
      
      return `${chapa}${competencia}${evento}${valor}`;
    });

    const txtContent = rows.join("\n");

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bonus_totvs_${selectedMonth}.txt`;
    link.click();
  };

  const exportToSAP = () => {
    if (!calculations) return;

    // Layout SAP (exemplo simplificado)
    const headers = [
      "PERNR",
      "LGART",
      "BETRG",
      "WAERS",
      "BEGDA",
      "ENDDA",
    ];

    const rows = calculations.map((calc: any) => [
      calc.employeeCode || "",
      "ZBON", // Wage type para bônus
      (calc.totalAmount / 100).toFixed(2),
      "BRL",
      format(new Date(calc.referenceMonth), "yyyyMMdd"),
      format(new Date(calc.referenceMonth), "yyyyMMdd"),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bonus_sap_${selectedMonth}.csv`;
    link.click();
  };

  const totalValue = calculations?.reduce((sum: number, calc: any) => sum + calc.totalAmount, 0) || 0;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Exportação para Folha de Pagamento</h1>
        <p className="text-muted-foreground">
          Exporte bônus aprovados para integração com sistemas de folha
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bônus Aprovados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Prontos para exportação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(totalValue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os bônus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exportações</CardTitle>
            <Download className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exportHistory?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Histórico de exportações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuração de Exportação */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Configurar Exportação</CardTitle>
          <CardDescription>
            Selecione o mês de referência e o formato de exportação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="month">Mês de Referência</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato de Exportação</Label>
              <Select value={selectedFormat} onValueChange={(v: any) => setSelectedFormat(v)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV Genérico
                    </div>
                  </SelectItem>
                  <SelectItem value="xml">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      XML Genérico
                    </div>
                  </SelectItem>
                  <SelectItem value="totvs">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      TOTVS RM
                    </div>
                  </SelectItem>
                  <SelectItem value="sap">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      SAP HCM
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {calculations && calculations.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Validação de Dados</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {calculations.length} bônus aprovados serão exportados. 
                      Valor total: R$ {(totalValue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exportando..." : "Exportar para Folha de Pagamento"}
              </Button>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed rounded-lg">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium mb-2">Nenhum bônus aprovado</p>
              <p className="text-sm text-muted-foreground">
                Não há bônus aprovados para o mês selecionado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Exportações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Exportações</CardTitle>
          <CardDescription>
            Últimas exportações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exportHistory && exportHistory.length > 0 ? (
            <div className="space-y-3">
              {exportHistory.map((exp: any) => (
                <div key={exp.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{exp.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(exp.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{exp.format.toUpperCase()}</Badge>
                    <Badge variant="secondary">{exp.recordCount} registros</Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma exportação realizada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
