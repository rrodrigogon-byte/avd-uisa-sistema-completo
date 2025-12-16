import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Search, Filter, Download, AlertCircle, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ActionType = "all" | "criar" | "editar" | "deletar" | "visualizar" | "exportar" | "login" | "logout";
type EntityType = "all" | "funcionario" | "avaliacao" | "competencia" | "pdi" | "meta" | "usuario";

export default function AuditoriaCompleta() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionType>("all");
  const [entityFilter, setEntityFilter] = useState<EntityType>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Buscar logs de auditoria
  const { data: auditLogs, isLoading, refetch } = trpc.audit.list.useQuery(
    {
      search: searchTerm || undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      entity: entityFilter !== "all" ? entityFilter : undefined,
      userId: userFilter !== "all" ? parseInt(userFilter) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    {
      enabled: user?.role === "admin",
    }
  );

  // Buscar usuários para filtro
  const { data: users } = trpc.users.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Mutation para exportar logs
  const exportMutation = trpc.audit.export.useMutation({
    onSuccess: (data) => {
      toast.success("Logs exportados com sucesso!");
      // Aqui você faria o download do arquivo
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      toast.info(`Arquivo gerado: ${filename}`);
    },
    onError: (error) => {
      toast.error(`Erro ao exportar: ${error.message}`);
    },
  });

  const handleExport = () => {
    exportMutation.mutate({
      action: actionFilter !== "all" ? actionFilter : undefined,
      entity: entityFilter !== "all" ? entityFilter : undefined,
      userId: userFilter !== "all" ? parseInt(userFilter) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem acessar os logs de auditoria.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Auditoria do Sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize e analise todos os eventos e ações realizadas no sistema
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {auditLogs?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Criações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {auditLogs?.filter((log: any) => log.action === "criar").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Novos registros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Edições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {auditLogs?.filter((log: any) => log.action === "editar").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Modificações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Exclusões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {auditLogs?.filter((log: any) => log.action === "deletar").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registros removidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros Avançados</CardTitle>
            <CardDescription>
              Filtre os logs de auditoria por diferentes critérios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action-filter">Ação</Label>
                <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as ActionType)}>
                  <SelectTrigger id="action-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="criar">Criar</SelectItem>
                    <SelectItem value="editar">Editar</SelectItem>
                    <SelectItem value="deletar">Deletar</SelectItem>
                    <SelectItem value="visualizar">Visualizar</SelectItem>
                    <SelectItem value="exportar">Exportar</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity-filter">Entidade</Label>
                <Select value={entityFilter} onValueChange={(value) => setEntityFilter(value as EntityType)}>
                  <SelectTrigger id="entity-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todas as entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as entidades</SelectItem>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="avaliacao">Avaliação</SelectItem>
                    <SelectItem value="competencia">Competência</SelectItem>
                    <SelectItem value="pdi">PDI</SelectItem>
                    <SelectItem value="meta">Meta</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-filter">Usuário</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger id="user-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {users?.map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-from">Data Inicial</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">Data Final</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Logs
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Auditoria</CardTitle>
            <CardDescription>
              Histórico completo de ações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum log de auditoria encontrado</p>
                <p className="text-xs mt-1">Os logs aparecerão aqui conforme as ações forem realizadas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {log.createdAt
                            ? format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.userName || log.userEmail}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.action === "criar"
                                ? "default"
                                : log.action === "editar"
                                ? "secondary"
                                : log.action === "deletar"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.entity}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.description}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.ipAddress || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
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
