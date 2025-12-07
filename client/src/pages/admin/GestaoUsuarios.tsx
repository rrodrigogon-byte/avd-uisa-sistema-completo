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
import { Mail, Shield, User, Users } from "lucide-react";
import { toast } from "sonner";

export default function GestaoUsuarios() {
  const { user, loading: authLoading } = useAuth();
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();

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

  const handleSendCredentials = (userEmail: string) => {
    toast.info("Funcionalidade em desenvolvimento", {
      description: "O envio de credenciais será implementado em breve.",
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
          <Button>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendCredentials(u.email || "")}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Credenciais
                          </Button>
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
    </DashboardLayout>
  );
}
