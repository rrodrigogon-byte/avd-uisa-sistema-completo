import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Users,
  Search,
  Building2,
  Mail,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Filter,
  CheckSquare,
  Square,
  Info,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

/**
 * Página de Avaliação em Lote
 * 
 * Permite que líderes iniciem avaliações para múltiplos subordinados simultaneamente
 */

export default function AvaliacaoEmLote() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Buscar ciclos ativos
  const { data: cycles, isLoading: loadingCycles } = trpc.avdUisa.listCycles.useQuery({
    status: "ativo",
  });

  // Buscar subordinados disponíveis para avaliação
  const { data: subordinatesData, isLoading: loadingSubordinates, refetch } = trpc.avdUisa.getSubordinatesForBatchEvaluation.useQuery(
    { cycleId: selectedCycleId || 0 },
    { enabled: !!selectedCycleId }
  );

  // Mutation para iniciar avaliações em lote
  const startBatchMutation = trpc.avdUisa.startBatchEvaluations.useMutation({
    onSuccess: (data) => {
      toast.success(`Avaliações iniciadas com sucesso!`, {
        description: `${data.created} criadas, ${data.skipped} já existentes`,
      });
      setSelectedEmployees(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao iniciar avaliações", {
        description: error.message,
      });
    },
  });

  // Filtrar subordinados
  const filteredSubordinates = useMemo(() => {
    if (!subordinatesData?.subordinates) return [];
    
    return subordinatesData.subordinates.filter(sub => {
      const matchesSearch = !searchQuery || 
        sub.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.employeeEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.employeeChapa?.includes(searchQuery) ||
        sub.employeeFunction?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSection = selectedSection === "all" || 
        sub.employeeSection === selectedSection;
      
      return matchesSearch && matchesSection;
    });
  }, [subordinatesData?.subordinates, searchQuery, selectedSection]);

  // Obter seções únicas
  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    subordinatesData?.subordinates?.forEach(s => s.employeeSection && sections.add(s.employeeSection));
    return Array.from(sections).sort();
  }, [subordinatesData?.subordinates]);

  // Verificar se subordinado já tem avaliação
  const hasExistingEvaluation = (employeeId: number | null) => {
    if (!employeeId) return false;
    return subordinatesData?.hasExistingEvaluations?.includes(employeeId) || false;
  };

  // Subordinados disponíveis (sem avaliação existente)
  const availableSubordinates = filteredSubordinates.filter(
    s => s.employeeTableId && !hasExistingEvaluation(s.employeeTableId)
  );

  // Toggle seleção individual
  const toggleEmployee = (employeeId: number) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  // Selecionar/Desselecionar todos
  const toggleAll = () => {
    if (selectedEmployees.size === availableSubordinates.length) {
      setSelectedEmployees(new Set());
    } else {
      const allIds = availableSubordinates
        .filter(s => s.employeeTableId)
        .map(s => s.employeeTableId as number);
      setSelectedEmployees(new Set(allIds));
    }
  };

  // Iniciar avaliações
  const handleStartBatch = async () => {
    if (!selectedCycleId || selectedEmployees.size === 0) {
      toast.error("Selecione um ciclo e pelo menos um funcionário");
      return;
    }

    setIsProcessing(true);
    try {
      await startBatchMutation.mutateAsync({
        cycleId: selectedCycleId,
        employeeIds: Array.from(selectedEmployees),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (loadingCycles) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PlayCircle className="h-7 w-7 text-primary" />
              Avaliação em Lote
            </h1>
            <p className="text-muted-foreground mt-1">
              Inicie avaliações para múltiplos subordinados simultaneamente
            </p>
          </div>
        </div>

        {/* Seleção de Ciclo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione o Ciclo de Avaliação</CardTitle>
            <CardDescription>
              Escolha o ciclo ativo para iniciar as avaliações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCycleId?.toString() || ""}
              onValueChange={(value) => {
                setSelectedCycleId(Number(value));
                setSelectedEmployees(new Set());
              }}
            >
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Selecione um ciclo de avaliação" />
              </SelectTrigger>
              <SelectContent>
                {cycles?.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.name} ({cycle.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {cycles?.length === 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Nenhum ciclo ativo</AlertTitle>
                <AlertDescription>
                  Não há ciclos de avaliação ativos no momento. Entre em contato com o RH.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Lista de Subordinados */}
        {selectedCycleId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Subordinados Disponíveis
                    <Badge variant="secondary" className="ml-2">
                      {availableSubordinates.length} disponíveis
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Selecione os funcionários para iniciar suas avaliações
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="py-1 px-3">
                    {selectedEmployees.size} selecionados
                  </Badge>
                  <Button
                    variant="default"
                    disabled={selectedEmployees.size === 0 || isProcessing}
                    onClick={handleStartBatch}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Iniciar Avaliações ({selectedEmployees.size})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email, chapa ou função..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full md:w-[250px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por seção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as seções</SelectItem>
                    {uniqueSections.map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingSubordinates ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : filteredSubordinates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum subordinado encontrado</p>
                  <p className="text-sm mt-2">
                    Você não possui subordinados cadastrados na hierarquia ou todos já possuem avaliação neste ciclo.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEmployees.size === availableSubordinates.length && availableSubordinates.length > 0}
                          onCheckedChange={toggleAll}
                          disabled={availableSubordinates.length === 0}
                        />
                      </TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Chapa</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Seção</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubordinates.map((sub) => {
                      const hasEvaluation = hasExistingEvaluation(sub.employeeTableId);
                      const isSelected = sub.employeeTableId ? selectedEmployees.has(sub.employeeTableId) : false;
                      
                      return (
                        <TableRow 
                          key={sub.id} 
                          className={hasEvaluation ? "opacity-60" : "cursor-pointer hover:bg-muted/50"}
                          onClick={() => !hasEvaluation && sub.employeeTableId && toggleEmployee(sub.employeeTableId)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              disabled={hasEvaluation || !sub.employeeTableId}
                              onCheckedChange={() => sub.employeeTableId && toggleEmployee(sub.employeeTableId)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(sub.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium">{sub.employeeName}</span>
                                {sub.employeeEmail && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {sub.employeeEmail}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.employeeChapa}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.employeeFunction}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {sub.employeeSection}
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasEvaluation ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Já possui avaliação
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                                <Info className="h-3 w-3 mr-1" />
                                Disponível
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumo da Seleção */}
        {selectedEmployees.size > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckSquare className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">
                      {selectedEmployees.size} funcionário(s) selecionado(s)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Iniciar Avaliações" para criar as avaliações em lote
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  disabled={isProcessing}
                  onClick={handleStartBatch}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Iniciar Avaliações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
