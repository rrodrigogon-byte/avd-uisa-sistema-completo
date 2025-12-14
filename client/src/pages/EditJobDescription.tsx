import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Briefcase, Target, Brain, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

interface Responsibility {
  id: string;
  description: string;
}

interface TechnicalCompetency {
  id: string;
  name: string;
  level: string;
}

interface BehavioralCompetency {
  id: string;
  name: string;
  description: string;
}

interface Requirement {
  id: string;
  type: string;
  description: string;
}

export default function EditJobDescription() {
  const [, params] = useRoute("/job-descriptions/edit/:id");
  const jobDescId = params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [positionId, setPositionId] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [version, setVersion] = useState("1.0");
  const [isActive, setIsActive] = useState(true);
  
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([]);
  const [technicalCompetencies, setTechnicalCompetencies] = useState<TechnicalCompetency[]>([]);
  const [behavioralCompetencies, setBehavioralCompetencies] = useState<BehavioralCompetency[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: jobDesc, isLoading: loadingJobDesc } = trpc.jobDescription.getById.useQuery(
    { id: jobDescId! },
    { enabled: !!jobDescId }
  );

  // Position list não está implementado no router
  const positions: any[] = [];

  const updateMutation = trpc.jobDescription.update.useMutation({
    onSuccess: () => {
      toast.success("Descrição de cargo atualizada com sucesso!");
      navigate("/job-descriptions");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar descrição: " + error.message);
    },
  });

  useEffect(() => {
    if (jobDesc) {
      // positionId não existe no schema - title já vem do jobDesc
      setSummary(jobDesc.summary || "");
      setVersion(jobDesc.version);
      setIsActive(jobDesc.isActive);

      if (jobDesc.responsibilities && typeof jobDesc.responsibilities === 'string') {
        try {
          const parsed = JSON.parse(jobDesc.responsibilities);
          if (Array.isArray(parsed)) {
            setResponsibilities(parsed.map((r, idx) => ({
              ...r,
              id: r.id || `resp-${idx}`
            })));
          }
        } catch (e) {
          console.error("Erro ao parsear responsabilidades:", e);
        }
      }

      if (jobDesc.technicalCompetencies && typeof jobDesc.technicalCompetencies === 'string') {
        try {
          const parsed = JSON.parse(jobDesc.technicalCompetencies);
          if (Array.isArray(parsed)) {
            setTechnicalCompetencies(parsed.map((c, idx) => ({
              ...c,
              id: c.id || `tech-${idx}`
            })));
          }
        } catch (e) {
          console.error("Erro ao parsear competências técnicas:", e);
        }
      }

      if (jobDesc.behavioralCompetencies && typeof jobDesc.behavioralCompetencies === 'string') {
        try {
          const parsed = JSON.parse(jobDesc.behavioralCompetencies);
          if (Array.isArray(parsed)) {
            setBehavioralCompetencies(parsed.map((c, idx) => ({
              ...c,
              id: c.id || `behav-${idx}`
            })));
          }
        } catch (e) {
          console.error("Erro ao parsear competências comportamentais:", e);
        }
      }

      if (jobDesc.requirements && typeof jobDesc.requirements === 'string') {
        try {
          const parsed = JSON.parse(jobDesc.requirements);
          if (Array.isArray(parsed)) {
            setRequirements(parsed.map((r, idx) => ({
              ...r,
              id: r.id || `req-${idx}`
            })));
          }
        } catch (e) {
          console.error("Erro ao parsear requisitos:", e);
        }
      }
    }
  }, [jobDesc]);

  // Responsabilidades
  const addResponsibility = () => {
    setResponsibilities([
      ...responsibilities,
      { id: `resp-${Date.now()}`, description: "" },
    ]);
  };

  const removeResponsibility = (id: string) => {
    setResponsibilities(responsibilities.filter((r) => r.id !== id));
  };

  const updateResponsibility = (id: string, description: string) => {
    setResponsibilities(
      responsibilities.map((r) => (r.id === id ? { ...r, description } : r))
    );
  };

  // Competências Técnicas
  const addTechnicalCompetency = () => {
    setTechnicalCompetencies([
      ...technicalCompetencies,
      { id: `tech-${Date.now()}`, name: "", level: "Básico" },
    ]);
  };

  const removeTechnicalCompetency = (id: string) => {
    setTechnicalCompetencies(technicalCompetencies.filter((c) => c.id !== id));
  };

  const updateTechnicalCompetency = (id: string, field: keyof TechnicalCompetency, value: string) => {
    setTechnicalCompetencies(
      technicalCompetencies.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Competências Comportamentais
  const addBehavioralCompetency = () => {
    setBehavioralCompetencies([
      ...behavioralCompetencies,
      { id: `behav-${Date.now()}`, name: "", description: "" },
    ]);
  };

  const removeBehavioralCompetency = (id: string) => {
    setBehavioralCompetencies(behavioralCompetencies.filter((c) => c.id !== id));
  };

  const updateBehavioralCompetency = (id: string, field: keyof BehavioralCompetency, value: string) => {
    setBehavioralCompetencies(
      behavioralCompetencies.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Requisitos
  const addRequirement = (type: string) => {
    setRequirements([
      ...requirements,
      { id: `req-${Date.now()}`, type, description: "" },
    ]);
  };

  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter((r) => r.id !== id));
  };

  const updateRequirement = (id: string, description: string) => {
    setRequirements(
      requirements.map((r) => (r.id === id ? { ...r, description } : r))
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!positionId) {
      newErrors.positionId = "Selecione um cargo";
    }

    if (!summary.trim()) {
      newErrors.summary = "Resumo é obrigatório";
    }

    if (responsibilities.length === 0) {
      newErrors.responsibilities = "Adicione pelo menos uma responsabilidade";
    }

    responsibilities.forEach((resp, idx) => {
      if (!resp.description.trim()) {
        newErrors[`resp-${idx}`] = "Descrição é obrigatória";
      }
    });

    technicalCompetencies.forEach((comp, idx) => {
      if (!comp.name.trim()) {
        newErrors[`tech-${idx}-name`] = "Nome é obrigatório";
      }
    });

    behavioralCompetencies.forEach((comp, idx) => {
      if (!comp.name.trim()) {
        newErrors[`behav-${idx}-name`] = "Nome é obrigatório";
      }
    });

    requirements.forEach((req, idx) => {
      if (!req.description.trim()) {
        newErrors[`req-${idx}`] = "Descrição é obrigatória";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    if (!jobDescId) {
      toast.error("ID da descrição não encontrado");
      return;
    }

    updateMutation.mutate({
      id: jobDescId,
      summary,
      isActive,
    });
  };

  if (authLoading || loadingJobDesc) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para editar descrições de cargo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!jobDesc) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Descrição de Cargo não encontrada</CardTitle>
            <CardDescription>
              A descrição de cargo que você está tentando editar não existe.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar Descrição de Cargo UISA</CardTitle>
          <CardDescription>
            Atualize as informações da descrição de cargo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo *</Label>
                  <Select
                    value={positionId?.toString()}
                    onValueChange={(value) => setPositionId(parseInt(value))}
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions?.map((pos: any) => (
                        <SelectItem key={pos.id} value={pos.id.toString()}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.positionId && (
                    <p className="text-sm text-destructive">{errors.positionId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Ex: 1.0, 2.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Resumo do Cargo *</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Descreva brevemente o propósito e objetivos principais do cargo..."
                  rows={3}
                />
                {errors.summary && (
                  <p className="text-sm text-destructive">{errors.summary}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Descrição Ativa</Label>
              </div>
            </div>

            {/* Responsabilidades */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Responsabilidades *</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addResponsibility}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {errors.responsibilities && (
                <p className="text-sm text-destructive">{errors.responsibilities}</p>
              )}

              <div className="space-y-3">
                {responsibilities.map((resp, idx) => (
                  <div key={resp.id} className="flex items-start gap-2">
                    <Textarea
                      value={resp.description}
                      onChange={(e) => updateResponsibility(resp.id, e.target.value)}
                      placeholder="Descreva uma responsabilidade..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeResponsibility(resp.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Competências Técnicas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Competências Técnicas</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTechnicalCompetency}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {technicalCompetencies.map((comp, idx) => (
                  <div key={comp.id} className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={comp.name}
                        onChange={(e) =>
                          updateTechnicalCompetency(comp.id, "name", e.target.value)
                        }
                        placeholder="Nome da competência"
                      />
                      <Select
                        value={comp.level}
                        onValueChange={(value) =>
                          updateTechnicalCompetency(comp.id, "level", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Básico">Básico</SelectItem>
                          <SelectItem value="Intermediário">Intermediário</SelectItem>
                          <SelectItem value="Avançado">Avançado</SelectItem>
                          <SelectItem value="Especialista">Especialista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTechnicalCompetency(comp.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Competências Comportamentais */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Competências Comportamentais</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBehavioralCompetency}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {behavioralCompetencies.map((comp, idx) => (
                  <Card key={comp.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={comp.name}
                            onChange={(e) =>
                              updateBehavioralCompetency(comp.id, "name", e.target.value)
                            }
                            placeholder="Nome da competência"
                          />
                          <Textarea
                            value={comp.description}
                            onChange={(e) =>
                              updateBehavioralCompetency(comp.id, "description", e.target.value)
                            }
                            placeholder="Descrição da competência..."
                            rows={2}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBehavioralCompetency(comp.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Requisitos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Requisitos</h3>
              </div>

              {["Formação", "Experiência", "Certificações", "Outros"].map((type) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{type}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRequirement(type)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar {type}
                    </Button>
                  </div>

                  {requirements
                    .filter((req) => req.type === type)
                    .map((req, idx) => (
                      <div key={req.id} className="flex items-start gap-2">
                        <Textarea
                          value={req.description}
                          onChange={(e) => updateRequirement(req.id, e.target.value)}
                          placeholder={`Descreva um requisito de ${type.toLowerCase()}...`}
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRequirement(req.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/job-descriptions")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
