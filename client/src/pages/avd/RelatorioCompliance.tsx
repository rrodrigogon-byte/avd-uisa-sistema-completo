import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Clock, Download, FileText, Mail, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function RelatorioCompliance() {
  const [selectedCycleId, setSelectedCycleId] = useState<number>();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>();

  const { data: cycles } = trpc.avdUisa.listCycles.useQuery(undefined);
  const { data: report, isLoading } = trpc.avdUisa.complianceReport.useQuery(
    {
      cycleId: selectedCycleId!,
      departmentId: selectedDepartmentId,
    },
    { enabled: !!selectedCycleId }
  );

  // Selecionar automaticamente o ciclo ativo
  const activeCycle = cycles?.find((c) => c.status === "ativo");
  if (activeCycle && !selectedCycleId) {
    setSelectedCycleId(activeCycle.id);
  }

  const selfPending = report?.selfPending || [];
  const managerPending = report?.managerPending || [];

  const handleExportReport = () => {
    // TODO: Implementar exportação em PDF/Excel
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  const handleSendReminder = (employeeId: number, type: "self" | "manager") => {
    // TODO: Implementar envio de lembrete por email
    toast.success("Lembrete enviado com sucesso!");
  };

  const isOverdue = (deadline: Date | null | undefined) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatório de Compliance</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe avaliações pendentes e identifique atrasos
            </p>
          </div>

          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciclo de Avaliação *</Label>
                <Select
                  value={selectedCycleId?.toString() || ""}
                  onValueChange={(value) => setSelectedCycleId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles?.map((cycle: any) => (
                      <SelectItem key={cycle.id} value={cycle.id.toString()}>
                        {cycle.name} ({cycle.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Departamento (opcional)</Label>
                <Select
                  value={selectedDepartmentId?.toString() || "all"}
                  onValueChange={(value) => setSelectedDepartmentId(value === "all" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {/* TODO: Carregar lista de departamentos */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedCycleId ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Selecione um ciclo para visualizar o relatório</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando relatório...</p>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Autoavaliações Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{selfPending.length}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selfPending.filter((e) => isOverdue(e.cycle?.selfEvaluationDeadline)).length} atrasadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Avaliações de Gestor Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{managerPending.length}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {managerPending.filter((e) => isOverdue(e.cycle?.managerEvaluationDeadline)).length} atrasadas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="self" className="space-y-4">
              <TabsList>
                <TabsTrigger value="self" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Autoavaliações Pendentes
                  {selfPending.length > 0 && (
                    <Badge variant="secondary">{selfPending.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="manager" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Avaliações de Gestor Pendentes
                  {managerPending.length > 0 && (
                    <Badge variant="secondary">{managerPending.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Autoavaliações Pendentes */}
              <TabsContent value="self" className="space-y-4">
                {selfPending.length > 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4">Colaborador</th>
                              <th className="text-left py-3 px-4">Cargo</th>
                              <th className="text-left py-3 px-4">Departamento</th>
                              <th className="text-center py-3 px-4">Prazo</th>
                              <th className="text-center py-3 px-4">Status</th>
                              <th className="text-center py-3 px-4">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selfPending.map((item: any) => {
                              const overdue = isOverdue(item.cycle?.selfEvaluationDeadline);
                              return (
                                <tr key={item.evaluation.id} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-4">
                                    <div className="font-medium">{item.employee?.name}</div>
                                    <div className="text-sm text-muted-foreground">{item.employee?.email}</div>
                                  </td>
                                  <td className="py-3 px-4">{item.position?.name || "-"}</td>
                                  <td className="py-3 px-4">{item.department?.name || "-"}</td>
                                  <td className="text-center py-3 px-4">
                                    {item.cycle?.selfEvaluationDeadline
                                      ? format(new Date(item.cycle.selfEvaluationDeadline), "dd/MM/yyyy", { locale: ptBR })
                                      : "-"}
                                  </td>
                                  <td className="text-center py-3 px-4">
                                    {overdue ? (
                                      <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
                                        <AlertTriangle className="h-3 w-3" />
                                        Atrasado
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
                                        <Clock className="h-3 w-3" />
                                        Pendente
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="text-center py-3 px-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSendReminder(item.employee!.id, "self")}
                                    >
                                      <Mail className="h-3 w-3 mr-1" />
                                      Lembrete
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma autoavaliação pendente</h3>
                      <p className="text-muted-foreground">
                        Todos os colaboradores completaram suas autoavaliações!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Avaliações de Gestor Pendentes */}
              <TabsContent value="manager" className="space-y-4">
                {managerPending.length > 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4">Colaborador</th>
                              <th className="text-left py-3 px-4">Cargo</th>
                              <th className="text-left py-3 px-4">Departamento</th>
                              <th className="text-left py-3 px-4">Gestor</th>
                              <th className="text-center py-3 px-4">Prazo</th>
                              <th className="text-center py-3 px-4">Status</th>
                              <th className="text-center py-3 px-4">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {managerPending.map((item: any) => {
                              const overdue = isOverdue(item.cycle?.managerEvaluationDeadline);
                              return (
                                <tr key={item.evaluation.id} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-4">
                                    <div className="font-medium">{item.employee?.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Autoavaliação concluída em{" "}
                                      {item.evaluation.selfCompletedAt &&
                                        format(new Date(item.evaluation.selfCompletedAt), "dd/MM/yyyy", { locale: ptBR })}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">{item.position?.name || "-"}</td>
                                  <td className="py-3 px-4">{item.department?.name || "-"}</td>
                                  <td className="py-3 px-4">
                                    {item.manager ? (
                                      <div>
                                        <div className="font-medium">{item.manager.name}</div>
                                        <div className="text-sm text-muted-foreground">{item.manager.email}</div>
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="text-center py-3 px-4">
                                    {item.cycle?.managerEvaluationDeadline
                                      ? format(new Date(item.cycle.managerEvaluationDeadline), "dd/MM/yyyy", { locale: ptBR })
                                      : "-"}
                                  </td>
                                  <td className="text-center py-3 px-4">
                                    {overdue ? (
                                      <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
                                        <AlertTriangle className="h-3 w-3" />
                                        Atrasado
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
                                        <Clock className="h-3 w-3" />
                                        Pendente
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="text-center py-3 px-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSendReminder(item.employee!.managerId!, "manager")}
                                    >
                                      <Mail className="h-3 w-3 mr-1" />
                                      Lembrete
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação de gestor pendente</h3>
                      <p className="text-muted-foreground">
                        Todos os gestores completaram suas avaliações!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
