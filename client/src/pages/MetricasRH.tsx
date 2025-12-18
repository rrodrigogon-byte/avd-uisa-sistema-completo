import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserMinus, 
  UserPlus, 
  ArrowRightLeft,
  BarChart3,
  PieChart,
  Calendar,
  Download
} from "lucide-react";

/**
 * Dashboard de Métricas de RH
 * Visualizações de turnover, promoções e distribuição hierárquica
 */
export default function MetricasRH() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Queries
  const { data: overview, isLoading: loadingOverview } = trpc.hrMetrics.getOverview.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: turnoverData, isLoading: loadingTurnover } = trpc.hrMetrics.getTurnoverData.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: promotionData, isLoading: loadingPromotions } = trpc.hrMetrics.getPromotionData.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: hierarchyData, isLoading: loadingHierarchy } = trpc.hrMetrics.getHierarchyDistribution.useQuery();

  const { data: movementStats, isLoading: loadingMovements } = trpc.hrMetrics.getMovementStats.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Métricas de RH</h1>
            <p className="text-muted-foreground mt-1">
              Análise de turnover, promoções e distribuição hierárquica
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        {/* Filtros de Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período de Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingOverview ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Funcionários Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(overview?.totalActiveEmployees || 0)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <UserMinus className="h-4 w-4 text-red-600" />
                    Desligamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatNumber(overview?.totalTerminated || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Taxa de Turnover: {formatPercent(overview?.turnoverRate || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Promoções
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatNumber(overview?.totalPromotions || 0)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-orange-600" />
                    Transferências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{formatNumber(overview?.totalTransfers || 0)}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs de Análises */}
        <Tabs defaultValue="turnover" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="turnover">Turnover</TabsTrigger>
            <TabsTrigger value="promotions">Promoções</TabsTrigger>
            <TabsTrigger value="hierarchy">Hierarquia</TabsTrigger>
          </TabsList>

          {/* Tab Turnover */}
          <TabsContent value="turnover" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Turnover por Departamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Turnover por Departamento
                  </CardTitle>
                  <CardDescription>Desligamentos distribuídos por área</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTurnover ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeMap(turnoverData?.byDepartment || [], (dept: any) => (
                        <div key={dept.departmentId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{dept.departmentName || "Sem Departamento"}</span>
                            <span className="text-muted-foreground">{dept.count} desligamentos</span>
                          </div>
                          <Progress 
                            value={(dept.count / (overview?.totalTerminated || 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))}
                      {(!turnoverData?.byDepartment || turnoverData.byDepartment.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum desligamento registrado no período
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Motivos de Desligamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Principais Motivos
                  </CardTitle>
                  <CardDescription>Top 10 motivos de desligamento</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTurnover ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeMap(turnoverData?.reasons || [], (reason: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate flex-1 mr-2">{reason.reason}</span>
                            <span className="text-muted-foreground">{reason.count}</span>
                          </div>
                          <Progress 
                            value={(reason.count / (overview?.totalTerminated || 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))}
                      {(!turnoverData?.reasons || turnoverData.reasons.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum motivo registrado
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Promoções */}
          <TabsContent value="promotions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tempo Médio até Promoção */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tempo Médio até Promoção
                  </CardTitle>
                  <CardDescription>Tempo médio desde a contratação até a primeira promoção</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPromotions ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-5xl font-bold text-green-600">
                        {promotionData?.averageTimeToPromotion?.months || 0}
                      </div>
                      <p className="text-muted-foreground mt-2">meses em média</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ({promotionData?.averageTimeToPromotion?.days || 0} dias)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Promoções por Departamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Promoções por Departamento
                  </CardTitle>
                  <CardDescription>Distribuição de promoções por área</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPromotions ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeMap(promotionData?.byDepartment || [], (dept: any) => (
                        <div key={dept.departmentId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{dept.departmentName || "Sem Departamento"}</span>
                            <span className="text-muted-foreground">{dept.count} promoções</span>
                          </div>
                          <Progress 
                            value={(dept.count / (overview?.totalPromotions || 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))}
                      {(!promotionData?.byDepartment || promotionData.byDepartment.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma promoção registrada no período
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Hierarquia */}
          <TabsContent value="hierarchy" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Distribuição por Departamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Funcionários por Departamento
                  </CardTitle>
                  <CardDescription>Distribuição atual da força de trabalho</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHierarchy ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeMap(hierarchyData?.byDepartment || [], (dept: any) => (
                        <div key={dept.departmentId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{dept.departmentName || "Sem Departamento"}</span>
                            <span className="text-muted-foreground">{dept.count} funcionários</span>
                          </div>
                          <Progress 
                            value={(dept.count / (overview?.totalActiveEmployees || 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))}
                      {(!hierarchyData?.byDepartment || hierarchyData.byDepartment.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum dado disponível
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Distribuição por Cargo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Funcionários por Cargo
                  </CardTitle>
                  <CardDescription>Distribuição por posição hierárquica</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHierarchy ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {safeMap(hierarchyData?.byPosition || [], (pos: any) => (
                        <div key={pos.positionId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{pos.positionTitle || "Sem Cargo"}</span>
                            <span className="text-muted-foreground">{pos.count} funcionários</span>
                          </div>
                          <Progress 
                            value={(pos.count / (overview?.totalActiveEmployees || 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))}
                      {(!hierarchyData?.byPosition || hierarchyData.byPosition.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum dado disponível
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Estrutura de Gestão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estrutura de Gestão
                </CardTitle>
                <CardDescription>Distribuição de subordinados por gestor</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHierarchy ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">Funcionários sem Gestor</div>
                        <div className="text-2xl font-bold text-blue-600 mt-1">
                          {hierarchyData?.managementStructure?.topLevelEmployees || 0}
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-900">Total de Gestores</div>
                        <div className="text-2xl font-bold text-green-600 mt-1">
                          {hierarchyData?.managementStructure?.managersWithSubordinates?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {safeMap(hierarchyData?.managementStructure?.managersWithSubordinates || [], (mgr: any) => (
                        <div key={mgr.managerId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{mgr.managerName || "Gestor Desconhecido"}</span>
                            <span className="text-muted-foreground">{mgr.subordinatesCount} subordinados</span>
                          </div>
                          <Progress 
                            value={(mgr.subordinatesCount / (overview?.totalActiveEmployees || 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))}
                      {(!hierarchyData?.managementStructure?.managersWithSubordinates || 
                        hierarchyData.managementStructure.managersWithSubordinates.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum gestor com subordinados encontrado
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
