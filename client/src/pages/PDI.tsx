import DashboardLayout from "@/components/DashboardLayout";
import PDIWizard from "@/components/PDIWizard";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { downloadICS } from "@/lib/generateICS";
import { toast } from "sonner";
import { AlertCircle, BookOpen, Calendar, CalendarPlus, CheckCircle2, Clock, Plus, TrendingUp, Users2, Lightbulb, Brain, Upload } from "lucide-react";
import { useLocation } from "wouter";

export default function PDI() {
  const [showWizard, setShowWizard] = useState(false);
  const [, setLocation] = useLocation();
  const { data: pdis } = trpc.pdi.list.useQuery({});
  const { data: employee } = trpc.employees.getCurrent.useQuery({});

  const activePDI = pdis?.find(p => p.status === "aprovado" || p.status === "em_andamento");
  const { data: pdiItems } = trpc.pdi.getItems.useQuery(
    { planId: activePDI?.id || 0 },
    { enabled: !!activePDI }
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      rascunho: { variant: "secondary", label: "Rascunho", icon: Clock },
      pendente_aprovacao: { variant: "outline", label: "Pendente", icon: AlertCircle },
      aprovado: { variant: "default", label: "Aprovado", icon: CheckCircle2 },
      em_andamento: { variant: "default", label: "Em Andamento", icon: TrendingUp },
      concluido: { variant: "default", label: "Concluído", icon: CheckCircle2 },
      cancelado: { variant: "destructive", label: "Cancelado", icon: AlertCircle },
    };

    const config = variants[status] || variants.rascunho;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const config: Record<string, { label: string; icon: any; color: string }> = {
      "70_pratica": { label: "70% Prática", icon: TrendingUp, color: "bg-blue-500" },
      "20_mentoria": { label: "20% Mentoria", icon: Users2, color: "bg-purple-500" },
      "10_curso": { label: "10% Curso", icon: BookOpen, color: "bg-green-500" },
    };

    const item = config[category] || config["70_pratica"];
    const Icon = item.icon;

    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${item.color}`} />
        <span className="text-xs font-medium">{item.label}</span>
      </div>
    );
  };

  const items70 = pdiItems?.filter(i => i.category === "70_pratica") || [];
  const items20 = pdiItems?.filter(i => i.category === "20_mentoria") || [];
  const items10 = pdiItems?.filter(i => i.category === "10_curso") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Plano de Desenvolvimento Individual
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe seu desenvolvimento profissional com o modelo 70-20-10
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/pdi/import")}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar PDI
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/pdi-inteligente/novo")}
            >
              <Brain className="h-4 w-4 mr-2" />
              PDI Inteligente
            </Button>
            {!activePDI && (
              <Button size="lg" onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar PDI 70-20-10
              </Button>
            )}
          </div>
        </div>

        {showWizard ? (
          <PDIWizard 
            onComplete={() => setShowWizard(false)} 
            onCancel={() => setShowWizard(false)} 
          />
        ) : !activePDI ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum PDI ativo</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Crie seu Plano de Desenvolvimento Individual para estruturar seu crescimento profissional
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro PDI
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* PDI Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      PDI {new Date(activePDI.startDate).getFullYear()}
                      {getStatusBadge(activePDI.status)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {new Date(activePDI.startDate).toLocaleDateString("pt-BR")} até{" "}
                      {new Date(activePDI.endDate).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      downloadICS(
                        {
                          title: `PDI ${new Date(activePDI.startDate).getFullYear()}`,
                          description: `Plano de Desenvolvimento Individual\nProgresso: ${activePDI.overallProgress}%`,
                          startDate: new Date(activePDI.startDate),
                          endDate: new Date(activePDI.endDate),
                        },
                        `pdi-${activePDI.id}-${new Date(activePDI.startDate).getFullYear()}`
                      );
                      toast.success("PDI adicionado ao calendário!");
                    }}
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Adicionar ao Calendário
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso geral</span>
                    <span className="font-semibold">{activePDI.overallProgress}%</span>
                  </div>
                  <Progress value={activePDI.overallProgress} className="h-3" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {items70.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Ações Práticas (70%)</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {items20.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Mentorias (20%)</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {items10.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Cursos (10%)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDI Items */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">Todas ({pdiItems?.length || 0})</TabsTrigger>
                <TabsTrigger value="70">70% Prática ({items70.length})</TabsTrigger>
                <TabsTrigger value="20">20% Mentoria ({items20.length})</TabsTrigger>
                <TabsTrigger value="10">10% Curso ({items10.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {pdiItems?.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Nenhuma ação de desenvolvimento cadastrada</p>
                      <Button variant="link" className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Ação
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  pdiItems?.map((item: any) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {item.title}
                              {getStatusBadge(item.status)}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {item.description}
                            </CardDescription>
                          </div>
                          {getCategoryBadge(item.category)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Tipo</p>
                            <p className="font-medium capitalize">{item.type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Início</p>
                            <p className="font-medium">
                              {new Date(item.startDate).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Término</p>
                            <p className="font-medium">
                              {new Date(item.endDate).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium capitalize">{item.status}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-semibold">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>

                        {item.status === "em_andamento" && (
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm">
                              Atualizar Progresso
                            </Button>
                            <Button variant="outline" size="sm">
                              Marcar como Concluída
                            </Button>
                          </div>
                        )}

                        {item.completedAt && (
                          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <p className="text-sm">
                              Concluída em {new Date(item.completedAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="70" className="space-y-4">
                {items70.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Nenhuma ação prática cadastrada</p>
                    </CardContent>
                  </Card>
                ) : (
                  items70.map((item: any) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-semibold">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="20" className="space-y-4">
                {items20.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Users2 className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Nenhuma mentoria cadastrada</p>
                    </CardContent>
                  </Card>
                ) : (
                  items20.map((item: any) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-semibold">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="10" className="space-y-4">
                {items10.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Nenhum curso cadastrado</p>
                    </CardContent>
                  </Card>
                ) : (
                  items10.map((item: any) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-semibold">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Modelo 70-20-10</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  O modelo 70-20-10 é uma abordagem científica para o desenvolvimento profissional:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>70% Prática:</strong> Aprendizado através de experiências e desafios reais no trabalho</li>
                  <li><strong>20% Mentoria:</strong> Desenvolvimento através de relacionamentos e feedback de outros</li>
                  <li><strong>10% Cursos:</strong> Educação formal através de treinamentos e cursos estruturados</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
