import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LeaderPasswords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("todos");
  const [filterLeader, setFilterLeader] = useState<string>("todos");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<any>(null);
  const [viewedPassword, setViewedPassword] = useState<string>("");

  // Form states
  const [formData, setFormData] = useState({
    leaderId: "",
    systemName: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    category: "outro" as const,
    expiresAt: "",
  });

  // Queries
  const { data: passwords = [], isLoading, refetch } = trpc.leaderPasswords.list.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();

  // Mutations
  const createMutation = trpc.leaderPasswords.create.useMutation({
    onSuccess: () => {
      toast.success("Senha criada com sucesso!");
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar senha: ${error.message}`);
    },
  });

  const updateMutation = trpc.leaderPasswords.update.useMutation({
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso!");
      setShowEditDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar senha: ${error.message}`);
    },
  });

  const deleteMutation = trpc.leaderPasswords.delete.useMutation({
    onSuccess: () => {
      toast.success("Senha excluída com sucesso!");
      setShowDeleteDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir senha: ${error.message}`);
    },
  });

  const viewPasswordMutation = trpc.leaderPasswords.viewPassword.useMutation({
    onSuccess: (data) => {
      setViewedPassword(data.password);
      toast.success("Senha descriptografada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao visualizar senha: ${error.message}`);
    },
  });

  const generatePasswordQuery = trpc.leaderPasswords.generatePassword.useQuery(
    { length: 16 },
    { enabled: false }
  );

  // Filtros
  const filteredPasswords = passwords.filter((pwd: any) => {
    const employee = employees.find((e: any) => e.id === pwd.leaderId);
    const leaderName = employee?.name || "";

    const matchesSearch =
      pwd.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pwd.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leaderName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "todos" || pwd.category === filterCategory;
    const matchesLeader = filterLeader === "todos" || pwd.leaderId.toString() === filterLeader;

    return matchesSearch && matchesCategory && matchesLeader;
  });

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
    setSelectedPassword(null);
    setViewedPassword("");
  };

  const handleCreate = () => {
    if (!formData.leaderId || !formData.systemName || !formData.username || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

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

  const handleUpdate = () => {
    if (!selectedPassword) return;

    updateMutation.mutate({
      id: selectedPassword.id,
      systemName: formData.systemName || undefined,
      username: formData.username || undefined,
      password: formData.password || undefined,
      url: formData.url || undefined,
      notes: formData.notes || undefined,
      category: formData.category || undefined,
      expiresAt: formData.expiresAt || undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedPassword) return;
    deleteMutation.mutate({ id: selectedPassword.id });
  };

  const handleViewPassword = (passwordId: number) => {
    viewPasswordMutation.mutate({ id: passwordId });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(viewedPassword);
    toast.success("Senha copiada para a área de transferência!");
  };

  const handleGeneratePassword = async () => {
    const result = await generatePasswordQuery.refetch();
    if (result.data) {
      setFormData({ ...formData, password: result.data.password });
      toast.success("Senha gerada com sucesso!");
    }
  };

  const openEditDialog = (password: any) => {
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
    setShowEditDialog(true);
  };

  const openViewDialog = (password: any) => {
    setSelectedPassword(password);
    setViewedPassword("");
    setShowViewDialog(true);
  };

  const openDeleteDialog = (password: any) => {
    setSelectedPassword(password);
    setShowDeleteDialog(true);
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      sistema_rh: { label: "Sistema RH", variant: "default" },
      sistema_financeiro: { label: "Sistema Financeiro", variant: "secondary" },
      sistema_operacional: { label: "Sistema Operacional", variant: "outline" },
      portal_web: { label: "Portal Web", variant: "default" },
      outro: { label: "Outro", variant: "outline" },
    };

    const config = categoryMap[category] || { label: category, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPasswordStrengthIndicator = (password: string) => {
    if (!password) return null;
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isLongEnough = password.length >= 12;

    const strength = [hasUpper, hasLower, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;

    if (strength <= 2) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Fraca</Badge>;
    } else if (strength <= 4) {
      return <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" /> Média</Badge>;
    } else {
      return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Forte</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lock className="h-8 w-8" />
              Senhas de Líderes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciamento seguro de credenciais de sistemas para líderes
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Senha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Senha</DialogTitle>
                <DialogDescription>
                  Adicione uma nova credencial de sistema para um líder
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="leaderId">Líder *</Label>
                  <Select value={formData.leaderId} onValueChange={(value) => setFormData({ ...formData, leaderId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} - {emp.position || "Sem cargo"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemName">Nome do Sistema *</Label>
                  <Input
                    id="systemName"
                    placeholder="Ex: TOTVS, SAP, Portal RH"
                    value={formData.systemName}
                    onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
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
                  <Label htmlFor="username">Usuário/Login *</Label>
                  <Input
                    id="username"
                    placeholder="Nome de usuário ou email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      placeholder="Digite ou gere uma senha"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.password && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">Força:</span>
                      {getPasswordStrengthIndicator(formData.password)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL do Sistema</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://sistema.exemplo.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Data de Expiração</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre esta credencial"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Senha"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Senhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passwords.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Senhas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {passwords.filter((p: any) => p.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Senhas Expiradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {passwords.filter((p: any) => p.expiresAt && new Date(p.expiresAt) < new Date()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Líderes com Senhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(passwords.map((p: any) => p.leaderId)).size}
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sistema, usuário ou líder..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="sistema_rh">Sistema RH</SelectItem>
                    <SelectItem value="sistema_financeiro">Sistema Financeiro</SelectItem>
                    <SelectItem value="sistema_operacional">Sistema Operacional</SelectItem>
                    <SelectItem value="portal_web">Portal Web</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Líder</Label>
                <Select value={filterLeader} onValueChange={setFilterLeader}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Senhas Cadastradas</CardTitle>
            <CardDescription>
              {filteredPasswords.length} senha(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredPasswords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma senha encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Líder</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPasswords.map((password: any) => {
                    const employee = employees.find((e: any) => e.id === password.leaderId);
                    const isExpired = password.expiresAt && new Date(password.expiresAt) < new Date();

                    return (
                      <TableRow key={password.id}>
                        <TableCell className="font-medium">{password.systemName}</TableCell>
                        <TableCell>{employee?.name || "Desconhecido"}</TableCell>
                        <TableCell>{password.username}</TableCell>
                        <TableCell>{getCategoryBadge(password.category)}</TableCell>
                        <TableCell>
                          {password.isActive ? (
                            <Badge variant="default" className="gap-1">
                              <Unlock className="h-3 w-3" /> Ativa
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="h-3 w-3" /> Inativa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {password.expiresAt ? (
                            <span className={isExpired ? "text-red-600 font-medium" : ""}>
                              {format(new Date(password.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                              {isExpired && " (Expirada)"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Sem expiração</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewDialog(password)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(password)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(password)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Visualização */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Visualizar Senha</DialogTitle>
              <DialogDescription>
                Detalhes da credencial de {selectedPassword?.systemName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Sistema</Label>
                <p className="font-medium">{selectedPassword?.systemName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Usuário</Label>
                <p className="font-medium">{selectedPassword?.username}</p>
              </div>
              {selectedPassword?.url && (
                <div>
                  <Label className="text-muted-foreground">URL</Label>
                  <p className="font-medium break-all">{selectedPassword.url}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Senha</Label>
                {viewedPassword ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input type="text" value={viewedPassword} readOnly className="font-mono" />
                    <Button variant="outline" size="sm" onClick={handleCopyPassword}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full mt-1"
                    onClick={() => handleViewPassword(selectedPassword?.id)}
                    disabled={viewPasswordMutation.isPending}
                  >
                    {viewPasswordMutation.isPending ? (
                      "Descriptografando..."
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar Senha
                      </>
                    )}
                  </Button>
                )}
              </div>
              {selectedPassword?.notes && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="text-sm mt-1">{selectedPassword.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowViewDialog(false);
                setViewedPassword("");
              }}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Senha</DialogTitle>
              <DialogDescription>
                Atualize as informações da credencial
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-systemName">Nome do Sistema</Label>
                <Input
                  id="edit-systemName"
                  value={formData.systemName}
                  onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
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
                <Label htmlFor="edit-username">Usuário/Login</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter)</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-password"
                    type="text"
                    placeholder="Digite uma nova senha ou deixe em branco"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {formData.password && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">Força:</span>
                    {getPasswordStrengthIndicator(formData.password)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-url">URL do Sistema</Label>
                <Input
                  id="edit-url"
                  type="url"
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
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Exclusão */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir a senha de <strong>{selectedPassword?.systemName}</strong>?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
