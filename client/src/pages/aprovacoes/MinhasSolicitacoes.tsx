import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Plus, Eye } from "lucide-react";

/**
 * Minhas Solicitações
 * 
 * Features:
 * - Tabela interativa com histórico completo
 * - Filtros: Status, Tipo, Período
 * - Busca por texto
 * - Botão "Nova Solicitação"
 * - Visualização de detalhes
 */

export default function MinhasSolicitacoes() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - TODO: integrar com backend
  const requests = [
    {
      id: 1,
      type: "Férias",
      description: "Férias de 15 dias - Janeiro/2025",
      status: "aprovada",
      requestDate: "2024-12-10",
      responseDate: "2024-12-12",
      approver: "Carlos Mendes",
    },
    {
      id: 2,
      type: "Bônus",
      description: "Bônus por performance Q4/2024",
      status: "pendente",
      requestDate: "2025-01-05",
      responseDate: null,
      approver: "Ana Paula",
    },
    {
      id: 3,
      type: "Treinamento",
      description: "Curso de Liderança Estratégica",
      status: "aprovada",
      requestDate: "2024-11-20",
      responseDate: "2024-11-22",
      approver: "Roberto Silva",
    },
    {
      id: 4,
      type: "Promoção",
      description: "Promoção para Gerente Sênior",
      status: "em_analise",
      requestDate: "2024-12-15",
      responseDate: null,
      approver: "Diretoria",
    },
    {
      id: 5,
      type: "Ajuste Salarial",
      description: "Reajuste salarial anual",
      status: "rejeitada",
      requestDate: "2024-10-10",
      responseDate: "2024-10-15",
      approver: "RH",
    },
  ];

  // Filtrar solicitações
  const filteredRequests = requests.filter((req) => {
    if (statusFilter !== "todos" && req.status !== statusFilter) return false;
    if (typeFilter !== "todos" && req.type !== typeFilter) return false;
    if (searchQuery && !req.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovada":
        return <Badge className="bg-green-500">Aprovada</Badge>;
      case "rejeitada":
        return <Badge variant="destructive">Rejeitada</Badge>;
      case "pendente":
        return <Badge className="bg-orange-500">Pendente</Badge>;
      case "em_analise":
        return <Badge className="bg-blue-500">Em Análise</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
            <p className="text-muted-foreground">Histórico completo de solicitações</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar solicitação..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Férias">Férias</SelectItem>
                  <SelectItem value="Bônus">Bônus</SelectItem>
                  <SelectItem value="Treinamento">Treinamento</SelectItem>
                  <SelectItem value="Promoção">Promoção</SelectItem>
                  <SelectItem value="Ajuste Salarial">Ajuste Salarial</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setStatusFilter("todos");
                setTypeFilter("todos");
                setSearchQuery("");
              }}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Solicitações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico ({filteredRequests.length} solicitações)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{request.type}</Badge>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="font-semibold mb-1">{request.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Solicitado em: {new Date(request.requestDate).toLocaleDateString("pt-BR")}</span>
                      {request.responseDate && (
                        <span>
                          Respondido em: {new Date(request.responseDate).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      <span>Aprovador: {request.approver}</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma solicitação encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
