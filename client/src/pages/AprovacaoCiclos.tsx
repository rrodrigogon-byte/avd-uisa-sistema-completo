import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import { CheckCircle2, Clock, Users, Calendar, AlertCircle, Loader2, HelpCircle, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Página de Aprovação de Ciclos de Avaliação
 * 
 * Permite que gestores/RH aprovem ciclos concluídos para que funcionários
 * possam criar suas metas vinculadas ao ciclo.
 */

export default function AprovacaoCiclos() {
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Verificar se é o primeiro acesso
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenCycleApprovalTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = () => {
    localStorage.setItem('hasSeenCycleApprovalTutorial', 'true');
    setShowTutorial(false);
  };

  const utils = trpc.useUtils();

  // Buscar todos os ciclos
  const { data: cycles, isLoading } = trpc.cycles.list.useQuery({});
  
  const approveMutation = trpc.cycles.approveForGoals.useMutation({
    onSuccess: () => {
      toast.success("Ciclo aprovado com sucesso! Funcionários serão notificados.");
      utils.cycles.list.invalidate();
      setShowConfirmDialog(false);
      setSelectedCycle(null);
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar ciclo: ${error.message}`);
    },
  });

  const handleApprove = () => {
    if (!selectedCycle) return;
    approveMutation.mutate({ cycleId: selectedCycle.id });
  };

  // Filtrar ciclos
  const pendingCycles = cycles?.filter(
    (c: any) => c.status === "planejado" && !c.approvedForGoals
  ) || [];

  const approvedCycles = cycles?.filter(
    (c: any) => c.approvedForGoals
  ) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      planejado: { label: "Planejado", variant: "secondary" },
      ativo: { label: "Ativo", variant: "default" },
      concluido: { label: "Concluído", variant: "outline" },
      cancelado: { label: "Cancelado", variant: "destructive" },
    };
    const config = variants[status] || variants.planejado;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Aprovação de Ciclos</h1>
            <p className="text-muted-foreground mt-2">
              Aprove ciclos para permitir que funcionários criem suas metas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTutorial(true)}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Ver Tutorial
          </Button>
        </div>

        {/* Tutorial de Primeiro Acesso */}
        {showTutorial && (
          <Card className="border-blue-500 bg-blue-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-900">Tutorial: Aprovação de Ciclos</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeTutorial}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-blue-900">
                <div>
                  <h4 className="font-semibold mb-2">O que é a Aprovação de Ciclos?</h4>
                  <p className="text-blue-800">
                    Esta página permite que gestores e RH aprovem ciclos de avaliação para que os funcionários possam criar suas metas vinculadas ao ciclo.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Como funciona?</h4>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Ciclos em status "Planejado" aparecem na seção "Pendentes de Aprovação"</li>
                    <li>Clique em "Aprovar para Metas" para liberar o ciclo</li>
                    <li>Após aprovação, todos os funcionários serão notificados por email</li>
                    <li>Os funcionários poderão criar metas vinculadas ao ciclo aprovado</li>
                    <li>A aprovação não pode ser desfeita</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dicas importantes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Verifique as datas de início e fim do ciclo antes de aprovar</li>
                    <li>Certifique-se de que o ciclo está configurado corretamente</li>
                    <li>Após a aprovação, monitore a criação de metas pelos funcionários</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-blue-200">
                  <Button
                    onClick={closeTutorial}
                    className="w-full"
                  >
                    Entendi, não mostrar novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes de Aprovação</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCycles.length}</div>
              <p className="text-xs text-muted-foreground">
                Ciclos aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCycles.length}</div>
              <p className="text-xs text-muted-foreground">
                Ciclos já aprovados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ciclos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cycles?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Todos os ciclos cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ciclos Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle>Ciclos Pendentes de Aprovação</CardTitle>
            <CardDescription>
              Ciclos em planejamento aguardando aprovação para criação de metas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingCycles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum ciclo pendente</p>
                <p className="text-sm mt-2">
                  Todos os ciclos em planejamento já foram aprovados
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Ciclo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCycles.map((cycle: any) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {cycle.name}
                        {cycle.description && (
                          <p className="text-sm text-muted-foreground">{cycle.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cycle.type === "360" ? "360°" : cycle.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(cycle.startDate), "dd/MM/yyyy", { locale: ptBR })}
                          {" - "}
                          {format(new Date(cycle.endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCycle(cycle);
                            setShowConfirmDialog(true);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Aprovar para Metas
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Ciclos Aprovados */}
        <Card>
          <CardHeader>
            <CardTitle>Ciclos Aprovados</CardTitle>
            <CardDescription>
              Ciclos já aprovados para criação de metas pelos funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {approvedCycles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum ciclo aprovado ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Ciclo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Aprovado em</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedCycles.map((cycle: any) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {cycle.name}
                        {cycle.description && (
                          <p className="text-sm text-muted-foreground">{cycle.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cycle.type === "360" ? "360°" : cycle.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(cycle.startDate), "dd/MM/yyyy", { locale: ptBR })}
                          {" - "}
                          {format(new Date(cycle.endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cycle.approvedForGoalsAt ? (
                          <div className="text-sm">
                            {format(new Date(cycle.approvedForGoalsAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aprovado
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Aprovação do Ciclo</DialogTitle>
              <DialogDescription>
                Você está prestes a aprovar o ciclo para criação de metas
              </DialogDescription>
            </DialogHeader>
            
            {selectedCycle && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Ciclo:</p>
                  <p className="text-sm text-muted-foreground">{selectedCycle.name}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Período:</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedCycle.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    {" - "}
                    {format(new Date(selectedCycle.endDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900">
                        Após a aprovação:
                      </p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Todos os funcionários serão notificados</li>
                        <li>• Eles poderão criar metas vinculadas a este ciclo</li>
                        <li>• Esta ação não pode ser desfeita</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={approveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirmar Aprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
