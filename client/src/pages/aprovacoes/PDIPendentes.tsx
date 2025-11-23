import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Calendar, User, AlertCircle, Search, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function PDIPendentes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Buscar PDIs pendentes de aprovação
  const { data: pdis, isLoading, refetch } = trpc.pdi.listPending.useQuery(
    { managerId: user?.id },
    { enabled: !!user?.id }
  );

  // Mutations
  const approvePDI = trpc.pdi.approve.useMutation({
    onSuccess: () => {
      toast.success("PDI aprovado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar PDI: ${error.message}`);
    },
  });

  const rejectPDI = trpc.pdi.reject.useMutation({
    onSuccess: () => {
      toast.success("PDI rejeitado");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar PDI: ${error.message}`);
    },
  });

  // Filtrar PDIs
  const filteredPDIs = pdis?.filter((pdi) => {
    const matchesSearch =
      pdi.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pdi.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || pdi.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (pdiId: number) => {
    if (confirm("Deseja aprovar este PDI?")) {
      approvePDI.mutate({ pdiId });
    }
  };

  const handleReject = (pdiId: number) => {
    const reason = prompt("Motivo da rejeição:");
    if (reason) {
      rejectPDI.mutate({ pdiId, reason });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PDIs Pendentes de Aprovação</h1>
        <p className="text-muted-foreground">
          Revise e aprove os Planos de Desenvolvimento Individual da sua equipe
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por funcionário ou título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredPDIs?.length || 0} PDI(s) encontrado(s)
            </Badge>
          </div>
        </div>
      </Card>

      {/* Lista de PDIs */}
      {filteredPDIs && filteredPDIs.length > 0 ? (
        <div className="grid gap-4">
          {filteredPDIs.map((pdi) => (
            <Card key={pdi.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{pdi.title || "PDI sem título"}</h3>
                    <Badge
                      variant={
                        pdi.status === "aprovado"
                          ? "default"
                          : pdi.status === "rejeitado"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {pdi.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{pdi.employeeName || "Funcionário não identificado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Criado em: {new Date(pdi.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {pdi.deadline && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Prazo: {new Date(pdi.deadline).toLocaleDateString("pt-BR")}</span>
                      </div>
                    )}
                  </div>

                  {pdi.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {pdi.description}
                    </p>
                  )}
                </div>

                {pdi.status === "pendente" && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(pdi.id)}
                      disabled={approvePDI.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(pdi.id)}
                      disabled={rejectPDI.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/pdi/${pdi.id}`)}
                >
                  Ver Detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum PDI pendente</h3>
          <p className="text-muted-foreground">
            Não há PDIs aguardando sua aprovação no momento.
          </p>
        </Card>
      )}

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => setLocation("/aprovacoes/dashboard")}>
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
}
