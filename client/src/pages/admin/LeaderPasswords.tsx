import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Shield,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LeaderPasswords() {
  const { user, loading: authLoading } = useAuth();
  const { data: passwords, isLoading, refetch } = trpc.leaderPasswords.list.useQuery();

  // Estados para modais
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<any>(null);

  // Estados para formulário
  const [formData, setFormData] = useState({
    leaderId: "",
    systemName: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    category: "outro" as "sistema_rh" | "sistema_financeiro" | "sistema_operacional" | "portal_web" | "outro",
    expiresAt: "",
  });

  // Estado para senha visualizada
  const [viewedPassword, setViewedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Mutations
  const createMutation = trpc.leaderPasswords.create.useMutation({
    onSuccess: () => {
      toast.success("Senha criada com sucesso!");
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar senha", { description: error.message });
    },
  });

  const updateMutation = trpc.leaderPasswords.update.useMutation({
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso!");
      setEditDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar senha", { description: error.message });
    },
  });

  const deleteMutation = trpc.leaderPasswords.delete.useMutation({
    onSuccess: () => {
      toast.success("Senha excluída com sucesso!");
      setDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir senha", { description: error.message });
    },
  });

  const viewPasswordMutation = trpc.leaderPasswords.viewPassword.useMutation({
    onSuccess: (data) => {
      setViewedPassword(data.password);
      setShowPassword(true);
    },
    onError: (error) => {
      toast.error("Erro ao visualizar senha", { description: error.message });
    },
  });

  const generatePasswordQuery = trpc.leaderPasswords.generatePassword.useQuery(
    { length: 16 },
    { enabled: false }
  );

  const resetForm = () => {
    setFormData({
      leaderId: "",
      systemName: "",
      username: "",
      password: "",
      url: "",
      notes: "",
      category: "outro",
      expiresAt: "",
    });
  };

  const handleCreate = () => {
    setCreateDialogOpen(true);
    resetForm();
  };

  const handleEdit = (password: any) => {
    setSelectedPassword(password);
    setFormData({
      leaderId: password.leaderId.toString(),
      systemName: password.systemName,
      username: password.username,
      password: "",
      url: password.url || "",
      notes: password.notes || "",
      category: password.category,
      expiresAt: password.expiresAt ? format(new Date(password.expiresAt), "yyyy-MM-dd") : "",
    });
    setEditDialogOpen(true);
  };

  const handleView = (password: any) => {
    setSelectedPassword(password);
    setViewedPassword("");
    setShowPassword(false);
    setViewDialogOpen(true);
  };

  const handleDelete = (password: any) => {
    setSelectedPassword(password);
    setDeleteDialogOpen(true);
  };

  const handleViewPassword = () => {
    if (!selectedPassword) return;
    viewPasswordMutation.mutate({ id: selectedPassword.id });
  };

  const handleCopyPassword = () => {
    if (!viewedPassword) return;
    navigator.clipboard.writeText(viewedPassword);
    toast.success("Senha copiada para a área de transferência!");
  };

  const handleGeneratePassword = async () => {
    const result = await generatePasswordQuery.refetch();
    if (result.data) {
      setFormData({ ...formData, password: result.data.password });
      toast.success("Senha gerada com sucesso!", {
        description: `Força: ${result.data.strength.feedback}`,
      });
    }
  };

  const confirmCreate = () => {
    createMutation.mutate({
      leaderId: parseInt(formData.leaderId),
      systemName: formData.systemName,
      username: formData.username,
      password: formData.password,
      url: formData.url || undefined,
      notes: formData.notes || undefined,
      category: formData.category,
      expiresAt: formData.expiresAt || undefined,
    });
  };

  const confirmUpdate = () => {
    if (!selectedPassword) return;
    updateMutation.mutate({
      id: selectedPassword.id,
      systemName: formData.systemName,
      username: formData.username,
      password: formData.password || undefined,
      url: formData.url || undefined,
      notes: formData.notes || undefined,
      category: formData.category,
      expiresAt: formData.expiresAt || undefined,
    });
  };

  const confirmDelete = () => {
    if (!selectedPassword) return;
    deleteMutation.mutate({ id: selectedPassword.id });
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      sistema_rh: { label: "Sistema RH", variant: "default" as const },
      sistema_financeiro: { label: "Sistema Financeiro", variant: "secondary" as const },
      sistema_operacional: { label: "Sistema Operacional", variant: "outline" as const },
      portal_web: { label: "Portal Web", variant: "secondary" as const },
      outro: { label: "Outro", variant: "outline" as const },
    };

    const config = variants[category as keyof typeof variants] || variants.outro;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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

  if (!user || user.role !== "admin") {
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

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Gerenciamento de Senhas de Líderes
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie senhas de sistemas externos para líderes de forma segura
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Senha
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Senhas</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passwords?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistemas RH</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {passwords?.filter((p) => p.category === "sistema_rh").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Senhas Ativas</CardTitle>
              <AlertCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {passwords?.filter((p) => p.isActive).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Senhas Cadastradas</CardTitle>
            <CardDescription>
              Lista de todas as senhas de líderes cadastradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !passwords || passwords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma senha cadastrada
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sistema</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passwords.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.systemName}</div>
                          {p.url && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {p.url}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{p.username}</TableCell>
                        <TableCell>{getCategoryBadge(p.category)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(p.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(p)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(p)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(p)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Dialog de Criação */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Senha</DialogTitle>
            <DialogDescription>
              Cadastre uma nova senha de sistema para um líder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-leaderId">ID do Líder *</Label>
                <Input
                  id="create-leaderId"
                  type="number"
                  value={formData.leaderId}
                  onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                  placeholder="ID do funcionário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="create-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sistema_rh">Sistema RH</SelectItem>
                    <SelectItem value="sistema_financeiro">Sistema Financeiro</SelectItem>
                    <SelectItem value="sistema_operacional">Sistema Operacional</SelectItem>
                    <SelectItem value="portal_web">Portal Web</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-systemName">Nome do Sistema *</Label>
              <Input
                id="create-systemName"
                value={formData.systemName}
                onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                placeholder="Ex: TOTVS, SAP, Portal RH"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-username">Usuário/Login *</Label>
              <Input
                id="create-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Nome de usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Senha *</Label>
              <div className="flex gap-2">
                <Input
                  id="create-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Senha"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  title="Gerar senha segura"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-url">URL</Label>
              <Input
                id="create-url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://sistema.exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-expiresAt">Data de Expiração</Label>
              <Input
                id="create-expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-notes">Observações</Label>
              <Textarea
                id="create-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmCreate}
              disabled={createMutation.isPending || !formData.leaderId || !formData.systemName || !formData.username || !formData.password}
            >
              {createMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Senha</DialogTitle>
            <DialogDescription>
              Atualize as informações da senha
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sistema_rh">Sistema RH</SelectItem>
                    <SelectItem value="sistema_financeiro">Sistema Financeiro</SelectItem>
                    <SelectItem value="sistema_operacional">Sistema Operacional</SelectItem>
                    <SelectItem value="portal_web">Portal Web</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-systemName">Nome do Sistema</Label>
                <Input
                  id="edit-systemName"
                  value={formData.systemName}
                  onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Usuário/Login</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova Senha (deixe vazio para manter)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Digite apenas se quiser alterar"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  title="Gerar senha segura"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiresAt">Data de Expiração</Label>
              <Input
                id="edit-expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmUpdate}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar Senha</DialogTitle>
            <DialogDescription>
              Informações completas da senha
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Sistema</Label>
                <p className="font-medium">{selectedPassword?.systemName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Categoria</Label>
                <div className="mt-1">{selectedPassword && getCategoryBadge(selectedPassword.category)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Usuário</Label>
                <p className="font-medium">{selectedPassword?.username}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">URL</Label>
                <p className="font-medium">{selectedPassword?.url || "N/A"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              {!showPassword ? (
                <Button
                  variant="outline"
                  onClick={handleViewPassword}
                  disabled={viewPasswordMutation.isPending}
                  className="w-full"
                >
                  {viewPasswordMutation.isPending ? (
                    "Carregando..."
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar Senha
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={viewedPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyPassword}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {selectedPassword?.notes && (
              <div>
                <Label className="text-muted-foreground">Observações</Label>
                <p className="mt-1 text-sm">{selectedPassword.notes}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <Label className="text-muted-foreground">Criado em</Label>
                <p>
                  {selectedPassword?.createdAt &&
                    format(new Date(selectedPassword.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                </p>
              </div>
              {selectedPassword?.lastAccessedAt && (
                <div>
                  <Label className="text-muted-foreground">Último acesso</Label>
                  <p>
                    {format(new Date(selectedPassword.lastAccessedAt), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta senha?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Sistema: <strong>{selectedPassword?.systemName}</strong>
            </p>
            <p className="text-sm">
              Usuário: <strong>{selectedPassword?.username}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
