import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Briefcase, Target, Award, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function Positions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: positions, isLoading, refetch } = trpc.hrPositions.list.useQuery({});
  const { data: departments } = trpc.departments.list.useQuery({});

  const createMutation = trpc.hrPositions.create.useMutation({
    onSuccess: () => {
      toast.success("Cargo criado com sucesso!");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar cargo: ${error.message}`);
    },
  });

  const updateMutation = trpc.hrPositions.update.useMutation({
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso!");
      refetch();
      setIsDialogOpen(false);
      setEditingPosition(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar cargo: ${error.message}`);
    },
  });

  const deleteMutation = trpc.hrPositions.delete.useMutation({
    onSuccess: () => {
      toast.success("Cargo excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir cargo: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    level: "pleno" as any,
    departmentId: undefined as number | undefined,
    salaryMin: undefined as number | undefined,
    salaryMax: undefined as number | undefined,
    mission: "",
    responsibilities: [] as string[],
    technicalCompetencies: [] as string[],
    behavioralCompetencies: [] as string[],
    requirements: {
      education: "",
      experience: "",
      certifications: [] as string[],
    },
    kpis: [] as Array<{ name: string; description: string; target?: string }>,
  });

  const resetForm = () => {
    setFormData({
      code: "",
      title: "",
      description: "",
      level: "pleno",
      departmentId: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      mission: "",
      responsibilities: [],
      technicalCompetencies: [],
      behavioralCompetencies: [],
      requirements: {
        education: "",
        experience: "",
        certifications: [],
      },
      kpis: [],
    });
  };

  const handleEdit = (position: any) => {
    setEditingPosition(position);
    setFormData({
      code: position.code || "",
      title: position.title || "",
      description: position.description || "",
      level: position.level || "pleno",
      departmentId: position.departmentId,
      salaryMin: position.salaryMin,
      salaryMax: position.salaryMax,
      mission: position.mission || "",
      responsibilities: position.responsibilities || [],
      technicalCompetencies: position.technicalCompetencies || [],
      behavioralCompetencies: position.behavioralCompetencies || [],
      requirements: position.requirements || { education: "", experience: "", certifications: [] },
      kpis: position.kpis || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este cargo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = () => {
    if (editingPosition) {
      updateMutation.mutate({ id: editingPosition.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPositions = positions?.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando cargos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Descrição de Cargos UISA</h1>
          <p className="text-muted-foreground">
            Gerencie cargos com descrições completas de competências, responsabilidades e requisitos
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Novo Cargo
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar por título ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPositions?.map((position) => (
          <Card key={position.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {position.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Código: {position.code}
                    {position.level && (
                      <Badge variant="outline" className="ml-2">
                        {position.level}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(position)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(position.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {position.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {position.description}
                </p>
              )}

              {position.mission && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4" />
                    Missão
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{position.mission}</p>
                </div>
              )}

              {position.responsibilities && position.responsibilities.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold mb-1">Responsabilidades</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {position.responsibilities.slice(0, 2).map((resp: string, idx: number) => (
                      <li key={idx} className="line-clamp-1">
                        {resp}
                      </li>
                    ))}
                    {position.responsibilities.length > 2 && (
                      <li className="text-xs text-primary">
                        +{position.responsibilities.length - 2} mais...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {position.technicalCompetencies && position.technicalCompetencies.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
                    <Award className="h-4 w-4" />
                    Competências Técnicas
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {position.technicalCompetencies.slice(0, 3).map((comp: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                    {position.technicalCompetencies.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{position.technicalCompetencies.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {position.salaryMin && position.salaryMax && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold">
                    Faixa Salarial: R$ {position.salaryMin.toLocaleString()} - R${" "}
                    {position.salaryMax.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPositions?.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum cargo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Tente ajustar sua busca"
              : "Comece criando um novo cargo"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Cargo
            </Button>
          )}
        </div>
      )}

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Editar Cargo" : "Novo Cargo"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do cargo seguindo a metodologia UISA
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="uisa">UISA</TabsTrigger>
              <TabsTrigger value="competencies">Competências</TabsTrigger>
              <TabsTrigger value="requirements">Requisitos</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: ENG-001"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Engenheiro de Software"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição geral do cargo..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Nível</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Júnior</SelectItem>
                      <SelectItem value="pleno">Pleno</SelectItem>
                      <SelectItem value="senior">Sênior</SelectItem>
                      <SelectItem value="especialista">Especialista</SelectItem>
                      <SelectItem value="coordenador">Coordenador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="diretor">Diretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Select
                    value={formData.departmentId?.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Salário Mínimo (R$)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryMin: parseFloat(e.target.value) || undefined })
                    }
                    placeholder="Ex: 5000"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">Salário Máximo (R$)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryMax: parseFloat(e.target.value) || undefined })
                    }
                    placeholder="Ex: 10000"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="uisa" className="space-y-4">
              <div>
                <Label htmlFor="mission">Missão do Cargo</Label>
                <Textarea
                  id="mission"
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  placeholder="Descreva a missão principal deste cargo..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Responsabilidades</Label>
                <Textarea
                  value={formData.responsibilities.join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsibilities: e.target.value.split("\n").filter((r) => r.trim()),
                    })
                  }
                  placeholder="Digite uma responsabilidade por linha..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Uma responsabilidade por linha
                </p>
              </div>

              <div>
                <Label>KPIs (Indicadores de Performance)</Label>
                <Textarea
                  value={formData.kpis.map((k) => `${k.name}: ${k.description}`).join("\n")}
                  onChange={(e) => {
                    const kpis = e.target.value
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((line) => {
                        const [name, ...rest] = line.split(":");
                        return {
                          name: name.trim(),
                          description: rest.join(":").trim(),
                        };
                      });
                    setFormData({ ...formData, kpis });
                  }}
                  placeholder="Nome do KPI: Descrição&#10;Ex: Taxa de Conversão: Manter acima de 85%"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: Nome do KPI: Descrição (uma por linha)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="competencies" className="space-y-4">
              <div>
                <Label>Competências Técnicas</Label>
                <Textarea
                  value={formData.technicalCompetencies.join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      technicalCompetencies: e.target.value.split("\n").filter((c) => c.trim()),
                    })
                  }
                  placeholder="Digite uma competência técnica por linha...&#10;Ex: React.js&#10;Node.js&#10;TypeScript"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Uma competência por linha
                </p>
              </div>

              <div>
                <Label>Competências Comportamentais</Label>
                <Textarea
                  value={formData.behavioralCompetencies.join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      behavioralCompetencies: e.target.value.split("\n").filter((c) => c.trim()),
                    })
                  }
                  placeholder="Digite uma competência comportamental por linha...&#10;Ex: Liderança&#10;Comunicação&#10;Trabalho em equipe"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Uma competência por linha
                </p>
              </div>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <div>
                <Label htmlFor="education">Formação Acadêmica</Label>
                <Textarea
                  id="education"
                  value={formData.requirements.education}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requirements: { ...formData.requirements, education: e.target.value },
                    })
                  }
                  placeholder="Ex: Graduação em Engenharia de Software ou áreas correlatas"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="experience">Experiência Profissional</Label>
                <Textarea
                  id="experience"
                  value={formData.requirements.experience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requirements: { ...formData.requirements, experience: e.target.value },
                    })
                  }
                  placeholder="Ex: Mínimo de 3 anos de experiência em desenvolvimento web"
                  rows={2}
                />
              </div>

              <div>
                <Label>Certificações</Label>
                <Textarea
                  value={formData.requirements.certifications.join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requirements: {
                        ...formData.requirements,
                        certifications: e.target.value.split("\n").filter((c) => c.trim()),
                      },
                    })
                  }
                  placeholder="Digite uma certificação por linha...&#10;Ex: AWS Certified Developer&#10;Scrum Master"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Uma certificação por linha
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingPosition(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.code || !formData.title}>
              {editingPosition ? "Atualizar" : "Criar"} Cargo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
