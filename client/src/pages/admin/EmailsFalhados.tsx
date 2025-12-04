import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Download,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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

/**
 * Página de gerenciamento de emails falhados
 * Permite visualizar e reenviar emails que falharam no envio
 */
export default function EmailsFalhados() {
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [emailToResend, setEmailToResend] = useState<number | null>(null);

  // Queries
  const { data: failedEmails, isLoading, refetch } = trpc.emailFailures.listFailedEmails.useQuery({
    limit: 100,
    type: filterType === "all" ? undefined : filterType,
  });

  const { data: stats } = trpc.emailFailures.getFailureStats.useQuery();

  // Mutations
  const resendMutation = trpc.emailFailures.resendEmail.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      refetch();
      setResendDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao reenviar: ${error.message}`);
    },
  });

  const resendBatchMutation = trpc.emailFailures.resendBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.successCount} emails reenviados com sucesso, ${data.failCount} falharam`);
      refetch();
      setSelectedEmails([]);
    },
    onError: (error) => {
      toast.error(`Erro ao reenviar lote: ${error.message}`);
    },
  });

  const handleResendSingle = (id: number) => {
    setEmailToResend(id);
    setResendDialogOpen(true);
  };

  const confirmResend = () => {
    if (emailToResend) {
      resendMutation.mutate({ id: emailToResend });
    }
  };

  const handleResendBatch = () => {
    if (selectedEmails.length === 0) {
      toast.error("Selecione pelo menos um email para reenviar");
      return;
    }
    resendBatchMutation.mutate({ ids: selectedEmails });
  };

  const toggleEmailSelection = (id: number) => {
    setSelectedEmails((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (filteredEmails) {
      setSelectedEmails(filteredEmails.map((e) => e.id));
    }
  };

  const deselectAll = () => {
    setSelectedEmails([]);
  };

  // Filtrar emails por busca
  const filteredEmails = failedEmails?.filter((email) => {
    const matchesSearch =
      searchTerm === "" ||
      email.toEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Tipos únicos para o filtro
  const emailTypes = Array.from(new Set(failedEmails?.map((e) => e.type) || []));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Emails Falhados</h1>
          <p className="text-gray-600 mt-1">
            Gerencie e reenvie emails que falharam no envio
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Emails Falhados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Emails Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.success}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.successRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Emails Falhados</CardTitle>
              <CardDescription>
                {filteredEmails?.length || 0} emails encontrados
              </CardDescription>
            </div>
            {selectedEmails.length > 0 && (
              <Button
                onClick={handleResendBatch}
                disabled={resendBatchMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reenviar Selecionados ({selectedEmails.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Busca e Filtros */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por email, assunto ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {emailTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ações de Seleção */}
          {filteredEmails && filteredEmails.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Selecionar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Desmarcar Todos
              </Button>
            </div>
          )}

          {/* Tabela de Emails */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">Carregando emails...</p>
            </div>
          ) : filteredEmails && filteredEmails.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmails.includes(email.id)}
                          onCheckedChange={() => toggleEmailSelection(email.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{email.toEmail}</TableCell>
                      <TableCell>{email.subject || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{email.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{email.attempts || 1}x</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(email.sentAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-red-600">
                          {email.error || "Erro desconhecido"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendSingle(email.id)}
                          disabled={resendMutation.isPending}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reenviar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum email falhado
              </h3>
              <p className="text-gray-600">
                Todos os emails foram enviados com sucesso!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Reenvio */}
      <Dialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reenvio</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja reenviar este email? Uma nova tentativa será
              registrada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResendDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmResend}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending ? "Reenviando..." : "Reenviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
