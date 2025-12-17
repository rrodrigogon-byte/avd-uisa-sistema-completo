import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";

export interface CompetenciesData {
  selectedCompetencies: number[];
}

interface CompetenciesSelectorProps {
  data: CompetenciesData;
  onChange: (data: CompetenciesData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CompetenciesSelector({ data, onChange, onNext, onBack }: CompetenciesSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: competencies, isLoading } = trpc.competencies.list.useQuery();

  const filteredCompetencies = useMemo(() => {
    if (!competencies) return [];
    if (!searchTerm.trim()) return competencies;
    
    const term = searchTerm.toLowerCase();
    return competencies.filter(comp => 
      comp.name.toLowerCase().includes(term) || 
      comp.description?.toLowerCase().includes(term)
    );
  }, [competencies, searchTerm]);

  const handleToggle = (competencyId: number) => {
    const isSelected = data.selectedCompetencies.includes(competencyId);
    const newSelection = isSelected
      ? data.selectedCompetencies.filter(id => id !== competencyId)
      : [...data.selectedCompetencies, competencyId];
    
    onChange({ selectedCompetencies: newSelection });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (data.selectedCompetencies.length === 0) {
      alert("Selecione pelo menos uma competência para avaliar");
      return;
    }
    
    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Carregando competências...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Competências Disponíveis</h3>
            <p className="text-sm text-muted-foreground">
              {data.selectedCompetencies.length} de {competencies?.length || 0} selecionadas
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar competências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
          {filteredCompetencies.map((competency) => {
            const isSelected = data.selectedCompetencies.includes(competency.id);
            
            return (
              <Card 
                key={competency.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'
                }`}
                onClick={() => handleToggle(competency.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {competency.name}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </CardTitle>
                      {competency.description && (
                        <CardDescription className="mt-1.5 text-xs">
                          {competency.description}
                        </CardDescription>
                      )}
                    </div>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(competency.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardHeader>
                {competency.category && (
                  <CardContent className="pt-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                      {competency.category}
                    </span>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filteredCompetencies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Nenhuma competência encontrada com esse termo de busca"
                : "Nenhuma competência cadastrada no sistema"
              }
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" disabled={data.selectedCompetencies.length === 0}>
          Próximo: Adicionar Participantes
        </Button>
      </div>
    </form>
  );
}
