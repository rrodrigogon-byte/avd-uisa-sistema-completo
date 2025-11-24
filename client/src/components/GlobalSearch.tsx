import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Target, FileText, TrendingUp, Calendar } from "lucide-react";
import { useLocation } from "wouter";

interface SearchResult {
  type: "employee" | "goal" | "evaluation" | "pdi" | "activity" | "page";
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [, setLocation] = useLocation();

  // Simular busca (em produção, usar tRPC query)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const mockResults: SearchResult[] = [
      // Páginas do sistema
      {
        type: "page",
        title: "Dashboard",
        subtitle: "Visão geral do sistema",
        url: "/",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        type: "page",
        title: "Metas",
        subtitle: "Gerenciar metas",
        url: "/metas",
        icon: <Target className="h-4 w-4" />,
      },
      {
        type: "page",
        title: "Avaliações",
        subtitle: "Avaliações de desempenho",
        url: "/avaliacoes",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        type: "page",
        title: "PDI",
        subtitle: "Plano de Desenvolvimento Individual",
        url: "/pdi",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        type: "page",
        title: "Minhas Atividades",
        subtitle: "Registro de atividades",
        url: "/minhas-atividades",
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        type: "page",
        title: "Alertas",
        subtitle: "Central de alertas",
        url: "/alertas",
        icon: <Target className="h-4 w-4" />,
      },
      {
        type: "page",
        title: "Discrepâncias",
        subtitle: "Análise de discrepâncias de ponto",
        url: "/discrepancias",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        type: "page",
        title: "Importação de Ponto",
        subtitle: "Upload de registros de ponto",
        url: "/importacao-ponto",
        icon: <Calendar className="h-4 w-4" />,
      },
    ];

    const filtered = mockResults.filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setLocation(result.url);
    onOpenChange(false);
    setQuery("");
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      employee: "Colaborador",
      goal: "Meta",
      evaluation: "Avaliação",
      pdi: "PDI",
      activity: "Atividade",
      page: "Página",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      employee: "bg-blue-100 text-blue-800",
      goal: "bg-green-100 text-green-800",
      evaluation: "bg-purple-100 text-purple-800",
      pdi: "bg-orange-100 text-orange-800",
      activity: "bg-yellow-100 text-yellow-800",
      page: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Busca Global</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaboradores, metas, avaliações, páginas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {query && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-start gap-3"
                >
                  <div className="mt-1">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{result.title}</span>
                      <Badge variant="outline" className={`text-xs ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Dica: Use atalhos de teclado</p>
              <ul className="space-y-1">
                <li>• <kbd className="px-2 py-1 bg-muted rounded">Ctrl+K</kbd> ou <kbd className="px-2 py-1 bg-muted rounded">Cmd+K</kbd> - Abrir busca</li>
                <li>• <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> - Fechar busca</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para atalho de teclado
export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
