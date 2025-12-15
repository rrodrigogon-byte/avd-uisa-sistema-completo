import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <PieChart className="h-8 w-8" />
              Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Análises e métricas organizacionais
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho Geral</CardTitle>
              <CardDescription>Média de avaliações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">85%</div>
              <p className="text-sm text-muted-foreground mt-2">+5% vs mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metas Concluídas</CardTitle>
              <CardDescription>Taxa de conclusão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">72%</div>
              <p className="text-sm text-muted-foreground mt-2">+3% vs mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PDI Ativos</CardTitle>
              <CardDescription>Planos em andamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">45</div>
              <p className="text-sm text-muted-foreground mt-2">Funcionários com PDI</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Turnover</CardTitle>
              <CardDescription>Taxa anual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8.5%</div>
              <p className="text-sm text-muted-foreground mt-2">-2% vs ano anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sucessão</CardTitle>
              <CardDescription>Posições cobertas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">90%</div>
              <p className="text-sm text-muted-foreground mt-2">Posições críticas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bônus Pagos</CardTitle>
              <CardDescription>Último trimestre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ 250k</div>
              <p className="text-sm text-muted-foreground mt-2">+10% vs trimestre anterior</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
