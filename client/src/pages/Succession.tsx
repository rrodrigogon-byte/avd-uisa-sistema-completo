import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, GitBranch } from "lucide-react";
import { useLocation } from "wouter";

export default function Succession() {
  const [, setLocation] = useLocation();
  const { data: plans, isLoading } = trpc.succession.listPlans.useQuery();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ativo: "default",
      em_andamento: "default",
      concluido: "outline",
      cancelado: "destructive",
    };
    const labels: Record<string, string> = {
      ativo: "Ativo",
      em_andamento: "Em Andamento",
      concluido: "Concluído",
      cancelado: "Cancelado",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      critical: "destructive",
    };
    const labels: Record<string, string> = {
      low: "Baixo",
      medium: "Médio",
      high: "Alto",
      critical: "Crítico",
    };
    return <Badge variant={variants[risk] || "default"}>{labels[risk] || risk}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GitBranch className="h-8 w-8" />
              Planejamento de Sucessão
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie planos de sucessão para posições críticas
            </p>
          </div>
          <Button onClick={() => setLocation("/succession/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
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
                onClick={() => setLocation(`/succession/${plan.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{plan.position}</CardTitle>
                      <CardDescription className="mt-2">
                        {plan.department || "Sem departamento"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(plan.status)}
                      {getRiskBadge(plan.vacancyRisk)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Risco de Vacância</span>
                      <span className="font-medium">{getRiskBadge(plan.vacancyRisk)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Previsão de Vacância</span>
                      <span className="font-medium">
                        {plan.estimatedVacancyDate 
                          ? new Date(plan.estimatedVacancyDate).toLocaleDateString('pt-BR') 
                          : "Não definida"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Status</span>
                      <span className="font-medium">{getStatusBadge(plan.status)}</span>
                    </div>
                  </div>
                  {plan.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground line-clamp-2">{plan.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum plano de sucessão cadastrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece criando um plano para posições críticas
              </p>
              <Button onClick={() => setLocation("/succession/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Plano
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
