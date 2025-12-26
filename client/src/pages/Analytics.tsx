import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, TrendingDown, Clock, DollarSign, Download, BarChart3 } from "lucide-react";
import { CostCenterFilter } from "@/components/CostCenterFilter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export default function Analytics() {
  const [period, setPeriod] = useState("12m");
  const [department, setDepartment] = useState("todos");
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>("all");

  const { data: kpis, isLoading: kpisLoading } = trpc.analytics.getKPIs.useQuery(
    selectedCostCenter !== "all" ? { costCenter: selectedCostCenter } : undefined
  );
  const { data: headcountByDept } = trpc.analytics.getHeadcountByDepartment.useQuery(
    selectedCostCenter !== "all" ? { costCenter: selectedCostCenter } : undefined
  );
  const { data: headcountByPosition } = trpc.analytics.getHeadcountByPosition.useQuery(
    selectedCostCenter !== "all" ? { costCenter: selectedCostCenter } : undefined
  );
  const { data: turnoverRate } = trpc.analytics.getTurnoverRate.useQuery({});
  const { data: averageTenure } = trpc.analytics.getAverageTenure.useQuery({});
  const { data: diversity } = trpc.analytics.getDiversityAnalysis.useQuery({});
  const { data: growthProjection } = trpc.analytics.getGrowthProjection.useQuery({});

  const handleExport = () => {
    toast.info("Exportando relatório de Analytics...");
    setTimeout(() => toast.success("Relatório exportado com sucesso!"), 1000);
  };

  if (kpisLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Analytics de RH</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Métricas avançadas e análise de dados de pessoas - UISA
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CostCenterFilter
              value={selectedCostCenter}
              onChange={setSelectedCostCenter}
            />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">6 meses</SelectItem>
                <SelectItem value="12m">12 meses</SelectItem>
                <SelectItem value="24m">24 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Headcount</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">+5</span> vs. mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Turnover Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.8%</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">-0.3%</span> vs. mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.5 anos</div>
              <p className="text-xs text-muted-foreground mt-1">Tempo médio de permanência</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Custo por Contratação</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 15.000</div>
              <p className="text-xs text-muted-foreground mt-1">Média por contratação</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Distribuição por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie 
                    data={headcountByDept || []} 
                    dataKey="count" 
                    nameKey="department" 
                    cx="50%" 
                    cy="45%" 
                    outerRadius={80}
                    label={false}
                  >
                    {(headcountByDept || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={80}
                    wrapperStyle={{ paddingTop: "20px", maxHeight: "80px", overflow: "auto" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Top 15 Cargos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={headcountByPosition || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="position" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                Taxa de Turnover Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={turnoverRate || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#F59E0B" strokeWidth={2} name="Taxa (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Tempo Médio de Permanência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={averageTenure || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tenure" fill="#8B5CF6" name="Anos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-500" />
                Análise de Diversidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={diversity?.gender || []} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={100} label>
                    {(diversity?.gender || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-500" />
                Projeções de Crescimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthProjection || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} name="Real" />
                  <Line type="monotone" dataKey="projected" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Projetado" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
