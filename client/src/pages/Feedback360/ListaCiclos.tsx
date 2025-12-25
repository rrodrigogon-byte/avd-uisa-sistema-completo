import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Users, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Página de Listagem de Ciclos de Feedback 360°
 * Exibe todos os ciclos criados com estatísticas e filtros
 */
export default function ListaCiclos() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: cycles, isLoading } = trpc.feedback360.listCycles.useQuery({
    status: statusFilter === "all" ? undefined : (statusFilter as any),
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Rascunho" },
      active: { variant: "default", label: "Ativo" },
      closed: { variant: "outline", label: "Encerrado" },
      archived: { variant: "destructive", label: "Arquivado" },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const isAdmin = user?.role === "admin" || user?.role === "rh";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback 360°</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie ciclos de avaliação 360 graus
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setLocation("/feedback360/criar")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ciclo
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Ciclos */}
      <Card>
        <CardHeader>
          <CardTitle>Ciclos de Feedback</CardTitle>
          <CardDescription>
            {cycles?.length || 0} ciclo(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : cycles && cycles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Participantes</TableHead>
                  <TableHead className="text-center">Conclusão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cycle.name}</p>
                        {cycle.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {cycle.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {formatDate(cycle.startDate)} -{" "}
                          {formatDate(cycle.endDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {cycle.completedParticipants || 0} /{" "}
                          {cycle.totalParticipants || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp
                          className={`h-4 w-4 ${
                            (cycle.completionRate || 0) >= 80
                              ? "text-green-600"
                              : (cycle.completionRate || 0) >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        />
                        <span className="font-medium">
                          {cycle.completionRate || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setLocation(`/feedback360/ciclo/${cycle.id}`)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                Nenhum ciclo encontrado
              </h3>
              <p className="text-muted-foreground mt-2">
                {isAdmin
                  ? "Crie seu primeiro ciclo de feedback 360°"
                  : "Aguarde a criação de ciclos pelo administrador"}
              </p>
              {isAdmin && (
                <Button
                  className="mt-4"
                  onClick={() => setLocation("/feedback360/criar")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Ciclo
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
