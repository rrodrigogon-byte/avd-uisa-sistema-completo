import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, DollarSign, Calculator, TrendingUp } from "lucide-react";

export default function Bonus() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null);

  // Queries
  const { data: policies, refetch } = trpc.bonus.list.useQuery();
  const { data: stats } = trpc.bonus.getStats.useQuery();
  const { data: positions } = trpc.positionsManagement.list.useQuery();

  // Mutations
  const createMutation = trpc.bonus.create.useMutation({
    onSuccess: () => {
      toast.success("Política de bônus criada com sucesso!");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar política: ${error.message}`);
    },
  });

  const deleteMutation = trpc.bonus.delete.useMutation({
    onSuccess: () => {
      toast.success("Política excluída com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir política: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    positionId: "",
    salaryMultiplier: "1.5",
    minMultiplier: "0.5",
    maxMultiplier: "2.0",
    minTenureMonths: "6",
    minGoalCompletionRate: "70",
    requiresGoalCompletion: true,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
    active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      positionId: formData.positionId ? parseInt(formData.positionId) : undefined,
      salaryMultiplier: parseFloat(formData.salaryMultiplier),
      minMultiplier: parseFloat(formData.minMultiplier),
      maxMultiplier: parseFloat(formData.maxMultiplier),
      minTenureMonths: parseInt(formData.minTenureMonths),
      minGoalCompletionRate: parseInt(formData.minGoalCompletionRate),
      requiresGoalCompletion: formData.requiresGoalCompletion,
      validFrom: new Date(formData.validFrom),
      validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
      active: formData.active,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta política de bônus?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Bônus</h1>
          <p className="text-gray-500 mt-1">
            Configure políticas de bônus por cargo com multiplicadores de salário
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSimulatorOpen} onOpenChange={setIsSimulatorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calculator className="w-4 h-4 mr-2" />
                Simulador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Simulador de Bônus</DialogTitle>
                <DialogDescription>
                  Simule o valor de bônus para um funcionário específico
                </DialogDescription>
              </DialogHeader>
              <SimulatorForm />
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Política
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Política de Bônus</DialogTitle>
                <DialogDescription>
                  Configure uma nova política de bônus por cargo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome e Descrição */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Política *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Bônus Anual 2025"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionId">Cargo (opcional)</Label>
                    <Select
                      value={formData.positionId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, positionId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os cargos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os cargos</SelectItem>
                        {positions?.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id.toString()}>
                            {pos.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descreva os critérios e objetivos desta política"
                    rows={3}
                  />
                </div>

                {/* Multiplicadores */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Multiplicadores de Salário</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="minMultiplier">Mínimo</Label>
                      <Input
                        id="minMultiplier"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.minMultiplier}
                        onChange={(e) =>
                          setFormData({ ...formData, minMultiplier: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ex: 0.5 = 50% do salário
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="salaryMultiplier">Padrão *</Label>
                      <Input
                        id="salaryMultiplier"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.salaryMultiplier}
                        onChange={(e) =>
                          setFormData({ ...formData, salaryMultiplier: e.target.value })
                        }
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ex: 1.5 = 150% do salário
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="maxMultiplier">Máximo</Label>
                      <Input
                        id="maxMultiplier"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.maxMultiplier}
                        onChange={(e) =>
                          setFormData({ ...formData, maxMultiplier: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ex: 2.0 = 200% do salário
                      </p>
                    </div>
                  </div>
                </div>

                {/* Critérios de Elegibilidade */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Critérios de Elegibilidade</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minTenureMonths">Tempo Mínimo (meses)</Label>
                      <Input
                        id="minTenureMonths"
                        type="number"
                        min="0"
                        value={formData.minTenureMonths}
                        onChange={(e) =>
                          setFormData({ ...formData, minTenureMonths: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="minGoalCompletionRate">
                        % Mínimo de Metas Atingidas
                      </Label>
                      <Input
                        id="minGoalCompletionRate"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.minGoalCompletionRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minGoalCompletionRate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Período de Vigência */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Período de Vigência</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="validFrom">Data Início *</Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) =>
                          setFormData({ ...formData, validFrom: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="validUntil">Data Fim (opcional)</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) =>
                          setFormData({ ...formData, validUntil: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar Política"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Políticas Ativas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.activePolicies || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de Cálculos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalCalculations || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valor Total Aprovado</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats?.totalBonusAmount || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de Políticas */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Políticas de Bônus</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Nome</th>
                <th className="text-left py-3 px-4">Cargo</th>
                <th className="text-left py-3 px-4">Multiplicador</th>
                <th className="text-left py-3 px-4">Elegibilidade</th>
                <th className="text-left py-3 px-4">Vigência</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {policies?.map((policy: any) => (
                <tr key={policy.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{policy.name}</p>
                      {policy.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {policy.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {policy.positionId ? (
                      <Badge variant="outline">Cargo Específico</Badge>
                    ) : (
                      <Badge variant="secondary">Todos</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">
                        {Number(policy.salaryMultiplier).toFixed(1)}x
                      </span>
                      <span className="text-xs text-gray-500">
                        ({Number(policy.minMultiplier).toFixed(1)}x -{" "}
                        {Number(policy.maxMultiplier).toFixed(1)}x)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <p>{policy.minTenureMonths || 0} meses</p>
                      <p className="text-gray-500">
                        {policy.minGoalCompletionRate || 0}% metas
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <p>
                        {new Date(policy.validFrom).toLocaleDateString("pt-BR")}
                      </p>
                      {policy.validUntil && (
                        <p className="text-gray-500">
                          até {new Date(policy.validUntil).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {policy.active ? (
                      <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: Implementar edição
                          toast.info("Edição em desenvolvimento");
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(policy.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!policies || policies.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma política de bônus cadastrada</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateOpen(true)}
              >
                Criar Primeira Política
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Componente do Simulador
function SimulatorForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [result, setResult] = useState<any>(null);

  const { data: policies } = trpc.bonus.list.useQuery({ active: true });
  const calculateMutation = trpc.bonus.calculateBonus.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("Cálculo realizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao calcular: ${error.message}`);
    },
  });

  const handleSimulate = () => {
    if (!employeeId || !policyId) {
      toast.error("Selecione um funcionário e uma política");
      return;
    }

    calculateMutation.mutate({
      employeeId: parseInt(employeeId),
      policyId: parseInt(policyId),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="employeeId">ID do Funcionário</Label>
        <Input
          id="employeeId"
          type="number"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="Ex: 1"
        />
      </div>

      <div>
        <Label htmlFor="policyId">Política de Bônus</Label>
        <Select value={policyId} onValueChange={setPolicyId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma política" />
          </SelectTrigger>
          <SelectContent>
            {policies?.map((policy: any) => (
              <SelectItem key={policy.id} value={policy.id.toString()}>
                {policy.name} ({Number(policy.salaryMultiplier).toFixed(1)}x)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSimulate} disabled={calculateMutation.isPending} className="w-full">
        {calculateMutation.isPending ? "Calculando..." : "Simular Bônus"}
      </Button>

      {result && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-3">Resultado da Simulação</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Elegível:</span>
              <Badge className={result.isEligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {result.isEligible ? "Sim" : "Não"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tempo de Casa:</span>
              <span className="font-medium">{result.tenureMonths} meses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa de Conclusão de Metas:</span>
              <span className="font-medium">{result.goalCompletionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Atende Requisito de Metas:</span>
              <Badge className={result.meetsGoalRequirement ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {result.meetsGoalRequirement ? "Sim" : "Não"}
              </Badge>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Valor do Bônus:</span>
                <span className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(result.bonusAmount)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
