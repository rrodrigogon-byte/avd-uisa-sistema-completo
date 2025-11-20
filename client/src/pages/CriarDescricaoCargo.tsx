import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Save, Send, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

type Responsibility = {
  category: string;
  description: string;
  displayOrder: number;
};

type Knowledge = {
  name: string;
  level: "basico" | "intermediario" | "avancado" | "obrigatorio";
  displayOrder: number;
};

type Competency = {
  name: string;
  type: "competencia" | "habilidade";
  displayOrder: number;
};

export default function CriarDescricaoCargo() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [currentStep, setCurrentStep] = useState(1);

  // Seção 1: Informações Básicas
  const [positionId, setPositionId] = useState<number>(1);
  const [positionTitle, setPositionTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<number>(1);
  const [departmentName, setDepartmentName] = useState("");
  const [cbo, setCbo] = useState("");
  const [division, setDivision] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [revision, setRevision] = useState("1.0");

  // Seção 2: Objetivo Principal
  const [mainObjective, setMainObjective] = useState("");

  // Seção 3: Responsabilidades
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([
    { category: "Processo", description: "", displayOrder: 0 },
  ]);

  // Seção 4: Conhecimentos Técnicos
  const [knowledge, setKnowledge] = useState<Knowledge[]>([
    { name: "", level: "basico", displayOrder: 0 },
  ]);

  // Seção 5: Treinamento Obrigatório
  const [mandatoryTraining, setMandatoryTraining] = useState<string[]>([""]);

  // Seção 6: Competências/Habilidades
  const [competencies, setCompetencies] = useState<Competency[]>([
    { name: "", type: "competencia", displayOrder: 0 },
  ]);

  // Seção 7: Qualificação Desejada
  const [educationLevel, setEducationLevel] = useState("");
  const [requiredExperience, setRequiredExperience] = useState("");

  // Seção 8: e-Social
  const [eSocialSpecs, setESocialSpecs] = useState("");

  const createMutation = trpc.jobDescriptions.create.useMutation({
    onSuccess: () => {
      toast.success("Descrição de cargo criada com sucesso!");
      navigate("/descricao-cargos-uisa");
    },
    onError: (error) => {
      toast.error("Erro ao criar descrição: " + error.message);
    },
  });

  const handleSaveDraft = () => {
    createMutation.mutate({
      positionId,
      positionTitle,
      departmentId,
      departmentName,
      cbo,
      division,
      reportsTo,
      revision,
      mainObjective,
      mandatoryTraining: mandatoryTraining.filter(t => t.trim() !== ""),
      educationLevel,
      requiredExperience,
      eSocialSpecs,
      responsibilities: responsibilities.filter(r => r.description.trim() !== ""),
      knowledge: knowledge.filter(k => k.name.trim() !== ""),
      competencies: competencies.filter(c => c.name.trim() !== ""),
    });
  };

  const addResponsibility = () => {
    setResponsibilities([...responsibilities, { category: "Processo", description: "", displayOrder: responsibilities.length }]);
  };

  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const addKnowledge = () => {
    setKnowledge([...knowledge, { name: "", level: "basico", displayOrder: knowledge.length }]);
  };

  const removeKnowledge = (index: number) => {
    setKnowledge(knowledge.filter((_, i) => i !== index));
  };

  const addTraining = () => {
    setMandatoryTraining([...mandatoryTraining, ""]);
  };

  const removeTraining = (index: number) => {
    setMandatoryTraining(mandatoryTraining.filter((_, i) => i !== index));
  };

  const addCompetency = () => {
    setCompetencies([...competencies, { name: "", type: "competencia", displayOrder: competencies.length }]);
  };

  const removeCompetency = (index: number) => {
    setCompetencies(competencies.filter((_, i) => i !== index));
  };

  const steps = [
    { number: 1, title: "Informações Básicas" },
    { number: 2, title: "Objetivo Principal" },
    { number: 3, title: "Responsabilidades" },
    { number: 4, title: "Conhecimentos Técnicos" },
    { number: 5, title: "Treinamento Obrigatório" },
    { number: 6, title: "Competências/Habilidades" },
    { number: 7, title: "Qualificação Desejada" },
    { number: 8, title: "e-Social" },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Nova Descrição de Cargo</h1>
          <p className="text-muted-foreground">Template UISA - Preencha todas as seções</p>
        </div>

        {/* Wizard Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep === step.number
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step.number
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.number}
                  </div>
                  <span className="text-xs mt-2 text-center max-w-[100px]">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 w-12 mx-2 ${currentStep > step.number ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>Seção {currentStep}: {steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Seção 1: Informações Básicas */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cargo *</Label>
                    <Input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} placeholder="Ex: Analista Planejamento Custos SR" />
                  </div>
                  <div>
                    <Label>Departamento *</Label>
                    <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} placeholder="Ex: PLANEJAMENTO CUSTOS" />
                  </div>
                  <div>
                    <Label>CBO</Label>
                    <Input value={cbo} onChange={(e) => setCbo(e.target.value)} placeholder="Código Brasileiro de Ocupações" />
                  </div>
                  <div>
                    <Label>Divisão</Label>
                    <Input value={division} onChange={(e) => setDivision(e.target.value)} placeholder="Ex: ADMINISTRATIVA" />
                  </div>
                  <div>
                    <Label>Reporta para (Superior Imediato)</Label>
                    <Input value={reportsTo} onChange={(e) => setReportsTo(e.target.value)} placeholder="Ex: COORDENADOR PLANEJAMENTO CUSTOS" />
                  </div>
                  <div>
                    <Label>Revisão</Label>
                    <Input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="Ex: 1.0" />
                  </div>
                </div>
              </div>
            )}

            {/* Seção 2: Objetivo Principal */}
            {currentStep === 2 && (
              <div>
                <Label>Objetivo Principal do Cargo *</Label>
                <Textarea
                  value={mainObjective}
                  onChange={(e) => setMainObjective(e.target.value)}
                  placeholder="Descreva o objetivo principal do cargo..."
                  rows={8}
                  className="mt-2"
                />
              </div>
            )}

            {/* Seção 3: Responsabilidades */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Responsabilidades por Categoria</Label>
                  <Button onClick={addResponsibility} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                {responsibilities.map((resp, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <Select
                        value={resp.category}
                        onValueChange={(value) => {
                          const newResp = [...responsibilities];
                          newResp[index].category = value;
                          setResponsibilities(newResp);
                        }}
                      >
                        <SelectTrigger className="w-[250px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Processo">Processo</SelectItem>
                          <SelectItem value="Análise KPI">Análise KPI</SelectItem>
                          <SelectItem value="Planejamento">Planejamento</SelectItem>
                          <SelectItem value="Budget/Capex/Forecast">Budget/Capex/Forecast</SelectItem>
                          <SelectItem value="Resultados">Resultados</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" size="sm" onClick={() => removeResponsibility(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={resp.description}
                      onChange={(e) => {
                        const newResp = [...responsibilities];
                        newResp[index].description = e.target.value;
                        setResponsibilities(newResp);
                      }}
                      placeholder="Descreva a responsabilidade..."
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Seção 4: Conhecimentos Técnicos */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Conhecimentos Técnicos</Label>
                  <Button onClick={addKnowledge} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="grid gap-4">
                  {knowledge.map((k, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <Input
                        value={k.name}
                        onChange={(e) => {
                          const newK = [...knowledge];
                          newK[index].name = e.target.value;
                          setKnowledge(newK);
                        }}
                        placeholder="Ex: Office, Análise de Processos"
                        className="flex-1"
                      />
                      <Select
                        value={k.level}
                        onValueChange={(value: any) => {
                          const newK = [...knowledge];
                          newK[index].level = value;
                          setKnowledge(newK);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="intermediario">Intermediário</SelectItem>
                          <SelectItem value="avancado">Avançado</SelectItem>
                          <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" size="sm" onClick={() => removeKnowledge(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção 5: Treinamento Obrigatório */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Treinamentos Obrigatórios</Label>
                  <Button onClick={addTraining} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                {mandatoryTraining.map((training, index) => (
                  <div key={index} className="flex gap-4">
                    <Input
                      value={training}
                      onChange={(e) => {
                        const newTraining = [...mandatoryTraining];
                        newTraining[index] = e.target.value;
                        setMandatoryTraining(newTraining);
                      }}
                      placeholder="Nome do treinamento obrigatório"
                      className="flex-1"
                    />
                    <Button variant="destructive" size="sm" onClick={() => removeTraining(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Seção 6: Competências/Habilidades */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Competências e Habilidades</Label>
                  <Button onClick={addCompetency} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {competencies.map((comp, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={comp.name}
                        onChange={(e) => {
                          const newComp = [...competencies];
                          newComp[index].name = e.target.value;
                          setCompetencies(newComp);
                        }}
                        placeholder="Ex: Planejamento, Comunicação"
                        className="flex-1"
                      />
                      <Select
                        value={comp.type}
                        onValueChange={(value: any) => {
                          const newComp = [...competencies];
                          newComp[index].type = value;
                          setCompetencies(newComp);
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="competencia">Competência</SelectItem>
                          <SelectItem value="habilidade">Habilidade</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" size="sm" onClick={() => removeCompetency(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção 7: Qualificação Desejada */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <div>
                  <Label>Formação</Label>
                  <Input
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    placeholder="Ex: Ensino Superior"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Experiência Requerida</Label>
                  <Textarea
                    value={requiredExperience}
                    onChange={(e) => setRequiredExperience(e.target.value)}
                    placeholder="Ex: Desejável de 4 a 6 anos no cargo ou posições similares"
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Seção 8: e-Social */}
            {currentStep === 8 && (
              <div>
                <Label>Especificações e-Social</Label>
                <Textarea
                  value={eSocialSpecs}
                  onChange={(e) => setESocialSpecs(e.target.value)}
                  placeholder="Especificações do Programa de Medicina e Segurança do Trabalho (PCMSO, PPRA)"
                  rows={6}
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>

            {currentStep < 8 ? (
              <Button onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSaveDraft} disabled={createMutation.isPending}>
                <Send className="w-4 h-4 mr-2" />
                Finalizar e Salvar
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
