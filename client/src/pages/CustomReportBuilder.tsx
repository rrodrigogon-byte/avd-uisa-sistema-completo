/**
 * Custom Report Builder Page
 * Interface para criar e executar relatórios personalizados
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Play, Plus, Trash2, Download, BarChart3, LineChart, PieChart, Table as TableIcon, Loader2 } from "lucide-react";
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DATA_SOURCES = [
  { value: "employees", label: "Funcionários" },
  { value: "goals", label: "Metas" },
  { value: "evaluations", label: "Avaliações" },
  { value: "pdi", label: "PDI" },
  { value: "ninebox", label: "Nine Box" },
  { value: "succession", label: "Sucessão" },
  { value: "calibration", label: "Calibração" },
  { value: "bonus", label: "Bônus" },
  { value: "feedback", label: "Feedback" },
  { value: "competencies", label: "Competências" },
];

const VISUALIZATION_TYPES = [
  { value: "table", label: "Tabela", icon: TableIcon },
  { value: "bar", label: "Gráfico de Barras", icon: BarChart3 },
  { value: "line", label: "Gráfico de Linha", icon: LineChart },
  { value: "pie", label: "Gráfico de Pizza", icon: PieChart },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function CustomReportBuilder() {
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataSource, setDataSource] = useState<string>("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [visualizationType, setVisualizationType] = useState<string>("table");

  const { data: reports, refetch: refetchReports } = trpc.customReportBuilder.list.useQuery();
  const createReportMutation = trpc.customReportBuilder.create.useMutation();
  const executeReportMutation = trpc.customReportBuilder.execute.useMutation();
  const deleteReportMutation = trpc.customReportBuilder.delete.useMutation();

  const handleCreateReport = async () => {
    if (!name || !dataSource || selectedFields.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createReportMutation.mutateAsync({
        name,
        description,
        dataSource: dataSource as any,
        selectedFields,
        visualizations: [{ type: visualizationType as any }],
      });

      toast.success("Relatório criado com sucesso!");
      setIsCreating(false);
      resetForm();
      refetchReports();
    } catch (error) {
      toast.error("Erro ao criar relatório");
    }
  };

  const handleExecuteReport = async (reportId: number) => {
    setIsExecuting(true);
    try {
      const result = await executeReportMutation.mutateAsync({ reportId });
      setReportData(result);
      setSelectedReport(reportId);
      toast.success(`Relatório executado em ${result.executionTimeMs}ms`);
    } catch (error) {
      toast.error("Erro ao executar relatório");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      await deleteReportMutation.mutateAsync({ id: reportId });
      toast.success("Relatório deletado com sucesso!");
      refetchReports();
      if (selectedReport === reportId) {
        setSelectedReport(null);
        setReportData(null);
      }
    } catch (error) {
      toast.error("Erro ao deletar relatório");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDataSource("");
    setSelectedFields([]);
    setVisualizationType("table");
  };

  const renderVisualization = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Nenhum dado para exibir</p>
        </div>
      );
    }

    const vizType = reportData.config.visualizations?.[0]?.type || "table";

    if (vizType === "table") {
      const columns = Object.keys(reportData.data[0]);
      return (
        <div className="border rounded-lg overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col: any) => (
                  <TableHead key={col} className="font-semibold">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.data.map((row: any, idx: number) => (
                <TableRow key={idx}>
                  {columns.map((col: any) => (
                    <TableCell key={col}>{row[col]?.toString() || "-"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (vizType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={Object.keys(reportData.data[0])[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={Object.keys(reportData.data[0])[1]} fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (vizType === "line") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RechartsLineChart data={reportData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={Object.keys(reportData.data[0])[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={Object.keys(reportData.data[0])[1]} stroke="#0088FE" />
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    }

    if (vizType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RechartsPieChart>
            <Pie
              data={reportData.data}
              dataKey={Object.keys(reportData.data[0])[1]}
              nameKey={Object.keys(reportData.data[0])[0]}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {reportData.data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Personalizados</h1>
          <p className="text-muted-foreground">Crie e execute relatórios customizados com visualizações interativas</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Relatório</DialogTitle>
              <DialogDescription>Configure seu relatório personalizado</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Relatório *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Relatório de Performance" />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o objetivo deste relatório" rows={3} />
              </div>
              <div>
                <Label htmlFor="dataSource">Fonte de Dados *</Label>
                <Select value={dataSource} onValueChange={setDataSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte de dados" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map((source: any) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Campos Selecionados *</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Digite o nome do campo e pressione Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        setSelectedFields([...selectedFields, e.currentTarget.value]);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFields.map((field: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {field}
                      <button className="ml-2" onClick={() => setSelectedFields(selectedFields.filter((_, i) => i !== idx))}>
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="visualization">Tipo de Visualização</Label>
                <Select value={visualizationType} onValueChange={setVisualizationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISUALIZATION_TYPES.map((viz: any) => (
                      <SelectItem key={viz.value} value={viz.value}>
                        {viz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateReport} disabled={createReportMutation.isPending}>
                {createReportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Relatório
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Meus Relatórios</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports?.map((report: any) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{report.name}</span>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{report.description || "Sem descrição"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleExecuteReport(report.id)} disabled={isExecuting}>
                      {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteReport(report.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {reports?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum relatório criado ainda</p>
                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                  Criar Primeiro Relatório
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results">
          {reportData ? (
            <Card>
              <CardHeader>
                <CardTitle>Resultados do Relatório</CardTitle>
                <CardDescription>
                  {reportData.rowCount} registros encontrados em {reportData.executionTimeMs}ms
                </CardDescription>
              </CardHeader>
              <CardContent>{renderVisualization()}</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Execute um relatório para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
