import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Target, TrendingUp, TrendingDown, AlertCircle, Mail, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdesaoMetasCorporativas() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedGoal, setSelectedGoal] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: adherenceData, isLoading } = trpc.goals.getCorporateGoalsAdherence.useQuery({
    departmentId: selectedDepartment === "all" ? undefined : parseInt(selectedDepartment),
    goalId: selectedGoal === "all" ? undefined : parseInt(selectedGoal),
  });

  const { data: departments } = trpc.departments.list.useQuery();
  const { data: corporateGoals } = trpc.goals.listCorporateGoals.useQuery();

  const sendReminders = trpc.goals.sendAdherenceReminders.useMutation({
    onSuccess: () => {
      toast.success("Lembretes enviados com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao enviar lembretes");
    },
  });

  const exportReport = () => {
    if (!adherenceData) return;

    const csvContent = [
      ["Funcionário", "Cargo", "Meta", "Dias sem atualizar", "Status"],
      ...adherenceData.delayedEmployees.map((emp: any) => [
        emp.employeeName,
        emp.position || "-",
        emp.goalTitle,
        emp.daysSinceLastUpdate,
        emp.daysSinceLastUpdate > 14 ? "Crítico" : emp.daysSinceLastUpdate > 7 ? "Atrasado" : "Atenção",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `adesao-metas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const handleSendReminders = () => {
    const employeeIds = adherenceData?.delayedEmployees
      .filter((emp: any) => emp.daysSinceLastUpdate > 7)
      .map((emp: any) => emp.employeeId);

    if (!employeeIds || employeeIds.length === 0) {
      toast.info("Nenhum funcionário com atraso significativo");
      return;
    }

    sendReminders.mutate({ employeeIds });
  };

  const filteredEmployees = adherenceData?.delayedEmployees.filter((emp: any) =>
    emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Adesão de Metas Corporativas</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe o progresso e engajamento dos colaboradores nas metas corporativas
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportReport} variant="outline" disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleSendReminders} disabled={sendReminders.isPending}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Lembretes
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adherenceData?.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">Com metas corporativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atualizaram Progresso</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {adherenceData?.employeesWithProgress || 0}
              </div>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {adherenceData?.delayedEmployees?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Sem atualização &gt; 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Adesão</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {adherenceData?.adherenceRate
                  ? `${adherenceData.adherenceRate.toFixed(1)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">Engajamento geral</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Meta Corporativa</label>
                <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {corporateGoals?.map((goal: any) => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar Funcionário</label>
                <Input
                  placeholder="Nome do funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Funcionários Atrasados */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionários com Atraso na Atualização</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filteredEmployees && filteredEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Dias sem Atualizar</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{emp.employeeName}</TableCell>
                      <TableCell>{emp.position || "-"}</TableCell>
                      <TableCell>{emp.goalTitle}</TableCell>
                      <TableCell>{emp.daysSinceLastUpdate} dias</TableCell>
                      <TableCell>
                        {emp.daysSinceLastUpdate > 14 ? (
                          <Badge variant="destructive">Crítico</Badge>
                        ) : emp.daysSinceLastUpdate > 7 ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Atrasado
                          </Badge>
                        ) : (
                          <Badge variant="outline">Atenção</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum funcionário atrasado encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
