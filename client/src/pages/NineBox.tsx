import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Grid3x3, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

export default function NineBox() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { data: nineBoxData } = trpc.nineBox.getByCycle.useQuery({ cycleId: 1 });
  const { data: employeesData } = trpc.employees.list.useQuery();
  
  // Extract unique departments from employees
  const departments = employeesData?.reduce((acc: any[], emp) => {
    if (emp.department && !acc.find(d => d.id === emp.department!.id)) {
      acc.push(emp.department);
    }
    return acc;
  }, []) || [];

  const getBoxColor = (performance: number, potential: number) => {
    // Alto desempenho + Alto potencial
    if (performance >= 7 && potential >= 7) return "bg-green-100 dark:bg-green-950 border-green-500";
    // Alto desempenho + Médio potencial
    if (performance >= 7 && potential >= 4) return "bg-blue-100 dark:bg-blue-950 border-blue-500";
    // Alto desempenho + Baixo potencial
    if (performance >= 7) return "bg-yellow-100 dark:bg-yellow-950 border-yellow-500";
    // Médio desempenho + Alto potencial
    if (performance >= 4 && potential >= 7) return "bg-purple-100 dark:bg-purple-950 border-purple-500";
    // Médio desempenho + Médio potencial
    if (performance >= 4 && potential >= 4) return "bg-gray-100 dark:bg-gray-800 border-gray-400";
    // Baixo desempenho
    return "bg-red-100 dark:bg-red-950 border-red-500";
  };

  const getBoxLabel = (row: number, col: number) => {
    const labels = [
      ["Talento Chave", "Alto Potencial", "Estrela"],
      ["Profissional Sólido", "Talento Emergente", "Alto Desempenho"],
      ["Risco", "Inconsistente", "Eficaz"],
    ];
    return labels[2 - row][col];
  };

  const getBoxDescription = (row: number, col: number) => {
    const descriptions = [
      [
        "Alto desempenho, alto potencial - Sucessores imediatos",
        "Médio desempenho, alto potencial - Desenvolver urgentemente",
        "Baixo desempenho, alto potencial - Precisa de suporte",
      ],
      [
        "Alto desempenho, médio potencial - Especialistas valiosos",
        "Médio desempenho, médio potencial - Maioria da equipe",
        "Baixo desempenho, médio potencial - Melhorar desempenho",
      ],
      [
        "Alto desempenho, baixo potencial - Manter na função",
        "Médio desempenho, baixo potencial - Atenção necessária",
        "Baixo desempenho, baixo potencial - Ação imediata",
      ],
    ];
    return descriptions[2 - row][col];
  };

  const getEmployeesInBox = (row: number, col: number) => {
    if (!nineBoxData) return [];
    
    const minPerformance = col * 3.33;
    const maxPerformance = (col + 1) * 3.33;
    const minPotential = row * 3.33;
    const maxPotential = (row + 1) * 3.33;

    return nineBoxData.filter((emp: any) => {
      if (selectedDepartment !== "all" && emp.departmentId !== Number(selectedDepartment)) {
        return false;
      }
      return (
        emp.performanceScore >= minPerformance &&
        emp.performanceScore < maxPerformance &&
        emp.potentialScore >= minPotential &&
        emp.potentialScore < maxPotential
      );
    });
  };

  const getTotalEmployees = () => {
    if (!nineBoxData) return 0;
    if (selectedDepartment === "all") return nineBoxData.length;
    return nineBoxData.filter((emp: any) => emp.departmentId === Number(selectedDepartment)).length;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Grid3x3 className="h-8 w-8" />
              Matriz 9-Box
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualize e gerencie talentos por desempenho e potencial
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments?.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Colaboradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalEmployees()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estrelas (Alto/Alto)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getEmployeesInBox(2, 2).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alto Potencial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getEmployeesInBox(2, 0).length + getEmployeesInBox(2, 1).length + getEmployeesInBox(2, 2).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Necessitam Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {getEmployeesInBox(0, 0).length + getEmployeesInBox(0, 1).length + getEmployeesInBox(1, 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 9-Box Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Talentos</CardTitle>
            <CardDescription>
              Clique em cada quadrante para ver os colaboradores posicionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Axis Labels */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground">
                  ← Desempenho →
                </div>
                <div className="text-sm font-medium text-muted-foreground rotate-[-90deg] absolute left-4">
                  ← Potencial →
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-3 relative pl-12">
                {[2, 1, 0].map((row) => (
                  <div key={row} className="contents">
                    {[0, 1, 2].map((col) => {
                      const employees = getEmployeesInBox(row, col);
                      const boxColor = getBoxColor(
                        (col + 0.5) * 3.33,
                        (row + 0.5) * 3.33
                      );

                      return (
                        <Card
                          key={`${row}-${col}`}
                          className={`min-h-[180px] border-2 ${boxColor} hover:shadow-lg transition-shadow cursor-pointer`}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">
                              {getBoxLabel(row, col)}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {getBoxDescription(row, col)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {employees.length} colaborador(es)
                                </span>
                                {employees.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round((employees.length / getTotalEmployees()) * 100)}%
                                  </Badge>
                                )}
                              </div>
                              {employees.length > 0 && (
                                <div className="space-y-1">
                                  {employees.slice(0, 3).map((emp: any) => (
                                    <div
                                      key={emp.id}
                                      className="text-xs p-1 bg-background/50 rounded flex items-center gap-1"
                                    >
                                      <Users className="h-3 w-3" />
                                      <span className="truncate">{emp.name}</span>
                                    </div>
                                  ))}
                                  {employees.length > 3 && (
                                    <div className="text-xs text-muted-foreground text-center">
                                      +{employees.length - 3} mais
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Baixo (0-3.3)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Desempenho / Potencial
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Médio (3.3-6.6)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Desempenho / Potencial
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Alto (6.6-10)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Desempenho / Potencial
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Como usar a Matriz 9-Box
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              A Matriz 9-Box é uma ferramenta estratégica de gestão de talentos que avalia colaboradores em duas dimensões:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Desempenho (eixo horizontal):</strong> Resultados atuais e entregas do colaborador</li>
              <li><strong>Potencial (eixo vertical):</strong> Capacidade de crescimento e assumir responsabilidades maiores</li>
            </ul>
            <p className="pt-2">
              <strong>Ações recomendadas por quadrante:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Estrelas (alto/alto):</strong> Preparar para sucessão, desafios estratégicos</li>
              <li><strong>Alto Potencial:</strong> Investir em desenvolvimento acelerado</li>
              <li><strong>Profissionais Sólidos:</strong> Reconhecer expertise, manter engajamento</li>
              <li><strong>Risco (baixo/baixo):</strong> Plano de melhoria ou desligamento</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
