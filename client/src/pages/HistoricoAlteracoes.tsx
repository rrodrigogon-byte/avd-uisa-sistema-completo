import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  History, 
  Briefcase, 
  Building2, 
  DollarSign, 
  User, 
  UserCheck, 
  FileText, 
  UserPlus, 
  UserMinus, 
  TrendingUp, 
  ArrowRightLeft,
  Calendar,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHANGE_TYPE_ICONS: Record<string, any> = {
  cargo: Briefcase,
  departamento: Building2,
  salario: DollarSign,
  gestor: User,
  status: UserCheck,
  dados_pessoais: FileText,
  contratacao: UserPlus,
  desligamento: UserMinus,
  promocao: TrendingUp,
  transferencia: ArrowRightLeft,
  outro: FileText,
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  cargo: "Mudança de Cargo",
  departamento: "Mudança de Departamento",
  salario: "Alteração Salarial",
  gestor: "Mudança de Gestor",
  status: "Alteração de Status",
  dados_pessoais: "Dados Pessoais",
  contratacao: "Contratação",
  desligamento: "Desligamento",
  promocao: "Promoção",
  transferencia: "Transferência",
  outro: "Outra Alteração",
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  cargo: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  departamento: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  salario: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  gestor: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  status: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  dados_pessoais: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  contratacao: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  desligamento: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  promocao: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  transferencia: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  outro: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

/**
 * Página de Histórico de Alterações de Funcionários
 * Exibe timeline visual de todas as mudanças
 */
export default function HistoricoAlteracoes() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChange, setSelectedChange] = useState<any>(null);

  // Buscar funcionários para seleção
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.list.useQuery({
    page: 1,
    limit: 1000,
    search: searchTerm,
  });

  // Buscar histórico do funcionário selecionado
  const { data: history, isLoading: loadingHistory } = trpc.employeeHistory.getEmployeeHistory.useQuery(
    {
      employeeId: selectedEmployeeId!,
      changeType: changeTypeFilter !== "all" ? (changeTypeFilter as any) : undefined,
    },
    { enabled: !!selectedEmployeeId }
  );

  // Buscar estatísticas
  const { data: stats } = trpc.employeeHistory.getHistoryStats.useQuery(
    { employeeId: selectedEmployeeId! },
    { enabled: !!selectedEmployeeId }
  );

  const getChangeIcon = (changeType: string) => {
    const Icon = CHANGE_TYPE_ICONS[changeType] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container py-8 space-y-8">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <History className="h-10 w-10 text-blue-500" />
            Histórico de Alterações
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Visualize todas as mudanças de cargo, departamento e salário dos funcionários
          </p>
        </div>

        {/* Seleção de Funcionário */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Funcionário</CardTitle>
            <CardDescription>Escolha um funcionário para ver seu histórico completo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar funcionário por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
                <SelectTrigger className="w-64">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="cargo">Cargo</SelectItem>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="salario">Salário</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="promocao">Promoção</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingEmployees ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {employees?.employees.map((emp) => (
                  <Button
                    key={emp.id}
                    variant={selectedEmployeeId === emp.id ? "default" : "outline"}
                    className="justify-start h-auto py-3"
                    onClick={() => setSelectedEmployeeId(emp.id)}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{emp.name}</div>
                      <div className="text-xs opacity-70">{emp.employeeCode}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {selectedEmployeeId && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            {stats.byType.slice(0, 3).map((item) => (
              <Card key={item.type}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {CHANGE_TYPE_LABELS[item.type]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{item.count}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Timeline de Alterações */}
        {selectedEmployeeId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Linha do Tempo
              </CardTitle>
              <CardDescription>
                Histórico completo de alterações em ordem cronológica
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : history && history.length > 0 ? (
                <div className="relative">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

                  <div className="space-y-6">
                    {history.map((change, index) => {
                      const Icon = CHANGE_TYPE_ICONS[change.changeType] || FileText;
                      
                      return (
                        <div key={change.id} className="relative pl-16">
                          {/* Ícone na timeline */}
                          <div
                            className={`absolute left-3 w-6 h-6 rounded-full flex items-center justify-center ${
                              CHANGE_TYPE_COLORS[change.changeType]
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                          </div>

                          {/* Card da alteração */}
                          <Card
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedChange(change)}
                          >
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={CHANGE_TYPE_COLORS[change.changeType]}>
                                    {CHANGE_TYPE_LABELS[change.changeType]}
                                  </Badge>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {format(new Date(change.changedAt), "dd/MM/yyyy 'às' HH:mm", {
                                      locale: ptBR,
                                    })}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-semibold">{change.fieldName}:</span>
                                  {change.oldValue && (
                                    <>
                                      <span className="text-red-600 line-through">
                                        {change.oldValue}
                                      </span>
                                      <span>→</span>
                                    </>
                                  )}
                                  <span className="text-green-600 font-semibold">
                                    {change.newValue || "N/A"}
                                  </span>
                                </div>

                                {change.reason && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    <strong>Motivo:</strong> {change.reason}
                                  </p>
                                )}

                                <p className="text-xs text-slate-500">
                                  Alterado por: {change.changedByName || "Sistema"}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma alteração registrada para este funcionário</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedEmployeeId && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">
                Selecione um funcionário acima para visualizar seu histórico de alterações
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedChange} onOpenChange={() => setSelectedChange(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedChange && getChangeIcon(selectedChange.changeType)}
              Detalhes da Alteração
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre esta mudança
            </DialogDescription>
          </DialogHeader>

          {selectedChange && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Tipo de Alteração
                  </label>
                  <Badge className={`mt-1 ${CHANGE_TYPE_COLORS[selectedChange.changeType]}`}>
                    {CHANGE_TYPE_LABELS[selectedChange.changeType]}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Data e Hora
                  </label>
                  <p className="mt-1">
                    {format(new Date(selectedChange.changedAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Campo Alterado
                </label>
                <p className="mt-1 font-mono text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  {selectedChange.fieldName}
                </p>
              </div>

              {selectedChange.oldValue && (
                <div>
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Valor Anterior
                  </label>
                  <p className="mt-1 text-red-600 line-through">{selectedChange.oldValue}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Novo Valor
                </label>
                <p className="mt-1 text-green-600 font-semibold">
                  {selectedChange.newValue || "N/A"}
                </p>
              </div>

              {selectedChange.reason && (
                <div>
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Motivo
                  </label>
                  <p className="mt-1">{selectedChange.reason}</p>
                </div>
              )}

              {selectedChange.notes && (
                <div>
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Observações
                  </label>
                  <p className="mt-1">{selectedChange.notes}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Alterado Por
                </label>
                <p className="mt-1">
                  {selectedChange.changedByName || "Sistema"} ({selectedChange.changedByEmail || "N/A"})
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
