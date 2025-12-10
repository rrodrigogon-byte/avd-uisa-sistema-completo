import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, FileSpreadsheet, Users, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Declaração de tipos para jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function RelatoriosHierarquia() {
  const [activeTab, setActiveTab] = useState("span-control");

  // Buscar relatórios
  const { data: spanReport, isLoading: loadingSpan } =
    trpc.hierarchy.getSpanOfControlReport.useQuery({});

  const { data: depthReport, isLoading: loadingDepth } =
    trpc.hierarchy.getDepthReport.useQuery();

  const { data: distributionReport, isLoading: loadingDistribution } =
    trpc.hierarchy.getDistributionReport.useQuery();

  const isLoading = loadingSpan || loadingDepth || loadingDistribution;

  // Exportar para PDF
  const exportToPDF = (reportType: string) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString("pt-BR");

    doc.setFontSize(18);
    doc.text("Relatório Hierárquico", 14, 20);
    doc.setFontSize(11);
    doc.text(`Data: ${date}`, 14, 28);

    if (reportType === "span-control" && spanReport) {
      doc.setFontSize(14);
      doc.text("Análise de Span of Control", 14, 38);

      const tableData = spanReport.map((item) => [
        item.managerName,
        item.directSubordinates.toString(),
        item.indirectSubordinates.toString(),
        item.totalSubordinates.toString(),
        item.levels.toString(),
      ]);

      autoTable(doc, {
        startY: 45,
        head: [["Gestor", "Diretos", "Indiretos", "Total", "Níveis"]],
        body: tableData,
      });
    } else if (reportType === "depth" && depthReport) {
      doc.setFontSize(14);
      doc.text("Análise de Profundidade Hierárquica", 14, 38);

      doc.setFontSize(11);
      doc.text(`Total de Níveis: ${depthReport.totalLevels}`, 14, 48);
      doc.text(`Span Médio: ${depthReport.averageSpan}`, 14, 54);
      doc.text(`Span Máximo: ${depthReport.maxSpan}`, 14, 60);
      doc.text(`Span Mínimo: ${depthReport.minSpan}`, 14, 66);

      const tableData = depthReport.employeesByLevel.map((level) => [
        level.levelName,
        level.count.toString(),
      ]);

      autoTable(doc, {
        startY: 75,
        head: [["Nível", "Funcionários"]],
        body: tableData,
      });
    } else if (reportType === "distribution" && distributionReport) {
      doc.setFontSize(14);
      doc.text("Distribuição de Subordinados", 14, 38);

      const tableData = distributionReport.map((item) => [
        item.managerName,
        item.subordinateCount.toString(),
      ]);

      autoTable(doc, {
        startY: 45,
        head: [["Gestor", "Subordinados Diretos"]],
        body: tableData,
      });
    }

    doc.save(`relatorio-hierarquia-${reportType}-${date}.pdf`);
    toast.success("Relatório exportado em PDF!");
  };

  // Exportar para Excel
  const exportToExcel = (reportType: string) => {
    const wb = XLSX.utils.book_new();

    if (reportType === "span-control" && spanReport) {
      const wsData = [
        ["Gestor", "Email", "Chapa", "Subordinados Diretos", "Subordinados Indiretos", "Total", "Níveis"],
        ...spanReport.map((item) => [
          item.managerName,
          item.managerEmail || "",
          item.managerChapa || "",
          item.directSubordinates,
          item.indirectSubordinates,
          item.totalSubordinates,
          item.levels,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Span of Control");
    } else if (reportType === "depth" && depthReport) {
      const wsData = [
        ["Nível", "Nome do Nível", "Quantidade de Funcionários"],
        ...depthReport.employeesByLevel.map((level) => [
          level.level,
          level.levelName,
          level.count,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Profundidade");

      // Adicionar estatísticas
      const statsData = [
        ["Métrica", "Valor"],
        ["Total de Níveis", depthReport.totalLevels],
        ["Span Médio", depthReport.averageSpan],
        ["Span Máximo", depthReport.maxSpan],
        ["Span Mínimo", depthReport.minSpan],
      ];
      const wsStats = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, "Estatísticas");
    } else if (reportType === "distribution" && distributionReport) {
      const wsData = [
        ["Gestor", "Email", "Chapa", "Subordinados Diretos"],
        ...distributionReport.map((item) => [
          item.managerName,
          item.managerEmail || "",
          item.managerChapa || "",
          item.subordinateCount,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Distribuição");
    }

    const date = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    XLSX.writeFile(wb, `relatorio-hierarquia-${reportType}-${date}.xlsx`);
    toast.success("Relatório exportado em Excel!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios Hierárquicos</h1>
        <p className="text-muted-foreground">
          Análises detalhadas da estrutura organizacional
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="span-control">
            <Users className="h-4 w-4 mr-2" />
            Span of Control
          </TabsTrigger>
          <TabsTrigger value="depth">
            <TrendingUp className="h-4 w-4 mr-2" />
            Profundidade
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BarChart3 className="h-4 w-4 mr-2" />
            Distribuição
          </TabsTrigger>
        </TabsList>

        {/* Span of Control */}
        <TabsContent value="span-control" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Análise de Span of Control</CardTitle>
                  <CardDescription>
                    Amplitude de controle por gestor (subordinados diretos e indiretos)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => exportToPDF("span-control")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={() => exportToExcel("span-control")} variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {spanReport && spanReport.length > 0 ? (
                <>
                  {/* Gráfico */}
                  <div className="mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={spanReport.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="managerName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="directSubordinates" fill="#0088FE" name="Diretos" />
                        <Bar dataKey="indirectSubordinates" fill="#00C49F" name="Indiretos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabela */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gestor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Subordinados Diretos</TableHead>
                        <TableHead className="text-right">Subordinados Indiretos</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Níveis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spanReport.map((item) => (
                        <TableRow key={item.managerId}>
                          <TableCell className="font-medium">{item.managerName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.managerEmail || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{item.directSubordinates}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{item.indirectSubordinates}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge>{item.totalSubordinates}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.levels}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profundidade Hierárquica */}
        <TabsContent value="depth" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Análise de Profundidade Hierárquica</CardTitle>
                  <CardDescription>
                    Distribuição de funcionários por nível hierárquico
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => exportToPDF("depth")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={() => exportToExcel("depth")} variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {depthReport ? (
                <>
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total de Níveis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{depthReport.totalLevels}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Span Médio</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{depthReport.averageSpan}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Span Máximo</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{depthReport.maxSpan}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Span Mínimo</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{depthReport.minSpan}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Pizza */}
                  <div className="mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={depthReport.employeesByLevel}
                          dataKey="count"
                          nameKey="levelName"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {depthReport.employeesByLevel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabela */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nível</TableHead>
                        <TableHead>Nome do Nível</TableHead>
                        <TableHead className="text-right">Quantidade de Funcionários</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depthReport.employeesByLevel.map((level) => (
                        <TableRow key={level.level}>
                          <TableCell>{level.level}</TableCell>
                          <TableCell className="font-medium">{level.levelName}</TableCell>
                          <TableCell className="text-right">
                            <Badge>{level.count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribuição de Subordinados */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Distribuição de Subordinados</CardTitle>
                  <CardDescription>
                    Quantidade de subordinados diretos por gestor
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => exportToPDF("distribution")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={() => exportToExcel("distribution")} variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {distributionReport && distributionReport.length > 0 ? (
                <>
                  {/* Gráfico */}
                  <div className="mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={distributionReport.slice(0, 15)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="managerName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="subordinateCount" fill="#8884D8" name="Subordinados" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabela */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gestor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Chapa</TableHead>
                        <TableHead className="text-right">Subordinados Diretos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {distributionReport.map((item) => (
                        <TableRow key={item.managerId}>
                          <TableCell className="font-medium">{item.managerName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.managerEmail || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.managerChapa || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge>{item.subordinateCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
