import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Target } from "lucide-react";
import { useLocation } from "wouter";

export default function Goals() {
  const [, setLocation] = useLocation();
  const { data: goals, isLoading } = trpc.goal.list.useQuery();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      not_started: "secondary",
      in_progress: "default",
      completed: "outline",
      cancelled: "destructive",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "secondary",
      medium: "default",
      high: "default",
      critical: "destructive",
    };
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8" />
              Metas
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas metas e acompanhe o progresso
            </p>
          </div>
          <Button onClick={() => setLocation("/goals/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : goals && goals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/goals/${goal.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    {getStatusBadge(goal.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {goal.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prioridade:</span>
                      {getPriorityBadge(goal.priority)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Progresso:</span>
                      <span className="font-medium">
                        {goal.currentValue || 0} / {goal.targetValue || 0} {goal.unit || ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prazo:</span>
                      <span className="font-medium">
                        {goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : "Sem prazo"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma meta cadastrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece criando sua primeira meta
              </p>
              <Button onClick={() => setLocation("/goals/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
