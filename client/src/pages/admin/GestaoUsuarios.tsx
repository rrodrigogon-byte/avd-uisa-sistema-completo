import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Shield, User, Users, Edit, Eye, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function GestaoUsuarios() {
  const { user, loading: authLoading } = useAuth();
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();
  
  // Estados para modais
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [sendCredentialsDialogOpen, setSendCredentialsDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Estados para edição
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "rh" | "gestor" | "colaborador">("colaborador");
  
  // Estados para criação
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState<"admin" | "rh" | "gestor" | "colaborador">("colaborador");
  const [createPassword, setCreatePassword] = useState("");
  
  // Mutations
  const sendCredentialsMutation = trpc.users.sendCredentials.useMutation({
    onSuccess: () => {
      toast.success("Credenciais enviadas com sucesso!", {
        description: "O usuário receberá um email com as instruções de acesso.",
      });
      setSendCredentialsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao enviar credenciais", {
        description: error.message,
      });
    },
  });
  
  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
      setEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar usuário", {
        description: error.message,
      });
    },
  });
  
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!", {
        description: "Um email com as credenciais foi enviado ao usuário.",
      });
      setCreateDialogOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreateRole("colaborador");
      setCreatePassword("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar usuário", {
        description: error.message,
      });
    },
  });

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "rh")) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: { label: "Administrador", variant: "destructive" as const },
      rh: { label: "RH", variant: "default" as const },
      gestor: { label: "Gestor", variant: "secondary" as const },
      colaborador: { label: "Colaborador", variant: "outline" as const },
    };

    const config = variants[role as keyof typeof variants] || variants.colaborador;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-destructive" />;
      case "rh":
        return <Users className="h-4 w-4 text-primary" />;
      case "gestor":
        return <User className="h-4 w-4 text-secondary-foreground" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSendCredentials = (user: any) => {
    setSelectedUser(user);
    setSendCredentialsDialogOpen(true);
  };
  
  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditRole(user.role);
    setEditDialogOpen(true);
  };
  
  const handleView = (user: any) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };
  
  const confirmSendCredentials = () => {
    if (!selectedUser) return;
    sendCredentialsMutation.mutate({ userId: selectedUser.id });
  };
  
  const confirmUpdate = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      userId: selectedUser.id,
      name: editName,
      email: editEmail,
      role: editRole,
    });
  };
  
  const handleCreate = () => {
    if (!createName || !createEmail) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    if (!createEmail.includes("@")) {
      toast.error("Email inválido");
      return;
    }
    
    createUserMutation.mutate({
      name: createName,
      email: createEmail,
      role: createRole,
      password: createPassword || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie usuários, permissões e acessos ao sistema
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter((u) => u.role === "admin").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestores</CardTitle>
              <User className="h-4 w-4 text-secondary-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter((u) => u.role === "gestor").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RH</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter((u) => u.role === "rh").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Lista completa de todos os usuários cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(u.role)}
                            <div>
                              <div className="font-medium">{u.name || "Sem nome"}</div>
                              {u.isSalaryLead && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Líder C&S
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {u.email || "Sem email"}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.lastSignedIn
                            ? format(new Date(u.lastSignedIn), "dd/MM/yyyy HH:mm", {
                                locale: ptBR,
                              })
                            : "Nunca"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(u.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(u)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(u)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendCredentials(u)}
                              title="Enviar Credenciais"
                            >
                              <Send className="h-4 w-4" />
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
      </div>
      
      {/* Dialog de Envio de Credenciais */}
      <Dialog open={sendCredentialsDialogOpen} onOpenChange={setSendCredentialsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Credenciais</DialogTitle>
            <DialogDescription>
              Deseja enviar as credenciais de acesso para {selectedUser?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Um email será enviado para <strong>{selectedUser?.email}</strong> com as instruções de acesso ao sistema.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendCredentialsDialogOpen(false)}
              disabled={sendCredentialsMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmSendCredentials}
              disabled={sendCredentialsMutation.isPending}
            >
              {sendCredentialsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Perfil</Label>
              <Select value={editRole} onValueChange={(value: any) => setEditRole(value)}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateUserMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmUpdate}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Nome</Label>
                <p className="font-medium">{selectedUser?.name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedUser?.email || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Perfil</Label>
                <div className="mt-1">{selectedUser && getRoleBadge(selectedUser.role)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Método de Login</Label>
                <p className="font-medium">{selectedUser?.loginMethod || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Líder C&S</Label>
                <p className="font-medium">{selectedUser?.isSalaryLead ? "Sim" : "Não"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data de Cadastro</Label>
                <p className="font-medium">
                  {selectedUser?.createdAt
                    ? format(new Date(selectedUser.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Última Atualização</Label>
                <p className="font-medium">
                  {selectedUser?.updatedAt
                    ? format(new Date(selectedUser.updatedAt), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Último Acesso</Label>
                <p className="font-medium">
                  {selectedUser?.lastSignedIn
                    ? format(new Date(selectedUser.lastSignedIn), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })
                    : "Nunca"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Criação */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo usuário. Um email com as credenciais será enviado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome Completo *</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Perfil *</Label>
              <Select value={createRole} onValueChange={(value: any) => setCreateRole(value)}>
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Senha Temporária (opcional)</Label>
              <Input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Deixe vazio para gerar automaticamente"
              />
              <p className="text-xs text-muted-foreground">
                Se não informada, uma senha aleatória será gerada e enviada por email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setCreateName("");
                setCreateEmail("");
                setCreateRole("colaborador");
                setCreatePassword("");
              }}
              disabled={createUserMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
