import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

interface Competency {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export default function EditTemplate() {
  const [, params] = useRoute("/templates/edit/:id");
  const templateId = params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: template, isLoading } = trpc.template.getById.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );

  const updateMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado com sucesso!");
      navigate("/templates");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar template: " + error.message);
    },
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      
      if (template.competencies && typeof template.competencies === 'string') {
        try {
          const parsed = JSON.parse(template.competencies);
          if (Array.isArray(parsed)) {
            setCompetencies(parsed.map((c, idx) => ({
              ...c,
              id: c.id || `comp-${idx}`
            })));
          }
        } catch (e) {
          console.error("Erro ao parsear competências:", e);
        }
      }
    }
  }, [template]);

  const addCompetency = () => {
    setCompetencies([
      ...competencies,
      {
        id: `comp-${Date.now()}`,
        name: "",
        description: "",
        weight: 1,
      },
    ]);
  };

  const removeCompetency = (id: string) => {
    setCompetencies(competencies.filter((c) => c.id !== id));
  };

  const updateCompetency = (id: string, field: keyof Competency, value: string | number) => {
    setCompetencies(
      competencies.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (competencies.length === 0) {
      newErrors.competencies = "Adicione pelo menos uma competência";
    }

    competencies.forEach((comp, idx) => {
      if (!comp.name.trim()) {
        newErrors[`comp-${idx}-name`] = "Nome da competência é obrigatório";
      }
      if (comp.weight < 1 || comp.weight > 10) {
        newErrors[`comp-${idx}-weight`] = "Peso deve estar entre 1 e 10";
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

    if (!templateId) {
      toast.error("ID do template não encontrado");
      return;
    }

    updateMutation.mutate({
      id: templateId,
      name,
      description,
      competencies: JSON.stringify(competencies),
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa ser administrador para editar templates.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Template não encontrado</CardTitle>
            <CardDescription>
              O template que você está tentando editar não existe.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar Template de Avaliação</CardTitle>
          <CardDescription>
            Atualize as informações do template de avaliação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Avaliação de Desempenho 2024"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo deste template..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Competências *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompetency}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Competência
                </Button>
              </div>

              {errors.competencies && (
                <p className="text-sm text-destructive">{errors.competencies}</p>
              )}

              <div className="space-y-4">
                {competencies.map((comp, idx) => (
                  <Card key={comp.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label>Nome da Competência *</Label>
                              <Input
                                value={comp.name}
                                onChange={(e) =>
                                  updateCompetency(comp.id, "name", e.target.value)
                                }
                                placeholder="Ex: Comunicação"
                              />
                              {errors[`comp-${idx}-name`] && (
                                <p className="text-sm text-destructive">
                                  {errors[`comp-${idx}-name`]}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Descrição</Label>
                              <Textarea
                                value={comp.description}
                                onChange={(e) =>
                                  updateCompetency(comp.id, "description", e.target.value)
                                }
                                placeholder="Descreva esta competência..."
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Peso (1-10) *</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={comp.weight}
                                onChange={(e) =>
                                  updateCompetency(
                                    comp.id,
                                    "weight",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                              />
                              {errors[`comp-${idx}-weight`] && (
                                <p className="text-sm text-destructive">
                                  {errors[`comp-${idx}-weight`]}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompetency(comp.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                onClick={() => navigate("/templates")}
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
