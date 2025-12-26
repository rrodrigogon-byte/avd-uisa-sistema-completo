import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import PsychometricResultsCard from "@/components/PsychometricResultsCard";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";

/**
 * Página de Criação de PDI (Plano de Desenvolvimento Individual)
 * Formulário completo com objetivos, ações 70-20-10, prazos e competências
 */

export default function CriarPDI() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const employeeId = parseInt(searchParams.get("employeeId") || "0");

  // Estado do formulário
  const [formData, setFormData] = useState({
    targetPositionId: "",
    startDate: "",
    endDate: "",
    objectives: "",
  });

  const [actions, setActions] = useState<Array<{
    title: string;
    description: string;
    category: "70_pratica" | "20_mentoria" | "10_curso";
    duration: string;
    deadline: string;
  }>>([
    {
      title: "",
      description: "",
      category: "70_pratica",
      duration: "",
      deadline: "",
    },
  ]);

  // Queries
  const { data: employee } = trpc.employees.getById.useQuery({ id: employeeId });
  const { data: positions } = trpc.positions.list.useQuery({});
  const { data: cycles } = trpc.cycles.list.useQuery({});

  // Mutations
  const createPDI = trpc.pdi.create.useMutation({
    onSuccess: () => {
      toast.success("PDI criado com sucesso!");
      navigate(`/funcionarios/${employeeId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar PDI: ${error.message}`);
    },
  });

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        title: "",
        description: "",
        category: "70_pratica",
        duration: "",
        deadline: "",
      },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.startDate || !formData.endDate) {
      toast.error("Preencha as datas de início e término");
      return;
    }

    if (!formData.objectives || formData.objectives.length < 20) {
      toast.error("Descreva os objetivos de desenvolvimento (mínimo 20 caracteres)");
      return;
    }

    if (actions.length === 0 || !actions[0].title) {
      toast.error("Adicione pelo menos uma ação de desenvolvimento");
      return;
    }

    // Buscar ciclo ativo
    const activeCycle = cycles?.find((c: any) => c.status === "ativo");
    if (!activeCycle) {
      toast.error("Nenhum ciclo de avaliação ativo encontrado");
      return;
    }

    createPDI.mutate({
      cycleId: activeCycle.id,
      employeeId,
      targetPositionId: formData.targetPositionId ? parseInt(formData.targetPositionId) : undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      objectives: formData.objectives,
      actions: actions.filter((a) => a.title && a.description),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/funcionarios/${employeeId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Criar PDI</h1>
            <p className="text-gray-600 mt-1">
              Plano de Desenvolvimento Individual para {employee?.employee.name}
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Perfil Psicométrico */}
          <PsychometricResultsCard employeeId={employeeId} />

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F39200]" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="targetPosition">Cargo Almejado (Opcional)</Label>
                <Select
                  value={formData.targetPositionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetPositionId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions?.map((position: any) => (
                      <SelectItem key={position.id} value={position.id.toString()}>
                        {position.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="objectives">Objetivos de Desenvolvimento</Label>
                <Textarea
                  id="objectives"
                  placeholder="Descreva os objetivos de desenvolvimento do colaborador..."
                  value={formData.objectives}
                  onChange={(e) =>
                    setFormData({ ...formData, objectives: e.target.value })
                  }
                  rows={4}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Mínimo 20 caracteres ({formData.objectives.length}/20)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ações de Desenvolvimento (70-20-10) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#F39200]" />
                  Ações de Desenvolvimento (Modelo 70-20-10)
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAction}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Ação
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                70% Prática | 20% Mentoria | 10% Cursos
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {actions.map((action: any, index: number) => (
                <Card key={index} className="border-l-4 border-l-[#F39200]">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900">
                        Ação {index + 1}
                      </h4>
                      {actions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAction(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Título da Ação</Label>
                        <Input
                          placeholder="Ex: Liderar projeto de implementação"
                          value={action.title}
                          onChange={(e) =>
                            handleActionChange(index, "title", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Descrição</Label>
                        <Textarea
                          placeholder="Descreva a ação de desenvolvimento..."
                          value={action.description}
                          onChange={(e) =>
                            handleActionChange(index, "description", e.target.value)
                          }
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <Label>Categoria (70-20-10)</Label>
                        <Select
                          value={action.category}
                          onValueChange={(value) =>
                            handleActionChange(index, "category", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="70_pratica">
                              70% - Prática (Projetos, Desafios)
                            </SelectItem>
                            <SelectItem value="20_mentoria">
                              20% - Mentoria (Coaching, Feedback)
                            </SelectItem>
                            <SelectItem value="10_curso">
                              10% - Cursos (Treinamentos Formais)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Duração (horas)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 40"
                          value={action.duration}
                          onChange={(e) =>
                            handleActionChange(index, "duration", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label>Prazo</Label>
                        <Input
                          type="date"
                          value={action.deadline}
                          onChange={(e) =>
                            handleActionChange(index, "deadline", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/funcionarios/${employeeId}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#F39200] hover:bg-[#d97f00]"
              disabled={createPDI.isPending}
            >
              {createPDI.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Criar PDI
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
