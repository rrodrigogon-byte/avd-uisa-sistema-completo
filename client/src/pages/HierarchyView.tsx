import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, TrendingUp, Building2, User, Mail, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function HierarchyView() {
  const [searchChapa, setSearchChapa] = useState("");
  const [selectedChapa, setSelectedChapa] = useState<string | null>(null);

  // Buscar estatísticas
  const { data: stats, isLoading: statsLoading } = trpc.hierarchy.getStats.useQuery();

  // Buscar hierarquia por chapa
  const { data: hierarchy, isLoading: hierarchyLoading, refetch } = trpc.hierarchy.getByChapa.useQuery(
    { chapa: selectedChapa || "" },
    { enabled: !!selectedChapa }
  );

  // Buscar cadeia hierárquica
  const { data: chain, isLoading: chainLoading } = trpc.hierarchy.getChain.useQuery(
    { employeeId: hierarchy?.employeeId || 0 },
    { enabled: !!hierarchy?.employeeId }
  );

  const handleSearch = () => {
    if (!searchChapa.trim()) {
      toast.error("Por favor, informe uma chapa para buscar");
      return;
    }
    setSelectedChapa(searchChapa.trim());
    refetch();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Hierarquia Organizacional</h1>
        <p className="text-muted-foreground mt-2">
          Visualize a estrutura hierárquica da organização e os vínculos entre funcionários e líderes
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coordenadores</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.uniqueCoordinators || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestores</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.uniqueManagers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diretores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.uniqueDirectors || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Funcionário</CardTitle>
          <CardDescription>
            Informe a chapa do funcionário para visualizar sua hierarquia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Digite a chapa do funcionário..."
              value={searchChapa}
              onChange={(e) => setSearchChapa(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={hierarchyLoading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Busca */}
      {selectedChapa && (
        <>
          {hierarchyLoading ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ) : hierarchy ? (
            <div className="space-y-6">
              {/* Dados do Funcionário */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Funcionário</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Chapa</label>
                      <p className="text-lg font-semibold">{hierarchy.employeeChapa}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome</label>
                      <p className="text-lg font-semibold">{hierarchy.employeeName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-lg">{hierarchy.employeeEmail || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Função</label>
                      <p className="text-lg">{hierarchy.employeeFunction || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Seção</label>
                      <p className="text-lg">{hierarchy.employeeSection || "Não informado"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cadeia Hierárquica */}
              {chainLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <Skeleton className="h-60 w-full" />
                  </CardContent>
                </Card>
              ) : chain ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Cadeia Hierárquica</CardTitle>
                    <CardDescription>
                      Estrutura hierárquica completa do funcionário até o presidente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Presidente */}
                      {chain.president && (
                        <div className="border-l-4 border-purple-500 pl-4 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              Presidente
                            </Badge>
                          </div>
                          <p className="font-semibold">{chain.president.name}</p>
                          <p className="text-sm text-muted-foreground">{chain.president.function}</p>
                          {chain.president.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {chain.president.email}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Diretor */}
                      {chain.director && (
                        <div className="border-l-4 border-blue-500 pl-4 py-2 ml-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Diretor
                            </Badge>
                          </div>
                          <p className="font-semibold">{chain.director.name}</p>
                          <p className="text-sm text-muted-foreground">{chain.director.function}</p>
                          {chain.director.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {chain.director.email}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Gestor */}
                      {chain.manager && (
                        <div className="border-l-4 border-green-500 pl-4 py-2 ml-8">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Gestor
                            </Badge>
                          </div>
                          <p className="font-semibold">{chain.manager.name}</p>
                          <p className="text-sm text-muted-foreground">{chain.manager.function}</p>
                          {chain.manager.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {chain.manager.email}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Coordenador */}
                      {chain.coordinator && (
                        <div className="border-l-4 border-yellow-500 pl-4 py-2 ml-12">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              Coordenador
                            </Badge>
                          </div>
                          <p className="font-semibold">{chain.coordinator.name}</p>
                          <p className="text-sm text-muted-foreground">{chain.coordinator.function}</p>
                          {chain.coordinator.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {chain.coordinator.email}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Funcionário */}
                      <div className="border-l-4 border-gray-500 pl-4 py-2 ml-16">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            Funcionário
                          </Badge>
                        </div>
                        <p className="font-semibold">{chain.employee.name}</p>
                        <p className="text-sm text-muted-foreground">{chain.employee.function}</p>
                        {chain.employee.email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {chain.employee.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum funcionário encontrado com a chapa informada
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
