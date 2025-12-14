import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Edit, Briefcase, Target, Brain, GraduationCap, Loader2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Responsibility {
  description: string;
}

interface TechnicalCompetency {
  name: string;
  level: string;
}

interface BehavioralCompetency {
  name: string;
  description: string;
}

interface Requirement {
  type: string;
  description: string;
}

export default function JobDescriptionDetail() {
  const [, params] = useRoute("/job-descriptions/:id");
  const jobDescId = params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: jobDesc, isLoading } = trpc.jobDescription.getById.useQuery(
    { id: jobDescId! },
    { enabled: !!jobDescId }
  );

  const { data: position } = trpc.position.getById.useQuery(
    { id: jobDesc?.positionId || 0 },
    { enabled: !!jobDesc?.positionId }
  );

  if (authLoading || isLoading) {
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
              Você precisa estar autenticado para visualizar descrições de cargo.
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
              A descrição de cargo que você está tentando visualizar não existe.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  let responsibilities: Responsibility[] = [];
  let technicalCompetencies: TechnicalCompetency[] = [];
  let behavioralCompetencies: BehavioralCompetency[] = [];
  let requirements: Requirement[] = [];

  if (jobDesc.responsibilities && typeof jobDesc.responsibilities === 'string') {
    try {
      const parsed = JSON.parse(jobDesc.responsibilities);
      if (Array.isArray(parsed)) {
        responsibilities = parsed;
      }
    } catch (e) {
      console.error("Erro ao parsear responsabilidades:", e);
    }
  }

  if (jobDesc.technicalCompetencies && typeof jobDesc.technicalCompetencies === 'string') {
    try {
      const parsed = JSON.parse(jobDesc.technicalCompetencies);
      if (Array.isArray(parsed)) {
        technicalCompetencies = parsed;
      }
    } catch (e) {
      console.error("Erro ao parsear competências técnicas:", e);
    }
  }

  if (jobDesc.behavioralCompetencies && typeof jobDesc.behavioralCompetencies === 'string') {
    try {
      const parsed = JSON.parse(jobDesc.behavioralCompetencies);
      if (Array.isArray(parsed)) {
        behavioralCompetencies = parsed;
      }
    } catch (e) {
      console.error("Erro ao parsear competências comportamentais:", e);
    }
  }

  if (jobDesc.requirements && typeof jobDesc.requirements === 'string') {
    try {
      const parsed = JSON.parse(jobDesc.requirements);
      if (Array.isArray(parsed)) {
        requirements = parsed;
      }
    } catch (e) {
      console.error("Erro ao parsear requisitos:", e);
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/job-descriptions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={() => navigate(`/job-descriptions/edit/${jobDesc.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Descrição
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Descrição de Cargo UISA
                </CardTitle>
                <CardDescription className="mt-2 text-lg">
                  {position?.name || "Carregando..."}
                </CardDescription>
              </div>
              <Badge variant={jobDesc.isActive ? "default" : "secondary"}>
                {jobDesc.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobDesc.summary && (
              <div>
                <h4 className="font-semibold mb-2">Resumo do Cargo</h4>
                <p className="text-muted-foreground">{jobDesc.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Versão</p>
                <p className="font-medium">{jobDesc.version}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Data de Criação</p>
                <p className="font-medium">
                  {format(new Date(jobDesc.createdAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>Responsabilidades</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {responsibilities.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhuma responsabilidade cadastrada.
              </p>
            ) : (
              <ul className="space-y-2">
                {responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{resp.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Competências Técnicas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {technicalCompetencies.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhuma competência técnica cadastrada.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {technicalCompetencies.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{comp.name}</span>
                    <Badge variant="outline">{comp.level}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>Competências Comportamentais</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {behavioralCompetencies.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhuma competência comportamental cadastrada.
              </p>
            ) : (
              <div className="space-y-4">
                {behavioralCompetencies.map((comp, idx) => (
                  <div key={idx}>
                    <h5 className="font-semibold mb-1">{comp.name}</h5>
                    <p className="text-sm text-muted-foreground">{comp.description}</p>
                    {idx < behavioralCompetencies.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Requisitos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {requirements.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum requisito cadastrado.
              </p>
            ) : (
              <div className="space-y-4">
                {["Formação", "Experiência", "Certificações", "Outros"].map((type) => {
                  const typeRequirements = requirements.filter((req) => req.type === type);
                  if (typeRequirements.length === 0) return null;

                  return (
                    <div key={type}>
                      <h5 className="font-semibold mb-2">{type}</h5>
                      <ul className="space-y-1">
                        {typeRequirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{req.description}</span>
                          </li>
                        ))}
                      </ul>
                      {type !== "Outros" && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {format(new Date(jobDesc.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Última Atualização</p>
                <p className="font-medium">
                  {format(new Date(jobDesc.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
