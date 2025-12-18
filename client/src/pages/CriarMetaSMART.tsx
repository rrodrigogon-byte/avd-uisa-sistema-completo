import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { formatCurrency, parseCurrency, formatCurrencyInput } from "@/lib/currency";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Target,
} from "lucide-react";

/**
 * Wizard de Criação de Meta SMART
 * Validação em tempo real dos 5 critérios SMART
 */
export default function CriarMetaSMART() {
  const [, setLocation] = useLocation();
  // Toast já importado do sonner
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "individual" as "individual" | "team" | "organizational",
    goalType: "individual" as "individual" | "corporate",
    category: "development" as "financial" | "behavioral" | "corporate" | "development",
    measurementUnit: "",
    targetValue: "",
    weight: "10",
    startDate: "",
    endDate: "",
    bonusEligible: false,
    bonusPercentage: "",
    bonusAmount: "",
    cycleId: "",
    pdiPlanId: "",
    targetEmployeeId: "",
    departmentId: "",
  });

  // Buscar ciclos
  const { data: cycles = [] } = trpc.cyclesLegacy.list.useQuery();

  // Definir ciclo padrão quando os ciclos forem carregados
  useEffect(() => {
    if (cycles.length > 0 && !formData.cycleId) {
      // Selecionar o primeiro ciclo ativo ou o primeiro da lista
      const activeCycle = cycles.find((c: any) => c.status === 'ativo') || cycles[0];
      if (activeCycle) {
        setFormData(prev => ({ ...prev, cycleId: activeCycle.id.toString() }));
      }
    }
  }, [cycles]);

  // Buscar PDIs do colaborador
  const { data: pdis = [] } = trpc.pdi.list.useQuery({});

  // Buscar lista de funcionários (para admin/RH/gestores)
  const { data: employeesData } = trpc.employees.list.useQuery();
  const employees = employeesData?.employees || [];

  // Buscar dados do funcionário atual
  const { data: currentEmployee } = trpc.employees.me.useQuery();

  // Buscar lista de departamentos
  const { data: departments = [] } = trpc.departments.list.useQuery();

  // Validação SMART
  const [validation, setValidation] = useState<any>(null);
  const validateMutation = trpc.goals.validateSMART.useMutation();

  // Criar meta
  const createMutation = trpc.goals.createSMART.useMutation({
    onSuccess: (data) => {
      toast.success("Meta criada com sucesso!", {
        description: `Score SMART: ${data.validation.score}/100`,
      });
      setLocation("/metas");
    },
    onError: (error) => {
      toast.error("Erro ao criar meta", {
        description: error.message,
      });
    },
  });

  const handleValidate = async () => {
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      toast.error("Campos obrigatórios", {
        description: "Preencha título, descrição e datas",
      });
      return;
    }

    const result = await validateMutation.mutateAsync({
      title: formData.title,
      description: formData.description,
      measurementUnit: formData.measurementUnit,
      targetValueCents: formData.targetValue ? Math.round(parseFloat(formData.targetValue) * 100) : undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
    setValidation(result);
  };

  const handleSubmit = async () => {
    if (!formData.cycleId) {
      toast.error("Ciclo obrigatório", {
        description: "Selecione um ciclo de avaliação",
      });
      return;
    }

    // Validar bônus exclusivo
    if (formData.bonusEligible) {
      if (formData.bonusPercentage && formData.bonusAmount) {
        toast.error("Bônus inválido", {
          description: "Escolha apenas um tipo de bônus: percentual OU fixo",
        });
        return;
      }
      if (!formData.bonusPercentage && !formData.bonusAmount) {
        toast.error("Bônus obrigatório", {
          description: "Preencha o bônus percentual ou fixo",
        });
        return;
      }
    }

    // Validar colaborador/departamento baseado no tipo
    if (formData.type === "individual" && !formData.targetEmployeeId) {
      toast.error("Colaborador obrigatório", {
        description: "Selecione o colaborador responsável pela meta individual",
      });
      return;
    }
    
    if (formData.type === "team" && !formData.departmentId) {
      toast.error("Departamento obrigatório", {
        description: "Selecione o departamento responsável pela meta de equipe",
      });
      return;
    }

    // Preparar dados para envio
    const submitData: any = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      goalType: formData.goalType,
      category: formData.category,
      measurementUnit: formData.measurementUnit || undefined,
      targetValueCents: formData.targetValue ? Math.round(parseFloat(formData.targetValue) * 100) : undefined,
      weight: parseInt(formData.weight),
      startDate: formData.startDate,
      endDate: formData.endDate,
      bonusEligible: formData.bonusEligible,
      bonusPercentage: formData.bonusPercentage ? Math.round(parseFloat(formData.bonusPercentage)) : undefined,
      bonusAmountCents: formData.bonusAmount ? Math.round(parseFloat(formData.bonusAmount) * 100) : undefined,
      cycleId: formData.cycleId && formData.cycleId !== "" ? parseInt(formData.cycleId) : undefined,
      pdiPlanId: formData.pdiPlanId && formData.pdiPlanId !== "" && formData.pdiPlanId !== "none" ? parseInt(formData.pdiPlanId) : undefined,
    };

    // Validar que cycleId foi convertido corretamente
    if (!submitData.cycleId || isNaN(submitData.cycleId)) {
      toast.error("Ciclo inválido", {
        description: "Selecione um ciclo de avaliação válido",
      });
      return;
    }

    // Adicionar targetEmployeeId apenas se tipo for Individual
    if (formData.type === "individual" && formData.targetEmployeeId && formData.targetEmployeeId !== "") {
      const employeeId = parseInt(formData.targetEmployeeId);
      if (!isNaN(employeeId)) {
        submitData.targetEmployeeId = employeeId;
      }
    }

    // Adicionar departmentId apenas se tipo for Equipe
    if (formData.type === "team" && formData.departmentId && formData.departmentId !== "") {
      const deptId = parseInt(formData.departmentId);
      if (!isNaN(deptId)) {
        submitData.departmentId = deptId;
      }
    }

    await createMutation.mutateAsync(submitData);
  };

  const renderSMARTIndicator = (criterion: string, value: boolean | undefined) => {
    if (value === undefined) return null;
    return value ? (
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const smartScore = validation?.data
    ? [
        validation.data.isSpecific,
        validation.data.isMeasurable,
        validation.data.isAchievable,
        validation.data.isRelevant,
        validation.data.isTimeBound,
      ].filter(Boolean).length * 20
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <BackButton fallbackPath="/metas" className="mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Criar Nova Meta SMART</h1>
        <p className="text-gray-600 mt-1">
          Defina uma meta com critérios SMART para garantir clareza e atingibilidade
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Passo {step} de 3</span>
          <span className="text-sm text-gray-600">
            {step === 1 && "Informações Básicas"}
            {step === 2 && "Métricas e Datas"}
            {step === 3 && "Bônus e Vinculação"}
          </span>
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      {/* Step 1: Informações Básicas */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Defina o título, descrição e categoria da meta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Meta *</Label>
              <Input
                id="title"
                placeholder="Ex: Aumentar vendas em 20%"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
            </div>

            <div>
              <Label htmlFor="description">Descrição Detalhada *</Label>
              <Textarea
                id="description"
                placeholder="Descreva a meta com detalhes, incluindo o impacto esperado e a estratégia para atingi-la..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 50 caracteres. Use verbos de ação (aumentar, reduzir, melhorar, etc.)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de Meta</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="team">Equipe</SelectItem>
                    <SelectItem value="organizational">Organizacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goalType">Escopo da Meta</Label>
                <Select
                  value={formData.goalType}
                  onValueChange={(v: any) => setFormData({ ...formData, goalType: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual (aprovação do líder)</SelectItem>
                    <SelectItem value="corporate">Corporativa (aplica a todos)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Corporativas são criadas por RH/Admin e aplicam a todos os funcionários
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v: any) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financeira</SelectItem>
                    <SelectItem value="behavioral">Comportamental</SelectItem>
                    <SelectItem value="corporate">Corporativa</SelectItem>
                    <SelectItem value="development">Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="cycleId">Ciclo de Avaliação *</Label>
              <Select
                value={formData.cycleId}
                onValueChange={(v) => setFormData({ ...formData, cycleId: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o ciclo" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum ciclo disponível
                    </SelectItem>
                  ) : (
                    cycles.map((cycle: any) => (
                      <SelectItem key={cycle.id} value={cycle.id.toString()}>
                        {cycle.name} ({new Date(cycle.startDate).getFullYear()})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!formData.cycleId && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Campo obrigatório
                </p>
              )}
            </div>

            {/* Campo Colaborador - somente para tipo Individual */}
            {formData.type === "individual" && (
              <div>
                <Label htmlFor="targetEmployeeId">Colaborador *</Label>
                <Select
                  value={formData.targetEmployeeId}
                  onValueChange={(v) => setFormData({ ...formData, targetEmployeeId: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((emp: any) => emp.employee?.status === 'ativo' || emp.status === 'ativo')
                      .map((emp: any) => {
                        const employee = emp.employee || emp;
                        const position = emp.position?.title || employee.positionTitle || 'Sem cargo';
                        return (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.name} - {position}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecione o colaborador ativo que será responsável por esta meta
                </p>
              </div>
            )}

            {/* Campo Departamento - somente para tipo Equipe */}
            {formData.type === "team" && (
              <div>
                <Label htmlFor="departmentId">Departamento *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum departamento disponível
                      </SelectItem>
                    ) : (
                      departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!formData.departmentId && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Campo obrigatório para metas de equipe
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Selecione o departamento responsável por esta meta de equipe
                </p>
              </div>
            )}

            {/* Mensagem informativa para tipo Organizacional */}
            {formData.type === "organizational" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Meta Organizacional:</strong> Esta meta será aplicada automaticamente a todos os funcionários ativos da empresa.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} className="bg-[#F39200] hover:bg-[#d67e00]">
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Métricas e Datas */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas e Datas</CardTitle>
            <CardDescription>
              Defina como a meta será medida e o prazo para conclusão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="measurementUnit">Unidade de Medida</Label>
                <Input
                  id="measurementUnit"
                  placeholder="Ex: R$, %, unidades"
                  value={formData.measurementUnit}
                  onChange={(e) =>
                    setFormData({ ...formData, measurementUnit: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="targetValue">Valor Alvo</Label>
                <Input
                  id="targetValue"
                  type="number"
                  placeholder="Ex: 100"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="weight">Peso da Meta (1-100)</Label>
              <Input
                id="weight"
                type="number"
                min="1"
                max="100"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Peso usado para cálculo de bônus e performance
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Término *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Dica SMART</p>
                  <p className="text-sm text-blue-700 mt-1">
                    O prazo deve estar entre 1 mês e 24 meses para ser considerado temporal
                    (Time-bound)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="bg-[#F39200] hover:bg-[#d67e00]">
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Bônus e Vinculação */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bônus e Vinculação</CardTitle>
              <CardDescription>
                Configure elegibilidade para bônus e vincule com PDI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="bonusEligible" className="text-base font-medium">
                    Elegível para Bônus Financeiro
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Ativar se esta meta deve contar para cálculo de bônus
                  </p>
                </div>
                <Switch
                  id="bonusEligible"
                  checked={formData.bonusEligible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, bonusEligible: checked })
                  }
                />
              </div>

              {formData.bonusEligible && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    Escolha o tipo de bônus (apenas um):
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bonusPercentage">Bônus Percentual (%)</Label>
                      <Input
                        id="bonusPercentage"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 5.5"
                        value={formData.bonusPercentage}
                        onChange={(e) =>
                          setFormData({ 
                            ...formData, 
                            bonusPercentage: e.target.value,
                            bonusAmount: "" // Limpa o outro campo
                          })
                        }
                        disabled={!!formData.bonusAmount}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Percentual do salário
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="bonusAmount">Bônus Fixo</Label>
                      <Input
                        id="bonusAmount"
                        type="text"
                        placeholder="R$ 1.000,00"
                        value={formData.bonusAmount ? formatCurrency(parseFloat(formData.bonusAmount)) : ''}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          const numValue = parseCurrency(formatted);
                          setFormData({ 
                            ...formData, 
                            bonusAmount: numValue.toString(),
                            bonusPercentage: "" // Limpa o outro campo
                          });
                        }}
                        disabled={!!formData.bonusPercentage}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valor fixo em reais (R$)
                      </p>
                    </div>
                  </div>
                  {!formData.bonusPercentage && !formData.bonusAmount && (
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Preencha um dos campos de bônus
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="pdiPlanId">Vincular com PDI (Opcional)</Label>
                <Select
                  value={formData.pdiPlanId}
                  onValueChange={(v) => setFormData({ ...formData, pdiPlanId: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um PDI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {pdis.map((pdi: any) => (
                      <SelectItem key={pdi.id} value={pdi.id.toString()}>
                        {pdi.title || `PDI #${pdi.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Vincule esta meta com um Plano de Desenvolvimento Individual
                </p>
              </div>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={handleValidate}
                    variant="outline"
                    disabled={validateMutation.isPending}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {validateMutation.isPending ? "Validando..." : "Validar SMART"}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !formData.cycleId}
                    className="bg-[#F39200] hover:bg-[#d67e00]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? "Salvando..." : "Salvar Meta"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validação SMART */}
          {validation?.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Validação SMART</span>
                  <Badge
                    variant={smartScore >= 80 ? "default" : "destructive"}
                    className="text-lg px-4 py-1"
                  >
                    {smartScore}/100
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Sua meta atende {smartScore / 20} de 5 critérios SMART
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">S - Específica (Specific)</p>
                    <p className="text-sm text-gray-600">
                      A meta é clara e bem definida?
                    </p>
                  </div>
                  {renderSMARTIndicator("specific", validation.data.isSpecific)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">M - Mensurável (Measurable)</p>
                    <p className="text-sm text-gray-600">
                      Possui unidade de medida e valor alvo?
                    </p>
                  </div>
                  {renderSMARTIndicator("measurable", validation.data.isMeasurable)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">A - Atingível (Achievable)</p>
                    <p className="text-sm text-gray-600">
                      O valor alvo é realista?
                    </p>
                  </div>
                  {renderSMARTIndicator("achievable", validation.data.isAchievable)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">R - Relevante (Relevant)</p>
                    <p className="text-sm text-gray-600">
                      Demonstra impacto e alinhamento estratégico?
                    </p>
                  </div>
                  {renderSMARTIndicator("relevant", validation.data.isRelevant)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">T - Temporal (Time-bound)</p>
                    <p className="text-sm text-gray-600">
                      Tem prazo definido (1-24 meses)?
                    </p>
                  </div>
                  {renderSMARTIndicator("timebound", validation.data.isTimeBound)}
                </div>

                {validation.data.feedback.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="font-medium text-yellow-900 mb-2">Sugestões de Melhoria:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.feedback.map((feedback: string, i: number) => (
                        <li key={i} className="text-sm text-yellow-800">
                          {feedback}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="w-full bg-[#F39200] hover:bg-[#d67e00] mt-4"
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Salvando..." : "Criar Meta"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
