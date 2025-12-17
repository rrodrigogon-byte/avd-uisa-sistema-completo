import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Target, FileText, BookOpen, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: number;
  type: "employee" | "goal" | "evaluation" | "pdi" | "job_description" | "cycle";
  title: string;
  subtitle?: string;
  url: string;
}

const typeIcons = {
  employee: User,
  goal: Target,
  evaluation: CheckCircle2,
  pdi: BookOpen,
  job_description: FileText,
  cycle: Calendar,
};

const typeLabels = {
  employee: "Funcionário",
  goal: "Meta",
  evaluation: "Avaliação",
  pdi: "PDI",
  job_description: "Descrição de Cargo",
  cycle: "Ciclo",
};

const typeColors = {
  employee: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  goal: "bg-green-500/10 text-green-700 dark:text-green-400",
  evaluation: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  pdi: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  job_description: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  cycle: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, navigate] = useLocation();

  // Query com debounce e tRPC
  const searchQuery = trpc.search.global.useQuery(
    { query, limit: 20 },
    {
      enabled: query.length >= 2,
      staleTime: 30000, // 30 segundos
    }
  );

  const results = searchQuery.data || [];

  // Navegação com teclado
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex]);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Reset selectedIndex quando resultados mudam
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.url);
      onOpenChange(false);
      setQuery("");
    },
    [navigate, onOpenChange]
  );



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Busca Global
          </DialogTitle>
          <DialogDescription>
            Pesquise funcionários, metas, avaliações, PDIs e mais
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite para buscar... (mínimo 2 caracteres)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-[400px] px-2">
          {query.length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Digite pelo menos 2 caracteres para buscar</p>
              <div className="mt-4 space-y-1 text-xs">
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd> +{" "}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">K</kbd> para abrir
                </p>
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>{" "}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">↓</kbd> para navegar
                </p>
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> para
                  selecionar
                </p>
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> para fechar
                </p>
              </div>
            </div>
          ) : searchQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Buscando...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum resultado encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="py-2 space-y-1">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type];
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                      "hover:bg-accent focus:bg-accent focus:outline-none",
                      isSelected && "bg-accent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 p-1.5 rounded",
                          typeColors[result.type]
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {result.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            {typeLabels[result.type]}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t text-xs text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado
            {results.length !== 1 ? "s" : ""}
          </div>
        )}
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
