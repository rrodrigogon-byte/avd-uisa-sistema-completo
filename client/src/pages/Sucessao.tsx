import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, TrendingUp, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Sucessao() {
  const { data: plans, isLoading } = trpc.successionPlans.list.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mapa de Sucessão</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie o pipeline de sucessão para posições críticas
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !plans || plans.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum plano de sucessão encontrado</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Crie planos de sucessão para posições críticas da organização
                </p>
                <Button className="mt-4">Criar Plano de Sucessão</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {plans.map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{plan.positionName}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.departmentName || "Departamento não especificado"}
                      </CardDescription>
                    </div>
                    <Badge variant={plan.priority === "alta" ? "destructive" : plan.priority === "media" ? "default" : "secondary"}>
                      Prioridade {plan.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Titular Atual */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Titular Atual</h4>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.currentHolderName || "Não especificado"}</span>
                      </div>
                    </div>

                    {/* Sucessores */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Sucessores Identificados</h4>
                      <div className="space-y-2">
                        {plan.successors && plan.successors.length > 0 ? (
                          plan.successors.map((successor: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{successor.name}</p>
                                  <p className="text-sm text-muted-foreground">{successor.currentPosition}</p>
                                </div>
                              </div>
                              <Badge variant="outline">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Prontidão: {successor.readiness}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum sucessor identificado</p>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                      <Button variant="outline" size="sm">Editar Plano</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
