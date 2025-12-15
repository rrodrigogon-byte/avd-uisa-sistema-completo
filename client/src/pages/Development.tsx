import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";

export default function Development() {
  const [, setLocation] = useLocation();
  const { data: plans, isLoading } = trpc.developmentPlan.list.useQuery();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      rascunho: "secondary",
      ativo: "default",
      concluido: "outline",
      cancelado: "destructive",
    };
    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      ativo: "Ativo",
      concluido: "Concluído",
      cancelado: "Cancelado",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-8 w-8" />
              Plano de Desenvolvimento Individual (PDI)
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe seu desenvolvimento profissional
            </p>
          </div>
          <Button onClick={() => setLocation("/development/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo PDI
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/development/${plan.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{plan.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {plan.description || "Sem descrição"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(plan.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Período</span>
                      <span className="font-medium">{plan.period}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Início</span>
                      <span className="font-medium">
                        {plan.startDate ? new Date(plan.startDate).toLocaleDateString('pt-BR') : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Término</span>
                      <span className="font-medium">
                        {plan.endDate ? new Date(plan.endDate).toLocaleDateString('pt-BR') : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Progresso</span>
                      <span className="font-medium">{plan.completionPercentage || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum PDI cadastrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece criando seu plano de desenvolvimento
              </p>
              <Button onClick={() => setLocation("/development/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar PDI
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
