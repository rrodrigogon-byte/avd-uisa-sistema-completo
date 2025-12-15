import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowDown, User, Users, TrendingUp } from "lucide-react";

interface Successor {
  id: number;
  name: string;
  currentPosition: string;
  readiness: "pronto" | "1-2_anos" | "3-5_anos";
  performance: number;
  potential: number;
}

interface SuccessionPlan {
  id: number;
  criticalPosition: string;
  department: string;
  currentHolder?: string;
  successors: Successor[];
  priority: "alta" | "media" | "baixa";
}

interface SuccessionPipelineProps {
  plans: SuccessionPlan[];
}

export default function SuccessionPipeline({ plans }: SuccessionPipelineProps) {
  const getReadinessColor = (readiness: string) => {
    if (readiness === "pronto") return "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-400";
    if (readiness === "1-2_anos") return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400";
    return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-400";
  };

  const getReadinessLabel = (readiness: string) => {
    if (readiness === "pronto") return "Pronto";
    if (readiness === "1-2_anos") return "1-2 anos";
    return "3-5 anos";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "alta") return "destructive";
    if (priority === "media") return "default";
    return "secondary";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {plans.map((plan) => (
        <Card key={plan.id} className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{plan.criticalPosition}</CardTitle>
                  <Badge variant={getPriorityColor(plan.priority)}>
                    Prioridade {plan.priority}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {plan.department}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Sucessores</p>
                <p className="text-2xl font-bold text-primary">{plan.successors.length}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Titular Atual */}
              {plan.currentHolder && (
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{plan.currentHolder}</p>
                    <p className="text-sm text-muted-foreground">Titular Atual</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Posição Crítica
                  </Badge>
                </div>
              )}

              {/* Seta indicando sucessão */}
              <div className="flex justify-center">
                <ArrowDown className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Pipeline de Sucessores */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Pipeline de Sucessão
                </h4>
                
                {plan.successors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhum sucessor identificado</p>
                    <p className="text-xs">Considere avaliar candidatos internos</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {plan.successors
                      .sort((a, b) => {
                        const readinessOrder = { pronto: 0, "1-2_anos": 1, "3-5_anos": 2 };
                        return readinessOrder[a.readiness] - readinessOrder[b.readiness];
                      })
                      .map((successor, idx) => (
                        <div
                          key={successor.id}
                          className="flex items-center gap-4 p-3 bg-background border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                            {idx + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(successor.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{successor.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {successor.currentPosition}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right text-xs">
                              <p className="text-muted-foreground">Desempenho</p>
                              <p className="font-semibold text-primary">{successor.performance}/10</p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="text-muted-foreground">Potencial</p>
                              <p className="font-semibold text-purple-600">{successor.potential}/10</p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getReadinessColor(successor.readiness)}`}
                          >
                            {getReadinessLabel(successor.readiness)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Estatísticas do Pipeline */}
              {plan.successors.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                    <p className="text-lg font-bold text-green-600">
                      {plan.successors.filter((s) => s.readiness === "pronto").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Prontos</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                    <p className="text-lg font-bold text-yellow-600">
                      {plan.successors.filter((s) => s.readiness === "1-2_anos").length}
                    </p>
                    <p className="text-xs text-muted-foreground">1-2 anos</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                    <p className="text-lg font-bold text-orange-600">
                      {plan.successors.filter((s) => s.readiness === "3-5_anos").length}
                    </p>
                    <p className="text-xs text-muted-foreground">3-5 anos</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
