import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Medal, Award, TrendingUp, Star } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Página de Ranking de Gamificação
 * Exibe rankings gerais, mensais e por departamento
 */
export default function RankingGamificacao() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const [rankingType, setRankingType] = useState<"geral" | "mensal">("geral");

  // Queries
  const { data: ranking, isLoading } = trpc.gamification.getRanking.useQuery({
    limit: 50,
    departmentId: selectedDepartment,
  });

  const { data: monthlyRanking } = trpc.gamification.getMonthlyRanking.useQuery({
    limit: 10,
  });

  const { data: departments } = trpc.departments.list.useQuery();
  const { data: levels } = trpc.gamification.getLevels.useQuery();
  const { data: myStats } = trpc.gamification.getEmployeeStats.useQuery(
    { employeeId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">{rank}</span>;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Platina":
        return "bg-gradient-to-r from-cyan-500 to-blue-500 text-white";
      case "Ouro":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case "Prata":
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      default:
        return "bg-gradient-to-r from-amber-700 to-amber-900 text-white";
    }
  };

  const displayRanking = rankingType === "geral" ? ranking : monthlyRanking;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-[#F39200]" />
          Ranking de Gamificação
        </h1>
        <p className="text-gray-600 mt-2">
          Acompanhe os melhores colaboradores e sua posição no ranking
        </p>
      </div>

      {/* Minhas Estatísticas */}
      {myStats && (
        <Card className="border-[#F39200] border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#F39200]" />
              Minhas Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pontos Totais</p>
                <p className="text-2xl font-bold text-[#F39200]">{myStats.points}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Nível Atual</p>
                <Badge className={getLevelColor(myStats.level)}>{myStats.level}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Badges Conquistados</p>
                <p className="text-2xl font-bold">{myStats.badges}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Progresso para Próximo Nível</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#F39200] h-2 rounded-full transition-all"
                      style={{ width: `${myStats.progressToNextLevel}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{Math.round(myStats.progressToNextLevel)}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Faltam {myStats.pointsToNextLevel} pontos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Select value={rankingType} onValueChange={(v: any) => setRankingType(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="geral">Ranking Geral</SelectItem>
            <SelectItem value="mensal">Ranking Mensal</SelectItem>
          </SelectContent>
        </Select>

        {rankingType === "geral" && (
          <Select
            value={selectedDepartment?.toString() || "all"}
            onValueChange={(v) => setSelectedDepartment(v === "all" ? undefined : Number(v))}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Todos os departamentos" />
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
        )}
      </div>

      {/* Tabela de Níveis */}
      <Card>
        <CardHeader>
          <CardTitle>Níveis de Gamificação</CardTitle>
          <CardDescription>Conquiste pontos e suba de nível</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {levels?.map((level: any) => (
              <div
                key={level.name}
                className={`p-4 rounded-lg ${getLevelColor(level.name)}`}
              >
                <h3 className="font-bold text-lg mb-2">{level.name}</h3>
                <p className="text-sm opacity-90">
                  {level.minPoints} - {level.maxPoints === Infinity ? "∞" : level.maxPoints} pontos
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>
            {rankingType === "geral" ? "Ranking Geral" : "Ranking do Mês"}
          </CardTitle>
          <CardDescription>
            {rankingType === "geral"
              ? "Top 50 colaboradores com mais pontos"
              : "Top 10 colaboradores do mês atual"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : displayRanking && displayRanking.length > 0 ? (
            <div className="space-y-3">
              {displayRanking.map((item: any) => (
                <div
                  key={item.employee.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                    item.rank <= 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-[#F39200]" : "bg-gray-50"
                  }`}
                >
                  {/* Posição */}
                  <div className="flex-shrink-0 w-12 flex justify-center">
                    {getMedalIcon(item.rank)}
                  </div>

                  {/* Informações do Colaborador */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.employee.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.position?.title || "Cargo não definido"} •{" "}
                      {item.department?.name || "Departamento não definido"}
                    </p>
                  </div>

                  {/* Nível */}
                  <div className="flex-shrink-0">
                    <Badge className={getLevelColor(item.employee.gamificationLevel || "Bronze")}>
                      {item.employee.gamificationLevel || "Bronze"}
                    </Badge>
                  </div>

                  {/* Pontos */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-2xl font-bold text-[#F39200]">
                      {item.employee.gamificationPoints || 0}
                    </p>
                    <p className="text-xs text-gray-500">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Nenhum colaborador no ranking ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
