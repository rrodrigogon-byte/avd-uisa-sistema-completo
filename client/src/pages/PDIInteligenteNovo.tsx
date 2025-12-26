import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Brain, Check, ChevronsUpDown, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import RecommendationsSection from "@/components/RecommendationsSection";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

/**
 * Página de Criação de PDI Inteligente
 * 
 * Wizard completo para criar novo PDI Inteligente com:
 * - Seleção de colaborador (Combobox com 2.889 funcionários)
 * - Seleção de posição-alvo
 * - Contexto estratégico e objetivos
 * - Duração (12, 18, 24, 36 meses)
 * - Análise automática de gaps após criação
 */

export default function PDIInteligenteNovo() {
  const [, setLocation] = useLocation();

  // Form state
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [targetPositionOpen, setTargetPositionOpen] = useState(false);
  const [selectedTargetPosition, setSelectedTargetPosition] = useState("");
  const [context, setContext] = useState("");
  const [objectives, setObjectives] = useState("");
  const [duration, setDuration] = useState("24");

  // Employee search with debounce
  const { employees, isLoading: employeesLoading, search: employeeSearch, setSearch: setEmployeeSearch } = useEmployeeSearch("", 300, { status: "ativo" });

  // Queries
  const { data: positions, isLoading: positionsLoading } = trpc.positions.list.useQuery(undefined);

  // Mutations
  const createPDI = trpc.pdiIntelligent.create.useMutation({
    onSuccess: (data) => {
      toast.success("PDI Inteligente criado com sucesso!");
      setLocation(`/pdi-inteligente/${data.planId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar PDI: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      toast.error("Selecione um colaborador");
      return;
    }
    if (!selectedTargetPosition) {
      toast.error("Selecione uma posição-alvo");
      return;
    }
    if (!context.trim()) {
      toast.error("Descreva o contexto estratégico");
      return;
    }
    if (!objectives.trim()) {
      toast.error("Descreva os objetivos de desenvolvimento");
      return;
    }

    // Buscar targetPositionId pelo título
    const targetPos = positions?.find((p: any) => p.title === selectedTargetPosition);
    if (!targetPos) {
      toast.error("Posição-alvo não encontrada");
      return;
    }

    createPDI.mutate({
      employeeId: selectedEmployeeId,
      cycleId: 1, // TODO: Pegar ciclo atual
      targetPositionId: targetPos.id,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + parseInt(duration) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      strategicContext: context.trim(),
      durationMonths: parseInt(duration),
    });
  };

  const selectedEmployee = (employees && Array.isArray(employees)) 
    ? employees.find((e: any) => e?.employee?.id === selectedEmployeeId)?.employee 
    : undefined;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/pdi">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Criar PDI Inteligente</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              O sistema analisará automaticamente os gaps de competências e sugerirá ações de desenvolvimento
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do PDI</CardTitle>
              <CardDescription>
                Preencha os dados para criar um novo Plano de Desenvolvimento Individual Inteligente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor de Colaborador */}
              <div className="space-y-2">
                <Label>Colaborador *</Label>
                <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeeOpen}
                      className="w-full justify-between"
                      disabled={employeesLoading}
                    >
                      {employeesLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Carregando funcionários...
                        </>
                      ) : selectedEmployee ? (
                        <div className="flex items-center gap-2 flex-1 text-left">
                          <div>
                            <p className="font-medium">{selectedEmployee.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Colaborador selecionado
                            </p>
                          </div>
                        </div>
                      ) : (
                        "Selecione um colaborador..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar colaborador..." 
                        value={employeeSearch}
                        onValueChange={setEmployeeSearch}
                      />
                      <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {(employees && Array.isArray(employees)) ? (
                          employees.map((item: any) => {
                            if (!item?.employee) return null;
                            const employee = item.employee;
                            return (
                              <CommandItem
                                key={employee.id}
                                value={`${employee.name} ${item.position?.title || ''} ${item.department?.name || ''}`}
                                onSelect={() => {
                                  setSelectedEmployeeId(employee.id);
                                  setEmployeeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div>
                                  <p className="font-medium">{employee.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.position?.title || "Sem cargo"} - {item.department?.name || "Sem departamento"}
                                  </p>
                                </div>
                              </CommandItem>
                            );
                          })
                        ) : (
                          <CommandEmpty>Nenhum colaborador encontrado</CommandEmpty>
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Selecione o colaborador que receberá o PDI Inteligente
                </p>
              </div>

              {/* Recomendações Inteligentes */}
              {selectedEmployeeId && (
                <RecommendationsSection employeeId={selectedEmployeeId} />
              )}

              {/* Posição-Alvo */}
              <div className="space-y-2">
                <Label>Posição-Alvo *</Label>
                <Popover open={targetPositionOpen} onOpenChange={setTargetPositionOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={targetPositionOpen}
                      className="w-full justify-between"
                      disabled={positionsLoading}
                    >
                      {positionsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Carregando posições...
                        </>
                      ) : selectedTargetPosition ? (
                        selectedTargetPosition
                      ) : (
                        "Selecione uma posição-alvo..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar posição..." />
                      <CommandEmpty>Nenhuma posição encontrada.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {positions?.map((position: any) => (
                          <CommandItem
                            key={position.id}
                            value={position.title}
                            onSelect={() => {
                              setSelectedTargetPosition(position.title);
                              setTargetPositionOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedTargetPosition === position.title ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {position.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Posição estratégica que o colaborador está sendo preparado para assumir
                </p>
              </div>

              {/* Contexto Estratégico */}
              <div className="space-y-2">
                <Label>Contexto e Desafio Estratégico *</Label>
                <Textarea
                  placeholder="Descreva o contexto estratégico, desafios e importância deste desenvolvimento para a organização..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: "Preparação para sucessão do Diretor Comercial em função de aposentadoria prevista para 2026. Posição crítica para expansão regional."
                </p>
              </div>

              {/* Objetivos de Desenvolvimento */}
              <div className="space-y-2">
                <Label>Objetivos de Desenvolvimento *</Label>
                <Textarea
                  placeholder="Descreva os principais objetivos e metas de desenvolvimento para este PDI..."
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: "Desenvolver competências de liderança estratégica, gestão de equipes regionais e visão de negócios."
                </p>
              </div>

              {/* Duração */}
              <div className="space-y-2">
                <Label>Duração do PDI *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 meses (1 ano)</SelectItem>
                    <SelectItem value="18">18 meses (1,5 anos)</SelectItem>
                    <SelectItem value="24">24 meses (2 anos) - Recomendado</SelectItem>
                    <SelectItem value="36">36 meses (3 anos)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tempo estimado para completar o desenvolvimento (modelo Nadia recomenda 24 meses)
                </p>
              </div>

              {/* Informações Adicionais */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  Análise Inteligente Automática
                </h4>
                <p className="text-sm text-muted-foreground">
                  Após a criação, o sistema irá:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Comparar o perfil atual do colaborador com a posição-alvo</li>
                  <li>Analisar testes psicométricos (DISC, Big Five, MBTI, IE)</li>
                  <li>Identificar gaps de competências automaticamente</li>
                  <li>Sugerir ações de desenvolvimento baseadas no modelo 70-20-10</li>
                  <li>Calcular prontidão e riscos do plano de sucessão</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link href="/pdi">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={createPDI.isPending}>
              {createPDI.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando PDI...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Criar PDI Inteligente
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
