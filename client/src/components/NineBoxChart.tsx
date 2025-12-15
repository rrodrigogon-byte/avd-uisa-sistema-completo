import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Employee {
  id: number;
  name: string;
  performance: number;
  potential: number;
  position?: string;
  department?: string;
}

interface NineBoxChartProps {
  employees: Employee[];
  onEmployeeClick?: (employee: Employee) => void;
}

export default function NineBoxChart({ employees, onEmployeeClick }: NineBoxChartProps) {
  const getBoxEmployees = (perfMin: number, perfMax: number, potMin: number, potMax: number) => {
    return employees.filter(
      (emp) =>
        emp.performance >= perfMin &&
        emp.performance < perfMax &&
        emp.potential >= potMin &&
        emp.potential < potMax
    );
  };

  const getBoxColor = (perfLevel: number, potLevel: number) => {
    // perfLevel e potLevel: 0 (baixo), 1 (médio), 2 (alto)
    if (perfLevel === 2 && potLevel === 2) return "bg-green-50 border-green-500 dark:bg-green-950";
    if (perfLevel === 2 && potLevel === 1) return "bg-blue-50 border-blue-500 dark:bg-blue-950";
    if (perfLevel === 2 && potLevel === 0) return "bg-yellow-50 border-yellow-500 dark:bg-yellow-950";
    if (perfLevel === 1 && potLevel === 2) return "bg-purple-50 border-purple-500 dark:bg-purple-950";
    if (perfLevel === 1 && potLevel === 1) return "bg-gray-50 border-gray-400 dark:bg-gray-900";
    if (perfLevel === 1 && potLevel === 0) return "bg-orange-50 border-orange-500 dark:bg-orange-950";
    if (perfLevel === 0 && potLevel === 2) return "bg-indigo-50 border-indigo-500 dark:bg-indigo-950";
    if (perfLevel === 0 && potLevel === 1) return "bg-red-50 border-red-400 dark:bg-red-950";
    return "bg-red-100 border-red-600 dark:bg-red-900";
  };

  const getBoxLabel = (perfLevel: number, potLevel: number) => {
    const labels = [
      ["Risco", "Inconsistente", "Eficaz"],
      ["Profissional Sólido", "Talento Emergente", "Alto Desempenho"],
      ["Talento Chave", "Alto Potencial", "Estrela"],
    ];
    return labels[potLevel][perfLevel];
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
    <div className="space-y-4">
      {/* Eixos */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-muted-foreground">
          ← Baixo Desempenho | Alto Desempenho →
        </div>
      </div>

      <div className="relative">
        {/* Label do eixo Y */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-muted-foreground whitespace-nowrap">
          ← Baixo Potencial | Alto Potencial →
        </div>

        {/* Grid 3x3 */}
        <div className="grid grid-cols-3 gap-3 ml-8">
          {[2, 1, 0].map((potLevel) =>
            [0, 1, 2].map((perfLevel) => {
              const boxEmployees = getBoxEmployees(
                perfLevel * 3.33,
                (perfLevel + 1) * 3.33,
                potLevel * 3.33,
                (potLevel + 1) * 3.33
              );

              return (
                <Card
                  key={`${potLevel}-${perfLevel}`}
                  className={`min-h-[200px] border-2 transition-all hover:shadow-lg ${getBoxColor(
                    perfLevel,
                    potLevel
                  )}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold">
                        {getBoxLabel(perfLevel, potLevel)}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {boxEmployees.length}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Desempenho: {perfLevel === 0 ? "Baixo" : perfLevel === 1 ? "Médio" : "Alto"} |
                      Potencial: {potLevel === 0 ? "Baixo" : potLevel === 1 ? "Médio" : "Alto"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {boxEmployees.slice(0, 4).map((emp) => (
                        <Tooltip key={emp.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="flex items-center gap-2 p-2 rounded-md bg-background/60 hover:bg-background cursor-pointer transition-colors"
                              onClick={() => onEmployeeClick?.(emp)}
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(emp.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{emp.name}</p>
                                {emp.position && (
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {emp.position}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-muted-foreground">
                                  D:{emp.performance.toFixed(1)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  P:{emp.potential.toFixed(1)}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-semibold">{emp.name}</p>
                              {emp.position && <p className="text-xs">{emp.position}</p>}
                              {emp.department && <p className="text-xs">{emp.department}</p>}
                              <div className="text-xs pt-1 border-t">
                                <p>Desempenho: {emp.performance.toFixed(1)}/10</p>
                                <p>Potencial: {emp.potential.toFixed(1)}/10</p>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {boxEmployees.length > 4 && (
                        <div className="text-center text-xs text-muted-foreground py-1">
                          +{boxEmployees.length - 4} colaborador(es)
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50 dark:bg-green-950" />
          <span>Estrelas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-950" />
          <span>Alto Desempenho</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-purple-500 bg-purple-50 dark:bg-purple-950" />
          <span>Alto Potencial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-red-600 bg-red-100 dark:bg-red-900" />
          <span>Atenção Necessária</span>
        </div>
      </div>
    </div>
  );
}
