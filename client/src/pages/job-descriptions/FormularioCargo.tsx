import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Plus, X, ArrowLeft } from "lucide-react";

/**
 * Formulário Dinâmico de Cargos
 * Interface para criar/editar descrições de cargo com campos dinâmicos
 */
export default function FormularioCargo() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    department: "",
    level: "operacional" as "operacional" | "tatico" | "estrategico",
    summary: "",
    responsibilities: "",
    requirements: "",
    competencies: [] as string[],
    educationLevel: "",
    experienceYears: 0,
    technicalSkills: [] as string[],
    behavioralSkills: [] as string[],
    workConditions: "",
    benefits: "",
    salaryRange: "",
  });

  const [newCompetency, setNewCompetency] = useState("");
  const [newTechnicalSkill, setNewTechnicalSkill] = useState("");
  const [newBehavioralSkill, setNewBehavioralSkill] = useState("");

  // Query para buscar descrição existente (modo edição)
  const { data: existingJob, isLoading } = trpc.jobDescriptionsApprovals.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: isEdit }
  );

  // Mutations
  const createMutation = trpc.jobDescriptionsApprovals.create.useMutation({
    onSuccess: () => {
      toast.success("Descrição de cargo criada com sucesso!");
      navigate("/job-descriptions/dashboard");
    },
    onError: (error) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  const updateMutation = trpc.jobDescriptionsApprovals.update.useMutation({
    onSuccess: () => {
      toast.success("Descrição de cargo atualizada com sucesso!");
      navigate("/job-descriptions/dashboard");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Carregar dados existentes no modo edição
  useEffect(() => {
    if (existingJob) {
      setFormData({
        code: existingJob.code || "",
        title: existingJob.title || "",
        department: existingJob.department || "",
        level: existingJob.level || "operacional",
        summary: existingJob.summary || "",
        responsibilities: existingJob.responsibilities || "",
        requirements: existingJob.requirements || "",
        competencies: existingJob.competencies
          ? JSON.parse(existingJob.competencies)
          : [],
        educationLevel: existingJob.educationLevel || "",
        experienceYears: existingJob.experienceYears || 0,
        technicalSkills: existingJob.technicalSkills
          ? JSON.parse(existingJob.technicalSkills)
          : [],
        behavioralSkills: existingJob.behavioralSkills
          ? JSON.parse(existingJob.behavioralSkills)
          : [],
        workConditions: existingJob.workConditions || "",
        benefits: existingJob.benefits || "",
        salaryRange: existingJob.salaryRange || "",
      });
    }
  }, [existingJob]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.code.trim()) {
      toast.error("Código é obrigatório");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!formData.department.trim()) {
      toast.error("Departamento é obrigatório");
      return;
    }

    const payload = {
      ...formData,
      competencies: JSON.stringify(formData.competencies),
      technicalSkills: JSON.stringify(formData.technicalSkills),
      behavioralSkills: JSON.stringify(formData.behavioralSkills),
    };

    if (isEdit) {
      updateMutation.mutate({ id: parseInt(id!), ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addCompetency = () => {
    if (newCompetency.trim()) {
      setFormData((prev) => ({
        ...prev,
        competencies: [...prev.competencies, newCompetency.trim()],
      }));
      setNewCompetency("");
    }
  };

  const removeCompetency = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      competencies: prev.competencies.filter((_, i) => i !== index),
    }));
  };

  const addTechnicalSkill = () => {
    if (newTechnicalSkill.trim()) {
      setFormData((prev) => ({
        ...prev,
        technicalSkills: [...prev.technicalSkills, newTechnicalSkill.trim()],
      }));
      setNewTechnicalSkill("");
    }
  };

  const removeTechnicalSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      technicalSkills: prev.technicalSkills.filter((_, i) => i !== index),
    }));
  };

  const addBehavioralSkill = () => {
    if (newBehavioralSkill.trim()) {
      setFormData((prev) => ({
        ...prev,
        behavioralSkills: [...prev.behavioralSkills, newBehavioralSkill.trim()],
      }));
      setNewBehavioralSkill("");
    }
  };

  const removeBehavioralSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      behavioralSkills: prev.behavioralSkills.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8 text-muted-foreground">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/job-descriptions/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Editar" : "Nova"} Descrição de Cargo
          </h1>
          <p className="text-muted-foreground">
            Preencha os campos abaixo para {isEdit ? "atualizar" : "criar"} a
            descrição
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais da descrição de cargo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="Ex: CARGO-001"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título do Cargo *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Analista de RH"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento *</Label>
                <Input
                  id="department"
                  placeholder="Ex: Recursos Humanos"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Nível *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="tatico">Tático</SelectItem>
                    <SelectItem value="estrategico">Estratégico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Resumo do Cargo</Label>
              <Textarea
                id="summary"
                placeholder="Breve descrição do cargo..."
                value={formData.summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, summary: e.target.value }))
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Responsabilidades e Requisitos */}
        <Card>
          <CardHeader>
            <CardTitle>Responsabilidades e Requisitos</CardTitle>
            <CardDescription>
              Detalhes sobre as atribuições e requisitos do cargo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsabilidades</Label>
              <Textarea
                id="responsibilities"
                placeholder="Liste as principais responsabilidades..."
                value={formData.responsibilities}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    responsibilities: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requisitos</Label>
              <Textarea
                id="requirements"
                placeholder="Liste os requisitos necessários..."
                value={formData.requirements}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requirements: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="educationLevel">Escolaridade</Label>
                <Input
                  id="educationLevel"
                  placeholder="Ex: Ensino Superior Completo"
                  value={formData.educationLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      educationLevel: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceYears">Anos de Experiência</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  placeholder="Ex: 3"
                  value={formData.experienceYears}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      experienceYears: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competências (Dinâmico) */}
        <Card>
          <CardHeader>
            <CardTitle>Competências</CardTitle>
            <CardDescription>
              Adicione as competências necessárias para o cargo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma competência..."
                value={newCompetency}
                onChange={(e) => setNewCompetency(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCompetency())}
              />
              <Button type="button" onClick={addCompetency}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {formData.competencies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.competencies.map((comp, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full"
                  >
                    <span className="text-sm">{comp}</span>
                    <button
                      type="button"
                      onClick={() => removeCompetency(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habilidades Técnicas (Dinâmico) */}
        <Card>
          <CardHeader>
            <CardTitle>Habilidades Técnicas</CardTitle>
            <CardDescription>
              Adicione as habilidades técnicas necessárias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma habilidade técnica..."
                value={newTechnicalSkill}
                onChange={(e) => setNewTechnicalSkill(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTechnicalSkill())
                }
              />
              <Button type="button" onClick={addTechnicalSkill}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {formData.technicalSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.technicalSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    <span className="text-sm">{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeTechnicalSkill(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habilidades Comportamentais (Dinâmico) */}
        <Card>
          <CardHeader>
            <CardTitle>Habilidades Comportamentais</CardTitle>
            <CardDescription>
              Adicione as habilidades comportamentais desejadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma habilidade comportamental..."
                value={newBehavioralSkill}
                onChange={(e) => setNewBehavioralSkill(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addBehavioralSkill())
                }
              />
              <Button type="button" onClick={addBehavioralSkill}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {formData.behavioralSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.behavioralSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full"
                  >
                    <span className="text-sm">{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeBehavioralSkill(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
            <CardDescription>
              Condições de trabalho, benefícios e faixa salarial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workConditions">Condições de Trabalho</Label>
              <Textarea
                id="workConditions"
                placeholder="Descreva as condições de trabalho..."
                value={formData.workConditions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    workConditions: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefícios</Label>
              <Textarea
                id="benefits"
                placeholder="Liste os benefícios oferecidos..."
                value={formData.benefits}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, benefits: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryRange">Faixa Salarial</Label>
              <Input
                id="salaryRange"
                placeholder="Ex: R$ 3.000,00 - R$ 5.000,00"
                value={formData.salaryRange}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryRange: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/job-descriptions/dashboard")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? "Atualizar" : "Criar"} Descrição
          </Button>
        </div>
      </form>
    </div>
  );
}
