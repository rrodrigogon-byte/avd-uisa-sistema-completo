import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Trophy, Award, Star, Lock, TrendingUp } from "lucide-react";
import * as LucideIcons from "lucide-react";

export default function Badges() {
  const { data: allBadges, isLoading: loadingBadges } = trpc.badges.getBadges.useQuery();
  const { data: myBadges, isLoading: loadingMyBadges } = trpc.badges.getEmployeeBadges.useQuery({});
  const { data: ranking, isLoading: loadingRanking } = trpc.badges.getRanking.useQuery({ limit: 10 });
  const { data: stats } = trpc.badges.getStats.useQuery();

  const earnedBadgeIds = new Set(myBadges?.badges.map((b: any) => b.badgeId) || []);

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Trophy;
    const Icon = (LucideIcons as any)[iconName];
    return Icon || Trophy;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      metas: "bg-blue-500",
      pdi: "bg-green-500",
      avaliacao: "bg-purple-500",
      feedback: "bg-orange-500",
      geral: "bg-gray-500",
    };
    return colors[category] || "bg-gray-500";
  };

  if (loadingBadges || loadingMyBadges || loadingRanking) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando badges...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🏆 Conquistas e Badges</h1>
        <p className="text-muted-foreground">
          Acompanhe suas conquistas e compare seu desempenho com outros colaboradores
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pontos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{myBadges?.totalPoints || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Badges Conquistados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {myBadges?.badgeCount || 0}/{stats?.totalBadgesAvailable || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {stats?.totalBadgesAvailable
                  ? Math.round(((myBadges?.badgeCount || 0) / stats.totalBadgesAvailable) * 100)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posição no Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">
                {ranking && myBadges && myBadges.badges.length > 0
                  ? (ranking.findIndex((r) => r.employeeId === myBadges.badges[0].badgeId) + 1 || "-")
                  : "-"}º
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-badges">Minhas Conquistas</TabsTrigger>
          <TabsTrigger value="all-badges">Todos os Badges</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* Minhas Conquistas */}
        <TabsContent value="my-badges" className="space-y-4">
          {myBadges && myBadges.badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBadges.badges.map((item: any) => {
                const Icon = getIcon(item.badge.icon);
                return (
                  <Card key={item.id} className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2 h-full ${getCategoryColor(item.badge.category)}`} />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{item.badge.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Conquistado em {new Date(item.earnedAt).toLocaleDateString("pt-BR")}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          +{item.badge.points} pts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.badge.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum badge conquistado ainda</p>
                <p className="text-muted-foreground">
                  Complete metas, PDIs e avaliações para ganhar seus primeiros badges!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Todos os Badges */}
        <TabsContent value="all-badges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBadges?.map((badge: any) => {
              const Icon = getIcon(badge.icon);
              const isEarned = earnedBadgeIds.has(badge.id);

              return (
                <Card
                  key={badge.id}
                  className={`relative overflow-hidden ${!isEarned ? "opacity-60" : ""}`}
                >
                  <div className={`absolute top-0 left-0 w-2 h-full ${getCategoryColor(badge.category)}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${isEarned ? "bg-primary/10" : "bg-muted"}`}>
                          {isEarned ? (
                            <Icon className="h-6 w-6 text-primary" />
                          ) : (
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{badge.name}</CardTitle>
                          <CardDescription className="text-xs mt-1 capitalize">{badge.category}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={isEarned ? "default" : "secondary"} className="ml-2">
                        {badge.points} pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    {!isEarned && (
                      <p className="text-xs text-muted-foreground mt-2 italic">🔒 Bloqueado</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Ranking */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🏆 Top 10 Colaboradores</CardTitle>
              <CardDescription>Ranking por pontos acumulados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ranking?.map((item: any, index: number) => (
                  <div
                    key={item.employeeId}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                            ? "bg-gray-400 text-white"
                            : index === 2
                            ? "bg-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.badgeCount} {item.badgeCount === 1 ? "badge" : "badges"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-lg font-bold">{item.totalPoints}</span>
                      <span className="text-sm text-muted-foreground">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
