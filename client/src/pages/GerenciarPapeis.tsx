import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Shield, Users, Search, CheckCircle2, Crown, UserCog } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS = {
  admin: "Administrador",
  rh: "RH",
  gestor: "Gestor",
  colaborador: "Colaborador",
};

const ROLE_COLORS = {
  admin: "destructive",
  rh: "default",
  gestor: "secondary",
  colaborador: "outline",
} as const;

export default function GerenciarPapeis() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [newSalaryLead, setNewSalaryLead] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Queries
  const { data: usersList = [], isLoading, refetch } = trpc.userRoles.list.useQuery(undefined);
  const { data: stats } = trpc.userRoles.stats.useQuery(undefined);
  const { data: salaryLeads = [] } = trpc.userRoles.listSalaryLeads.useQuery(undefined);

  // Mutations
  const updateRoleMutation = trpc.userRoles.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Papel atualizado com sucesso!");
      refetch();
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar papel: ${error.message}`);
    },
  });

  const setSalaryLeadMutation = trpc.userRoles.setSalaryLead.useMutation({
    onSuccess: () => {
      toast.success("Permissão atualizada com sucesso!");
      refetch();
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar permissão: ${error.message}`);
    },
  });

  const configureAlexsandraMutation = trpc.userRoles.configureAlexsandra.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Handlers
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setNewSalaryLead(user.isSalaryLead);
    setShowEditDialog(true);
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;

    // Atualizar papel se mudou
    if (newRole !== selectedUser.role) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: newRole as any,
      });
    }

    // Atualizar flag de líder de cargos se mudou
    if (newSalaryLead !== selectedUser.isSalaryLead) {
      setSalaryLeadMutation.mutate({
        userId: selectedUser.id,
        isSalaryLead: newSalaryLead,
      });
    }
  };

  const handleConfigureAlexsandra = () => {
    if (confirm("Deseja configurar Alexsandra como RH e Líder de Cargos e Salários?")) {
      configureAlexsandraMutation.mutate({});
    }
  };

  // Filtrar usuários
  const filteredUsers = usersList.filter((u: any) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem gerenciar papéis de usuários</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Gerenciar Papéis e Permissões
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure papéis e permissões especiais dos usuários do sistema
            </p>
          </div>
          
          <Button
            onClick={handleConfigureAlexsandra}
            disabled={configureAlexsandraMutation.isPending}
          >
            <UserCog className="h-4 w-4 mr-2" />
            Configurar Alexsandra
          </Button>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.byRole.admin}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RH</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.byRole.rh}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Líderes C&S</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.salaryLeadsCount}</div>
                <p className="text-xs text-muted-foreground">Cargos e Salários</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Líderes de Cargos e Salários */}
        {salaryLeads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Líderes de Cargos e Salários</CardTitle>
              <CardDescription>
                Usuários com permissão especial para gerenciar cargos e salários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {salaryLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                    <Badge variant={ROLE_COLORS[lead.role as keyof typeof ROLE_COLORS]}>
                      {ROLE_LABELS[lead.role as keyof typeof ROLE_LABELS]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Usuários</CardTitle>
            <CardDescription>
              Gerencie papéis e permissões de todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabela */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando usuários...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Líder C&S</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "Sem nome"}</TableCell>
                      <TableCell>{u.email || "Sem email"}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_COLORS[u.role as keyof typeof ROLE_COLORS]}>
                          {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.isSalaryLead ? (
                          <Badge variant="default">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Não</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(u)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
              Altere o papel e permissões especiais de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Papel</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="salaryLead"
                checked={newSalaryLead}
                onChange={(e) => setNewSalaryLead(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="salaryLead" className="text-sm font-medium">
                Líder de Cargos e Salários
              </label>
            </div>

            <p className="text-sm text-muted-foreground">
              Líderes de Cargos e Salários têm permissão especial para gerenciar descrições de cargos e faixas salariais.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={updateRoleMutation.isPending || setSalaryLeadMutation.isPending}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
