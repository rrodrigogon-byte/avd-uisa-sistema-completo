import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, Users, CheckCircle, Clock, XCircle, Eye, BarChart3, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const testTypes = [
  { value: "disc", label: "DISC" },
  { value: "bigfive", label: "Big Five" },
  { value: "mbti", label: "MBTI" },
  { value: "ie", label: "Inteligência Emocional" },
  { value: "vark", label: "VARK" },
  { value: "leadership", label: "Liderança" },
  { value: "careeranchors", label: "Âncoras de Carreira" },
];

const statusColors = {
  pendente: "bg-yellow-500",
  em_andamento: "bg-blue-500",
  concluido: "bg-green-500",
  expirado: "bg-red-500",
};

const statusLabels = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  expirado: "Expirado",
};

export default function PsychometricTestsAdmin() {
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedTestType, setSelectedTestType] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [expiresInDays, setExpiresInDays] = useState(7);

  // Queries
  const { data: employees } = trpc.avdUisa.listEmployees.useQuery(undefined);
  const { data: pendingInvitations, refetch: refetchPending } =
    trpc.psychometricTests.listPendingInvitations.useQuery(undefined);
  const { data: allResults, refetch: refetchResults } =
    trpc.psychometricTests.listAllResults.useQuery(undefined);
  const { data: stats, refetch: refetchStats } =
    trpc.psychometricTests.getCompletionStats.useQuery(undefined);
  const { data: resultsByType } =
    trpc.psychometricTests.getResultsByType.useQuery(undefined);

  // Mutations
  const sendIndividual = trpc.psychometricTests.sendIndividualInvitation.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Convite enviado com sucesso!");
        setSendDialogOpen(false);
        setSelectedEmployee(null);
        setSelectedTestType("");
        refetchPending();
        refetchStats();
      } else {
        toast.warning(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao enviar convite: ${error.message}`);
    },
  });

  const sendBulk = trpc.psychometricTests.sendBulkInvitations.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Convites enviados: ${data.successCount} sucesso, ${data.failureCount} falhas`
      );
      setBulkDialogOpen(false);
      setSelectedEmployees([]);
      setSelectedTestType("");
      refetchPending();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar convites: ${error.message}`);
    },
  });

  const handleSendIndividual = () => {
    if (!selectedEmployee || !selectedTestType) {
      toast.error("Selecione um funcionário e um tipo de teste");
      return;
    }

    sendIndividual.mutate({
      employeeId: selectedEmployee,
      testType: selectedTestType as any,
      expiresInDays,
    });
  };

  const handleSendBulk = () => {
    if (selectedEmployees.length === 0 || !selectedTestType) {
      toast.error("Selecione funcionários e um tipo de teste");
      return;
    }

    sendBulk.mutate({
      employeeIds: selectedEmployees,
      testType: selectedTestType as any,
      expiresInDays,
    });
  };

  const copyTestLink = (token: string) => {
    const link = `${window.location.origin}/teste/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Testes Psicométricos</h1>
            <p className="text-muted-foreground">
              Envie convites e acompanhe resultados de testes psicométricos
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSendDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Enviar Individual
            </Button>
            <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Envio em Massa
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Convites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendente || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.concluido || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Expirados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.expirado || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Convites Pendentes</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Convites Pendentes</CardTitle>
                <CardDescription>
                  Convites enviados aguardando resposta dos colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Tipo de Teste</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations?.map((item: any) => (
                      <TableRow key={item.invitation.id}>
                        <TableCell className="font-medium">
                          {item.employee?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {testTypes.find((t) => t.value === item.invitation.testType)
                            ?.label || item.invitation.testType}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[item.invitation.status]}>
                            {statusLabels[item.invitation.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.invitation.sentAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {new Date(item.invitation.expiresAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell>
                          {item.invitation.emailSent ? (
                            <Badge variant="outline" className="bg-green-50">
                              Enviado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50">
                              Não enviado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTestLink(item.invitation.uniqueToken)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!pendingInvitations || pendingInvitations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum convite pendente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Testes</CardTitle>
                <CardDescription>
                  Resultados consolidados dos testes concluídos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Tipo de Teste</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Concluído em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allResults?.map((item: any) => (
                      <TableRow key={item.result.id}>
                        <TableCell className="font-medium">
                          {item.employee?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {testTypes.find((t) => t.value === item.result.testType)
                            ?.label || item.result.testType}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.result.profileType}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.result.completedAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedResult(item.result);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!allResults || allResults.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum resultado disponível
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics de Testes</CardTitle>
                <CardDescription>
                  Distribuição de resultados por tipo de teste
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resultsByType?.map((item: any) => (
                    <div key={item.testType} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">
                          {testTypes.find((t) => t.value === item.testType)?.label ||
                            item.testType}
                        </span>
                      </div>
                      <Badge variant="secondary">{item.count} resultados</Badge>
                    </div>
                  ))}
                  {(!resultsByType || resultsByType.length === 0) && (
                    <p className="text-center text-muted-foreground">
                      Nenhum dado disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Envio Individual */}
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Convite Individual</DialogTitle>
              <DialogDescription>
                Selecione um funcionário e o tipo de teste para enviar o convite
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Funcionário</Label>
                <Select
                  value={selectedEmployee?.toString()}
                  onValueChange={(value) => setSelectedEmployee(parseInt(value))}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="testType">Tipo de Teste</Label>
                <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                  <SelectTrigger id="testType">
                    <SelectValue placeholder="Selecione o tipo de teste" />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map((test: any) => (
                      <SelectItem key={test.value} value={test.value}>
                        {test.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Validade (dias)</Label>
                <Select
                  value={expiresInDays.toString()}
                  onValueChange={(value) => setExpiresInDays(parseInt(value))}
                >
                  <SelectTrigger id="expires">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendIndividual} disabled={sendIndividual.isPending}>
                {sendIndividual.isPending ? "Enviando..." : "Enviar Convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Envio em Massa */}
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Envio em Massa</DialogTitle>
              <DialogDescription>
                Selecione múltiplos funcionários para enviar o mesmo teste
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Funcionários ({selectedEmployees.length} selecionados)</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {employees?.map((emp: any) => (
                    <div key={emp.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`emp-${emp.id}`}
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees([...selectedEmployees, emp.id]);
                          } else {
                            setSelectedEmployees(
                              selectedEmployees.filter((id) => id !== emp.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer">
                        {emp.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulkTestType">Tipo de Teste</Label>
                <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                  <SelectTrigger id="bulkTestType">
                    <SelectValue placeholder="Selecione o tipo de teste" />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map((test: any) => (
                      <SelectItem key={test.value} value={test.value}>
                        {test.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulkExpires">Validade (dias)</Label>
                <Select
                  value={expiresInDays.toString()}
                  onValueChange={(value) => setExpiresInDays(parseInt(value))}
                >
                  <SelectTrigger id="bulkExpires">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendBulk} disabled={sendBulk.isPending}>
                {sendBulk.isPending ? "Enviando..." : "Enviar Convites"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes do Resultado */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Resultado</DialogTitle>
              <DialogDescription>
                Resultado completo do teste psicométrico
              </DialogDescription>
            </DialogHeader>
            {selectedResult && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tipo de Perfil</Label>
                    <p className="text-lg font-bold">{selectedResult.profileType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Data de Conclusão</Label>
                    <p className="text-lg">
                      {new Date(selectedResult.completedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {selectedResult.profileDescription && (
                  <div>
                    <Label className="text-sm font-medium">Descrição do Perfil</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.profileDescription}
                    </p>
                  </div>
                )}

                {selectedResult.strengths && (
                  <div>
                    <Label className="text-sm font-medium">Pontos Fortes</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.strengths}
                    </p>
                  </div>
                )}

                {selectedResult.developmentAreas && (
                  <div>
                    <Label className="text-sm font-medium">Áreas de Desenvolvimento</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.developmentAreas}
                    </p>
                  </div>
                )}

                {selectedResult.workStyle && (
                  <div>
                    <Label className="text-sm font-medium">Estilo de Trabalho</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.workStyle}
                    </p>
                  </div>
                )}

                {selectedResult.communicationStyle && (
                  <div>
                    <Label className="text-sm font-medium">Estilo de Comunicação</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.communicationStyle}
                    </p>
                  </div>
                )}

                {selectedResult.leadershipStyle && (
                  <div>
                    <Label className="text-sm font-medium">Estilo de Liderança</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.leadershipStyle}
                    </p>
                  </div>
                )}

                {selectedResult.motivators && (
                  <div>
                    <Label className="text-sm font-medium">Motivadores</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.motivators}
                    </p>
                  </div>
                )}

                {selectedResult.stressors && (
                  <div>
                    <Label className="text-sm font-medium">Estressores</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.stressors}
                    </p>
                  </div>
                )}

                {selectedResult.teamContribution && (
                  <div>
                    <Label className="text-sm font-medium">Contribuição para Equipe</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.teamContribution}
                    </p>
                  </div>
                )}

                {selectedResult.careerRecommendations && (
                  <div>
                    <Label className="text-sm font-medium">Recomendações de Carreira</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.careerRecommendations}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
