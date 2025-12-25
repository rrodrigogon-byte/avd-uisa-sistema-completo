import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, BookOpen, TrendingUp, Star } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de Busca CBO (Classificação Brasileira de Ocupações)
 * Permite buscar cargos, visualizar detalhes e importar para o cache local
 */
export default function BuscaCBO() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCargo, setSelectedCargo] = useState<any>(null);

  // Queries
  const searchQuery = trpc.cbo.search.useQuery(
    { searchTerm, limit: 20 },
    { enabled: searchTerm.length >= 2 }
  );

  const suggestionsQuery = trpc.cbo.getSuggestions.useQuery({ limit: 10 });
  const topCargosQuery = trpc.cbo.getTopCargos.useQuery({ limit: 20 });

  // Mutations
  const importCargoMutation = trpc.cbo.importCargo.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Cargo importado com sucesso!");
        searchQuery.refetch();
      } else {
        toast.error("Não foi possível importar o cargo");
      }
    },
    onError: () => {
      toast.error("Erro ao importar cargo");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length < 2) {
      toast.error("Digite pelo menos 2 caracteres para buscar");
      return;
    }
    searchQuery.refetch();
  };

  const handleSelectCargo = (cargo: any) => {
    setSelectedCargo(cargo);
  };

  const handleImportCargo = (codigoCBO: string) => {
    importCargoMutation.mutate({ codigoCBO });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Busca CBO</h1>
          <p className="text-slate-600 mt-1">
            Classificação Brasileira de Ocupações - Busque e importe cargos
          </p>
        </div>

        {/* Busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Cargo
            </CardTitle>
            <CardDescription>
              Digite o nome do cargo ou código CBO (formato: 9999-99)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Ex: Analista de RH, 2524-05..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={searchQuery.isLoading}>
                {searchQuery.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </form>

            {/* Resultados da busca */}
            {searchQuery.data && searchQuery.data.results.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-600">
                  {searchQuery.data.total} resultado(s) encontrado(s)
                </p>
                <div className="grid gap-2 max-h-96 overflow-y-auto">
                  {searchQuery.data.results.map((cargo: any) => (
                    <div
                      key={cargo.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectCargo(cargo)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{cargo.codigoCBO}</Badge>
                            <h3 className="font-semibold text-slate-900">{cargo.titulo}</h3>
                          </div>
                          {cargo.descricaoSumaria && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {cargo.descricaoSumaria}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Usado {cargo.vezesUtilizado}x</span>
                            {cargo.familiaOcupacional && (
                              <span>Família: {cargo.familiaOcupacional}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.data && searchQuery.data.results.length === 0 && (
              <p className="text-sm text-slate-500 mt-4">Nenhum resultado encontrado</p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sugestões baseadas em histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Sugestões para Você
              </CardTitle>
              <CardDescription>Baseado no seu histórico de buscas</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestionsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : suggestionsQuery.data && suggestionsQuery.data.suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestionsQuery.data.suggestions.map((cargo: any) => (
                    <div
                      key={cargo.id}
                      className="p-2 border rounded hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectCargo(cargo)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {cargo.codigoCBO}
                        </Badge>
                        <span className="text-sm font-medium">{cargo.titulo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma sugestão disponível</p>
              )}
            </CardContent>
          </Card>

          {/* Cargos mais utilizados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Mais Utilizados
              </CardTitle>
              <CardDescription>Cargos mais buscados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {topCargosQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : topCargosQuery.data && topCargosQuery.data.cargos.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {topCargosQuery.data.cargos.slice(0, 10).map((cargo: any) => (
                    <div
                      key={cargo.id}
                      className="p-2 border rounded hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectCargo(cargo)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Badge variant="secondary" className="text-xs">
                            {cargo.codigoCBO}
                          </Badge>
                          <span className="text-sm font-medium truncate">{cargo.titulo}</span>
                        </div>
                        <span className="text-xs text-slate-500">{cargo.vezesUtilizado}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhum cargo disponível</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do cargo selecionado */}
        {selectedCargo && (
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Detalhes do Cargo
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{selectedCargo.codigoCBO}</Badge>
                    <h2 className="text-xl font-bold">{selectedCargo.titulo}</h2>
                  </div>
                </div>
                <Button
                  onClick={() => handleImportCargo(selectedCargo.codigoCBO)}
                  disabled={importCargoMutation.isPending}
                >
                  {importCargoMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    "Atualizar Cache"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCargo.descricaoSumaria && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Descrição Sumária</h3>
                  <p className="text-sm text-slate-700">{selectedCargo.descricaoSumaria}</p>
                </div>
              )}

              {selectedCargo.formacao && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Formação</h3>
                  <p className="text-sm text-slate-700">{selectedCargo.formacao}</p>
                </div>
              )}

              {selectedCargo.experiencia && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Experiência</h3>
                  <p className="text-sm text-slate-700">{selectedCargo.experiencia}</p>
                </div>
              )}

              {selectedCargo.atividadesPrincipais &&
                Array.isArray(selectedCargo.atividadesPrincipais) &&
                selectedCargo.atividadesPrincipais.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Atividades Principais</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedCargo.atividadesPrincipais.map((atividade: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700">
                          {atividade}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedCargo.competenciasPessoais &&
                Array.isArray(selectedCargo.competenciasPessoais) &&
                selectedCargo.competenciasPessoais.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Competências Pessoais</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCargo.competenciasPessoais.map((comp: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t">
                <span>Utilizado {selectedCargo.vezesUtilizado} vezes</span>
                {selectedCargo.familiaOcupacional && (
                  <span>Família: {selectedCargo.familiaOcupacional}</span>
                )}
                {selectedCargo.ultimaAtualizacao && (
                  <span>
                    Atualizado em:{" "}
                    {new Date(selectedCargo.ultimaAtualizacao).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
