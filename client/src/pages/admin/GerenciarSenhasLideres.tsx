import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Users, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GerenciarSenhasLideres() {
  const [selectedLeader, setSelectedLeader] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Buscar todos os líderes (employees com subordinados)
  const { data: leaders, isLoading, refetch } = trpc.employees.getLeaders.useQuery();

  // Mutation para atualizar senha
  const updatePasswordMutation = trpc.employees.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso!");
      setIsDialogOpen(false);
      setPassword("");
      setConfirmPassword("");
      setSelectedLeader(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar senha");
    },
  });

  const handleOpenDialog = (leaderId: number) => {
    setSelectedLeader(leaderId);
    setPassword("");
    setConfirmPassword("");
    setIsDialogOpen(true);
  };

  const handleSavePassword = () => {
    if (!selectedLeader) return;

    // Validações
    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    // Validação de força de senha
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error("A senha deve conter letras maiúsculas, minúsculas e números");
      return;
    }

    updatePasswordMutation.mutate({
      employeeId: selectedLeader,
      password,
    });
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { label: "", color: "" };
    if (pwd.length < 8) return { label: "Fraca", color: "text-red-500" };
    
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;

    if (strength <= 2) return { label: "Média", color: "text-yellow-500" };
    if (strength === 3) return { label: "Boa", color: "text-blue-500" };
    return { label: "Forte", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando líderes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Gerenciar Senhas de Líderes
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure senhas para aprovação de consenso em Avaliações 360°
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Líderes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{leaders?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com Senha Cadastrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {leaders?.filter((l) => l.hasPassword).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sem Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">
                {leaders?.filter((l) => !l.hasPassword).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Líderes */}
      <Card>
        <CardHeader>
          <CardTitle>Líderes do Sistema</CardTitle>
          <CardDescription>
            Clique em "Definir Senha" para cadastrar ou atualizar a senha de aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaders && leaders.length > 0 ? (
              leaders.map((leader: any) => (
                <div
                  key={leader.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{leader.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {leader.position} • {leader.department}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {leader.subordinatesCount} subordinado(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {leader.hasPassword ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Senha Cadastrada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sem Senha
                      </Badge>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(leader.id)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {leader.hasPassword ? "Alterar Senha" : "Definir Senha"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum líder encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Definir Senha */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Senha de Aprovação</DialogTitle>
            <DialogDescription>
              Esta senha será usada pelo líder para aprovar consensos em Avaliações 360°
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              {password.length > 0 && (
                <p className={`text-sm ${passwordStrength.color}`}>
                  Força: {passwordStrength.label}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
              />
              {confirmPassword.length > 0 && (
                <p className={`text-sm ${password === confirmPassword ? "text-green-500" : "text-red-500"}`}>
                  {password === confirmPassword ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Requisitos:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Mínimo 8 caracteres</li>
                <li>• Pelo menos 1 letra maiúscula</li>
                <li>• Pelo menos 1 letra minúscula</li>
                <li>• Pelo menos 1 número</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePassword}
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? "Salvando..." : "Salvar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
