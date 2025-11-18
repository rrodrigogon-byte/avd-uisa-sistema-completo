import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Users, Award } from "lucide-react";

export default function PerformanceIntegrada() {
  const kpis = [
    { title: "Taxa de Conclusão de Metas", value: "87%", trend: "+5%", icon: Target },
    { title: "Avaliações Concluídas", value: "1.245", trend: "+12%", icon: Users },
    { title: "PDIs Ativos", value: "892", trend: "+8%", icon: Award },
    { title: "Score Médio 360°", value: "4.2/5", trend: "+0.3", icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Performance Integrada</h1>
          <p className="text-muted-foreground mt-2">
            Dashboard consolidado de performance organizacional
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-green-600">{kpi.trend}</Badge> vs mês anterior
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Visão Geral de Performance</CardTitle>
            <CardDescription>Métricas consolidadas de toda a organização</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dashboard em desenvolvimento. Aqui serão exibidos gráficos de evolução temporal,
              comparação entre departamentos e análise de tendências de performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
