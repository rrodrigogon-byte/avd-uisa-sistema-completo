import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Target, Award, CheckCircle2, AlertCircle } from "lucide-react";

export default function SucessaoInteligente() {
  const [selectedPosition, setSelectedPosition] = useState<number | undefined>(undefined);

  // Buscar dados reais do banco
  const { data: positions } = trpc.positionsManagement.list.useQuery();
  const { data: successorsData } = trpc.succession.listCandidates.useQuery(
    { positionId: selectedPosition },
    { enabled: !!selectedPosition }
  );
  const { data: pdiPlans } = trpc.pdiIntelligent.list.useQuery();
  const { data: nineBoxData } = trpc.nineBox.list.useQuery();
  const { data: performanceData } = trpc.evaluations.list.useQuery();

  // Processar dados de sucessores com informações integradas
  const successors = successorsData?.map((candidate: any) => {
    // Buscar PDI do candidato
    const pdi = pdiPlans?.find((p: any) => p.employeeId === candidate.employeeId);
    const pdiItems = pdi?.items || [];
    const completedItems = pdiItems.filter((item: any) => item.status === 'completed').length;
    const totalItems = pdiItems.length;
    const pdiProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Buscar Nine Box do candidato
    const nineBox = nineBoxData?.find((nb: any) => nb.employeeId === candidate.employeeId);
    const nineBoxLabel = nineBox ? `${nineBox.performance} / ${nineBox.potential}` : "Não avaliado";

    // Buscar avaliação de performance do candidato
    const performance = performanceData?.find((p: any) => p.employeeId === candidate.employeeId);
    const performanceRating = (performance as any)?.overallRating || "atende_expectativas";

    return {
      id: candidate.id,
      name: candidate.employeeName || "Candidato",
      currentPosition: candidate.currentPosition || "Não informado",
      readinessLevel: candidate.readinessLevel || "2_3_anos",
      readinessScore: candidate.readinessScore || 0,
      pdi: {
        progress: Math.round(pdiProgress),
        completedActions: completedItems,
        totalActions: totalItems,
        keyAreas: pdiItems.slice(0, 3).map((item: any) => item.title || "N/A"),
      },
      performance: {
        rating: performanceRating,
        trend: "estavel",
      },
      nineBox: nineBoxLabel,
      competencyGaps: candidate.developmentNeeds?.split(',') || [],
    };
  }) || [];

  const getReadinessLabel = (level: string) => {
    const labels: Record<string, string> = {
      imediato: "Imediato",
      "1_ano": "1 Ano",
      "2_3_anos": "2-3 Anos",
      "mais_3_anos": "+3 Anos",
    };
    return labels[level] || level;
  };

  const getReadinessColor = (level: string) => {
    const colors: Record<string, string> = {
      imediato: "bg-green-500",
      "1_ano": "bg-blue-500",
      "2_3_anos": "bg-yellow-500",
      "mais_3_anos": "bg-orange-500",
    };
    return colors[level] || "bg-gray-500";
  };

  const getPerformanceLabel = (rating: string) => {
    const labels: Record<string, string> = {
      excepcional: "Excepcional",
      supera_expectativas: "Supera Expectativas",
      atende_expectativas: "Atende Expectativas",
      abaixo_expectativas: "Abaixo das Expectativas",
    };
    return labels[rating] || rating;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Sucessão Inteligente
          </h1>
          <p className="text-muted-foreground mt-1">
            Pipeline de talentos e planejamento de sucessão baseado em dados
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posições Críticas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">3 sem sucessor imediato</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sucessores Prontos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">+15% vs trimestre anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PDIs Ativos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">72% de conclusão média</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Cobertura</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">Meta: 90%</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtro de Posição */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Posição</CardTitle>
            <CardDescription>
              Escolha uma posição para visualizar o pipeline de sucessores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedPosition?.toString() || ""}
              onValueChange={(value) => setSelectedPosition(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma posição" />
              </SelectTrigger>
              <SelectContent>
                {positions?.map((pos: any) => (
                  <SelectItem key={pos.id} value={pos.id.toString()}>
                    {pos.title} - {pos.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedPosition && (
          <Tabs defaultValue="pipeline" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline de Sucessores</TabsTrigger>
              <TabsTrigger value="matrix">Matriz 9-Box</TabsTrigger>
              <TabsTrigger value="development">Planos de Desenvolvimento</TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Candidatos a Sucessão</CardTitle>
                  <CardDescription>
                    Ordenados por score de prontidão (performance + potencial + PDI + metas)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {successors.map((successor: any) => (
                      <div key={successor.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{successor.name}</h3>
                              <Badge variant="outline">{successor.currentPosition}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Nine Box: {successor.nineBox}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{successor.readinessScore}</div>
                            <p className="text-xs text-muted-foreground">Score de Prontidão</p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Nível de Prontidão */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Nível de Prontidão</span>
                              <Badge className={getReadinessColor(successor.readinessLevel)}>
                                {getReadinessLabel(successor.readinessLevel)}
                              </Badge>
                            </div>
                          </div>

                          {/* Performance */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Performance</span>
                              <Badge variant="secondary">
                                {getPerformanceLabel(successor.performance.rating)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* PDI Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Progresso do PDI</span>
                            <span className="text-muted-foreground">
                              {successor.pdi.completedActions}/{successor.pdi.totalActions} ações
                            </span>
                          </div>
                          <Progress value={successor.pdi.progress} className="h-2" />
                          <div className="flex flex-wrap gap-2">
                            {successor.pdi.keyAreas.map((area: any, idx: any) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Gaps de Competências */}
                        {successor.competencyGaps.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium">Gaps de Competências</span>
                            <div className="flex flex-wrap gap-2">
                              {successor.competencyGaps.map((gap: any, idx: any) => (
                                <Badge key={idx} variant="destructive" className="text-xs">
                                  {gap}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Ver PDI Completo
                          </Button>
                          <Button size="sm" variant="outline">
                            Histórico de Performance
                          </Button>
                          <Button size="sm">Nomear como Sucessor</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="matrix">
              <Card>
                <CardHeader>
                  <CardTitle>Matriz 9-Box - Candidatos</CardTitle>
                  <CardDescription>
                    Visualização de performance vs potencial dos candidatos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    Matriz 9-Box será implementada com visualização interativa
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="development">
              <Card>
                <CardHeader>
                  <CardTitle>Planos de Desenvolvimento</CardTitle>
                  <CardDescription>
                    Ações de desenvolvimento para preparar sucessores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidato</TableHead>
                        <TableHead>Ações Planejadas</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {successors.map((successor: any) => (
                        <TableRow key={successor.id}>
                          <TableCell className="font-medium">{successor.name}</TableCell>
                          <TableCell>{successor.pdi.totalActions} ações</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={successor.pdi.progress} className="h-2 w-24" />
                              <span className="text-sm">{successor.pdi.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>31/12/2025</TableCell>
                          <TableCell>
                            <Badge variant={successor.pdi.progress >= 70 ? "default" : "secondary"}>
                              {successor.pdi.progress >= 70 ? "No prazo" : "Atenção"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!selectedPosition && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma posição acima para visualizar o pipeline de sucessores</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
