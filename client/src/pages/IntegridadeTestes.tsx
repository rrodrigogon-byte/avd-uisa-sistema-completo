import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import {
  Shield,
  Plus,
  Search,
  Filter,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  User,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function IntegridadeTestes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteType, setInviteType] = useState<"employee" | "candidate">("employee");

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");

  // Queries
  const { data: invitations, isLoading, refetch } = trpc.integrityPIR.listInvitations.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: 100,
  });

  const { data: employees } = trpc.employees.list.useQuery(undefined);

  // Mutations
  const createInvitation = trpc.integrityPIR.createInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Convite criado com sucesso!");
      toast.info(`Link: ${window.location.origin}${data.invitationUrl}`);
      setShowInviteDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar convite: ${error.message}`);
    },
  });

  const resendInvitation = trpc.integrityPIR.resendInvitation.useMutation({
    onSuccess: () => {
      toast.success("Convite reenviado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao reenviar convite: ${error.message}`);
    },
  });

  const resetForm = () => {
    setEmployeeId("");
    setCandidateName("");
    setCandidateEmail("");
    setCandidatePhone("");
    setPurpose("");
    setNotes("");
    setExpiresInDays("7");
  };

  const handleCreateInvite = () => {
    if (inviteType === "employee" && !employeeId) {
      toast.error("Selecione um funcionário");
      return;
    }

    if (inviteType === "candidate" && (!candidateName || !candidateEmail)) {
      toast.error("Preencha nome e e-mail do candidato");
      return;
    }

    createInvitation.mutate({
      employeeId: inviteType === "employee" ? parseInt(employeeId) : undefined,
      candidateName: inviteType === "candidate" ? candidateName : undefined,
      candidateEmail: inviteType === "candidate" ? candidateEmail : undefined,
      candidatePhone: inviteType === "candidate" ? candidatePhone : undefined,
      purpose,
      notes,
      expiresInDays: parseInt(expiresInDays),
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      sent: { label: "Enviado", className: "bg-blue-100 text-blue-800" },
      in_progress: { label: "Em Andamento", className: "bg-purple-100 text-purple-800" },
      completed: { label: "Concluído", className: "bg-green-100 text-green-800" },
      expired: { label: "Expirado", className: "bg-red-100 text-red-800" },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredInvitations = safeFilter(invitations, (inv) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      inv.candidateName?.toLowerCase().includes(searchLower) ||
      inv.candidateEmail?.toLowerCase().includes(searchLower) ||
      inv.purpose?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Testes de Integridade
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar aplicação e envio de testes de integridade
          </p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Convite
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Convite para Teste de Integridade</DialogTitle>
              <DialogDescription>
                Envie um convite para funcionário ou candidato externo responder o PIR de Integridade
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Tipo de Convite */}
              <div className="space-y-2">
                <Label>Tipo de Convite</Label>
                <Tabs value={inviteType} onValueChange={(v) => setInviteType(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="employee">Funcionário</TabsTrigger>
                    <TabsTrigger value="candidate">Candidato Externo</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Funcionário */}
              {inviteType === "employee" && (
                <div className="space-y-2">
                  <Label htmlFor="employee">Funcionário *</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeMap(employees, (emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} - {emp.chapa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Candidato Externo */}
              {inviteType === "candidate" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="candidateName">Nome do Candidato *</Label>
                    <Input
                      id="candidateName"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidateEmail">E-mail *</Label>
                    <Input
                      id="candidateEmail"
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidatePhone">Telefone</Label>
                    <Input
                      id="candidatePhone"
                      value={candidatePhone}
                      onChange={(e) => setCandidatePhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </>
              )}

              {/* Propósito */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Propósito</Label>
                <Input
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ex: Processo Seletivo, Avaliação Anual"
                />
              </div>

              {/* Validade */}
              <div className="space-y-2">
                <Label htmlFor="expires">Validade (dias)</Label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger>
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

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações Internas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações visíveis apenas para administradores"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateInvite} disabled={createInvitation.isPending}>
                {createInvitation.isPending ? "Criando..." : "Criar Convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, e-mail ou propósito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Convites */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            {filteredInvitations?.length || 0} convite(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !isEmpty(filteredInvitations) ? (
            <div className="space-y-4">
              {safeMap(filteredInvitations, (invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-semibold">
                              {invitation.candidateName || "Funcionário"}
                            </div>
                            {invitation.candidateEmail && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {invitation.candidateEmail}
                              </div>
                            )}
                          </div>
                        </div>

                        {invitation.purpose && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Propósito:</span>
                            <span>{invitation.purpose}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Criado: {format(new Date(invitation.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Expira: {format(new Date(invitation.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>

                        {invitation.completedAt && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Concluído em: {format(new Date(invitation.completedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(invitation.status)}
                        {invitation.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendInvitation.mutate({ invitationId: invitation.id })}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Reenviar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum convite encontrado</p>
              <Button className="mt-4" onClick={() => setShowInviteDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Convite
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
