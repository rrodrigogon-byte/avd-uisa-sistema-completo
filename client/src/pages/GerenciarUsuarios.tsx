import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Search, Crown, Users, Edit, Eye, Mail, Activity, Calendar, LogIn } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GerenciarUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("todos");
  const [filterSalaryLead, setFilterSalaryLead] = useState<string>("todos");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form state para edição
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "colaborador" as const,
  });

  // Queries
  const { data: allUsers = [], isLoading, refetch } = trpc.employees.list.useQuery();
  const { data: salaryLeads = [] } = trpc.employees.listSalaryLeads.useQuery();

  // Mutations
  const updateSalaryLeadMutation = trpc.employees.updateSalaryLeadFlag.useMutation({
    onSuccess: () => {
      toast.success("Flag de Líder C&S atualizada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const updateUserMutation = trpc.employees.updateUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
      setShowEditDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  const sendCredentialsMutation = trpc.employees.sendCredentials.useMutation({
    onSuccess: () => {
      toast.success("Credenciais enviadas com sucesso!");
      setShowCredentialsDialog(false);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar credenciais: ${error.message}`);
    },
  });

  // Filtros
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "todos" || user.role === filterRole;

    const matchesSalaryLead =
      filterSalaryLead === "todos" ||
      (filterSalaryLead === "sim" && user.isSalaryLead) ||
      (filterSalaryLead === "nao" && !user.isSalaryLead);

    return matchesSearch && matchesRole && matchesSalaryLead;
  });

  const handleToggleSalaryLead = (userId: number, currentValue: boolean) => {
    updateSalaryLeadMutation.mutate({
      userId,
      isSalaryLead: !currentValue,
    });
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    updateUserMutation.mutate({
      id: selectedUser.id,
      name: editFormData.name,
      email: editFormData.email,
      role: editFormData.role,
    });
  };

  const handleSendCredentials = () => {
    if (!selectedUser) return;

    sendCredentialsMutation.mutate({
      userId: selectedUser.id,
    });
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email || "",
      role: user.role,
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (user: any) => {
    setSelectedUser(user);
    setShowViewDialog(true);
  };

  const openCredentialsDialog = (user: any) => {
    setSelectedUser(user);
    setShowCredentialsDialog(true);
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      admin: { label: "Admin", variant: "destructive" },
      rh: { label: "RH", variant: "default" },
      gestor: { label: "Gestor", variant: "secondary" },
      colaborador: { label: "Colaborador", variant: "outline" },
    };

    const config = roleMap[role] || { label: role, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Configure permissões e flags especiais dos usuários do sistema
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Líderes C&S
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{salaryLeads.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {allUsers.length > 0
                  ? `${Math.round((salaryLeads.length / allUsers.length) * 100)}% do total`
                  : "0% do total"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Gestores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {allUsers.filter((u) => u.role === "gestor").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="rh">RH</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Líder C&S</Label>
                <Select value={filterSalaryLead} onValueChange={setFilterSalaryLead}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuário(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead className="text-center">Líder C&S</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={user.isSalaryLead || false}
                              onCheckedChange={() =>
                                handleToggleSalaryLead(user.id, user.isSalaryLead || false)
                              }
                              disabled={updateSalaryLeadMutation.isLoading}
                            />
                            {user.isSalaryLead && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewDialog(user)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCredentialsDialog(user)}
                              title="Enviar Credenciais"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Líderes C&S */}
        {salaryLeads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Líderes de Cargos e Salários Ativos
              </CardTitle>
              <CardDescription>
                Usuários com permissão para aprovar descrições de cargos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salaryLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="border rounded-lg p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors"
                  >
                    <Crown className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lead.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {lead.email}
                      </p>
                      <div className="mt-2">{getRoleBadge(lead.role)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Visualização */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
              <DialogDescription>
                Informações completas de {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome Completo</Label>
                  <p className="font-medium mt-1">{selectedUser?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium mt-1">{selectedUser?.email || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Perfil</Label>
                  <div className="mt-1">{selectedUser && getRoleBadge(selectedUser.role)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Método de Login</Label>
                  <p className="font-medium mt-1">{selectedUser?.loginMethod || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Líder C&S</Label>
                  <p className="font-medium mt-1">
                    {selectedUser?.isSalaryLead ? (
                      <Badge variant="default" className="gap-1">
                        <Crown className="h-3 w-3" /> Sim
                      </Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cargo</Label>
                  <p className="font-medium mt-1">{selectedUser?.position || "—"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Informações de Acesso
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Criado em
                    </Label>
                    <p className="font-medium mt-1">
                      {selectedUser?.createdAt
                        ? format(new Date(selectedUser.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <LogIn className="h-3 w-3" />
                      Último Login
                    </Label>
                    <p className="font-medium mt-1">
                      {selectedUser?.lastSignedIn
                        ? format(new Date(selectedUser.lastSignedIn), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedUser?.department && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Informações Organizacionais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Departamento</Label>
                      <p className="font-medium mt-1">{selectedUser.department}</p>
                    </div>
                    {selectedUser.costCenter && (
                      <div>
                        <Label className="text-muted-foreground">Centro de Custo</Label>
                        <p className="font-medium mt-1">{selectedUser.costCenter}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações de {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Perfil *</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value: any) => setEditFormData({ ...editFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="rh">RH</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditUser} disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Envio de Credenciais */}
        <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Credenciais</DialogTitle>
              <DialogDescription>
                Enviar credenciais de acesso para {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <strong>Usuário:</strong> {selectedUser?.name}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {selectedUser?.email || "Não cadastrado"}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Um email será enviado com as credenciais de acesso ao sistema AVD UISA.
                  O usuário receberá instruções para realizar o primeiro login.
                </p>
              </div>

              {!selectedUser?.email && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Este usuário não possui email cadastrado. Não será possível enviar as credenciais.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCredentialsDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendCredentials}
                disabled={sendCredentialsMutation.isPending || !selectedUser?.email}
              >
                {sendCredentialsMutation.isPending ? "Enviando..." : "Enviar Credenciais"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
