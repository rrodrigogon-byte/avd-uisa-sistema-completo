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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

/**
 * Página de Criação de Ciclo de Feedback 360°
 * Permite criar um novo ciclo com configurações personalizadas
 */
export default function CriarCiclo() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    allowSelfAssessment: true,
    minEvaluators: 3,
    maxEvaluators: 10,
    anonymousResponses: true,
  });

  const createCycleMutation = trpc.feedback360.createCycle.useMutation({
    onSuccess: (data) => {
      toast.success("Ciclo criado com sucesso!");
      utils.feedback360.listCycles.invalidate();
      setLocation(`/feedback360/ciclo/${data.cycleId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar ciclo: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("A data de término deve ser posterior à data de início");
      return;
    }

    createCycleMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/feedback360")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Criar Novo Ciclo de Feedback 360°</h1>
        <p className="text-muted-foreground mt-1">
          Configure um novo ciclo de avaliação 360 graus
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Defina o nome e descrição do ciclo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">
                  Nome do Ciclo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Feedback 360° - 1º Semestre 2025"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo deste ciclo de feedback..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Período */}
          <Card>
            <CardHeader>
              <CardTitle>Período do Ciclo</CardTitle>
              <CardDescription>
                Defina quando o ciclo estará ativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">
                    Data de Início <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="endDate">
                    Data de Término <span className="text-red-500">*</span>
                  </Label>
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
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Personalize as regras do ciclo de feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir Autoavaliação</Label>
                  <p className="text-sm text-muted-foreground">
                    Participantes podem avaliar a si mesmos
                  </p>
                </div>
                <Switch
                  checked={formData.allowSelfAssessment}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowSelfAssessment: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Respostas Anônimas</Label>
                  <p className="text-sm text-muted-foreground">
                    Ocultar identidade dos avaliadores nos relatórios
                  </p>
                </div>
                <Switch
                  checked={formData.anonymousResponses}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, anonymousResponses: checked })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minEvaluators">
                    Mínimo de Avaliadores
                  </Label>
                  <Input
                    id="minEvaluators"
                    type="number"
                    min={1}
                    max={20}
                    value={formData.minEvaluators}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minEvaluators: parseInt(e.target.value) || 3,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Número mínimo de avaliadores por participante
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxEvaluators">
                    Máximo de Avaliadores
                  </Label>
                  <Input
                    id="maxEvaluators"
                    type="number"
                    min={1}
                    max={50}
                    value={formData.maxEvaluators}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxEvaluators: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Número máximo de avaliadores por participante
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/feedback360")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createCycleMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {createCycleMutation.isPending ? "Criando..." : "Criar Ciclo"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
