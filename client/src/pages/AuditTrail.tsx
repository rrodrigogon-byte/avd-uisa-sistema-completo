import { useState } from "react";
import { Download, Filter, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AuditTrail() {
  const [filters, setFilters] = useState({
    action: "all",
    entity: "all",
    userId: undefined as number | undefined,
  });
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<number | null>(null);
  const pageSize = 50;

  // Buscar logs com filtros
  const { data, isLoading } = trpc.auditTrail.getLogs.useQuery({
    ...filters,
    limit: pageSize,
    offset: page * pageSize,
  });

  // Buscar detalhes de um log
  const { data: logDetails } = trpc.auditTrail.getLogDetails.useQuery(
    { id: selectedLog! },
    { enabled: selectedLog !== null }
  );

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error("Nenhum log para exportar");
      return;
    }

    // Criar CSV
    const headers = ["ID", "Usuário", "Ação", "Entidade", "Entidade ID", "Data", "IP"];
    const rows = logs.map((log) => [
      log.id,
      log.userId || "Sistema",
      log.action,
      log.entity,
      log.entityId || "-",
      format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      log.ipAddress || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-trail-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("CSV exportado com sucesso!");
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      create: "default",
      update: "secondary",
      delete: "destructive",
      login: "outline",
    };
    return variants[action.toLowerCase()] || "outline";
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Alterações</h1>
          <p className="text-muted-foreground">
            Registro completo de todas as ações realizadas no sistema
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={logs.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>Filtre os logs por ação, entidade ou usuário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ação</label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="create">Criar</SelectItem>
                  <SelectItem value="update">Atualizar</SelectItem>
                  <SelectItem value="delete">Excluir</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Entidade</label>
              <Select
                value={filters.entity}
                onValueChange={(value) => setFilters({ ...filters, entity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="goal">Metas</SelectItem>
                  <SelectItem value="evaluation">Avaliações</SelectItem>
                  <SelectItem value="pdi">PDI</SelectItem>
                  <SelectItem value="employee">Colaboradores</SelectItem>
                  <SelectItem value="user">Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">ID do Usuário</label>
              <Input
                type="number"
                placeholder="Digite o ID do usuário"
                value={filters.userId || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    userId: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ action: "all", entity: "all", userId: undefined });
                setPage(0);
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>
            {total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado com os filtros aplicados
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Entidade ID</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.id}</TableCell>
                      <TableCell>{log.userId || "Sistema"}</TableCell>
                      <TableCell>
                        <Badge variant={getActionBadge(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell>{log.entityId || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log #{selectedLog}</DialogTitle>
            <DialogDescription>Informações completas sobre esta alteração</DialogDescription>
          </DialogHeader>
          {logDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuário</p>
                  <p className="text-sm">{logDetails.userId || "Sistema"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ação</p>
                  <Badge variant={getActionBadge(logDetails.action)}>{logDetails.action}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entidade</p>
                  <p className="text-sm">{logDetails.entity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID da Entidade</p>
                  <p className="text-sm">{logDetails.entityId || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                  <p className="text-sm">
                    {format(new Date(logDetails.createdAt), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Endereço IP</p>
                  <p className="text-sm font-mono">{logDetails.ipAddress || "-"}</p>
                </div>
              </div>

              {logDetails.userAgent && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">User Agent</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded">{logDetails.userAgent}</p>
                </div>
              )}

              {logDetails.changes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Mudanças</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(JSON.parse(logDetails.changes), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
