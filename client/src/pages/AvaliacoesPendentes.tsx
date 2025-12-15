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
import { ClipboardList, Calendar, User, AlertCircle, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function AvaliacoesPendentes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Buscar avaliações pendentes do usuário
  const { data: evaluations, isLoading } = trpc.evaluations.listPending.useQuery(
    { evaluatorId: user?.id },
    { enabled: !!user?.id }
  );

  // Filtrar avaliações
  const filteredEvaluations = evaluations?.filter((evaluation: any) => {
    const matchesSearch =
      searchTerm === "" ||
      evaluation.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.cycleName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" ||
      (filterType === "360" && evaluation.type === "360") ||
      (filterType === "performance" && evaluation.type === "performance") ||
      (filterType === "autoavaliacao" && evaluation.type === "autoavaliacao");

    return matchesSearch && matchesType;
  });

  const handleStartEvaluation = (evaluationId: number, type: string) => {
    if (type === "360") {
      setLocation(`/avaliacoes/gestor/${evaluationId}`);
    } else if (type === "autoavaliacao") {
      setLocation(`/avaliacoes/autoavaliacao/${evaluationId}`);
    } else {
      setLocation(`/avaliacoes/${evaluationId}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avaliações Pendentes</h1>
          <p className="text-gray-500 mt-1">
            Gerencie suas avaliações pendentes de colaboradores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            {filteredEvaluations?.length || 0} pendentes
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por colaborador ou ciclo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="360">Avaliação 360°</SelectItem>
              <SelectItem value="performance">Avaliação de Performance</SelectItem>
              <SelectItem value="autoavaliacao">Autoavaliação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Avaliações */}
      {isLoading ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Carregando avaliações...</p>
          </div>
        </Card>
      ) : filteredEvaluations && filteredEvaluations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvaluations.map((evaluation: any) => (
            <Card key={evaluation.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {evaluation.employeeName || "Colaborador"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {evaluation.positionTitle || "Cargo não informado"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <ClipboardList className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Tipo:</span>
                      <Badge variant="outline">
                        {evaluation.type === "360"
                          ? "360°"
                          : evaluation.type === "autoavaliacao"
                          ? "Autoavaliação"
                          : "Performance"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Ciclo:</span>
                      <span className="font-medium">
                        {evaluation.cycleName || "Ciclo 2025"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-600">Prazo:</span>
                      <span className="font-medium text-orange-600">
                        {evaluation.deadline
                          ? new Date(evaluation.deadline).toLocaleDateString("pt-BR")
                          : "Sem prazo"}
                      </span>
                    </div>
                  </div>

                  {evaluation.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {evaluation.description}
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleStartEvaluation(evaluation.id, evaluation.type)}
                  className="ml-4"
                >
                  Iniciar Avaliação
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <ClipboardList className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhuma avaliação pendente
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchTerm || filterType !== "all"
                ? "Nenhuma avaliação encontrada com os filtros aplicados."
                : "Você não possui avaliações pendentes no momento."}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
