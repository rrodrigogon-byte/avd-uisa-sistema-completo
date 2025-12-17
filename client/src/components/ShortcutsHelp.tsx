import { useState } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, X } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/**
 * Componente de Ajuda de Atalhos de Teclado
 * Mostra todos os atalhos disponíveis no sistema
 * Atalho para abrir: Ctrl+/ ou ?
 */

interface Shortcut {
  keys: string;
  description: string;
  category?: string;
}

const shortcuts: Shortcut[] = [
  // Navegação
  {
    category: "Navegação",
    keys: "Ctrl + K",
    description: "Abrir busca global",
  },
  {
    category: "Navegação",
    keys: "Ctrl + H",
    description: "Ir para página inicial (Dashboard)",
  },
  {
    category: "Navegação",
    keys: "Ctrl + /",
    description: "Mostrar esta ajuda de atalhos",
  },
  {
    category: "Navegação",
    keys: "Esc",
    description: "Fechar modal/dialog/busca",
  },

  // Busca Global
  {
    category: "Busca Global",
    keys: "↑ ↓",
    description: "Navegar pelos resultados",
  },
  {
    category: "Busca Global",
    keys: "Enter",
    description: "Selecionar resultado",
  },

  // Ações Rápidas
  {
    category: "Ações Rápidas",
    keys: "Ctrl + N",
    description: "Criar novo item (contexto)",
  },
  {
    category: "Ações Rápidas",
    keys: "Ctrl + S",
    description: "Salvar formulário",
  },
  {
    category: "Ações Rápidas",
    keys: "Ctrl + E",
    description: "Editar item atual",
  },

  // Tabelas e Listas
  {
    category: "Tabelas e Listas",
    keys: "Ctrl + F",
    description: "Focar no campo de filtro",
  },
  {
    category: "Tabelas e Listas",
    keys: "Ctrl + R",
    description: "Recarregar dados",
  },

  // Notificações
  {
    category: "Notificações",
    keys: "Ctrl + Shift + N",
    description: "Abrir central de notificações",
  },
];

// Agrupar atalhos por categoria
const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
  const category = shortcut.category || "Outros";
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(shortcut);
  return acc;
}, {} as Record<string, Shortcut[]>);

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  // Atalho Ctrl+/ para abrir
  useKeyboardShortcuts([
    {
      key: "/",
      ctrl: true,
      description: "Mostrar ajuda de atalhos",
      action: () => setOpen(true),
    },
    {
      key: "?",
      shift: true,
      description: "Mostrar ajuda de atalhos",
      action: () => setOpen(true),
    },
  ]);

  return (
    <>
      {/* Botão flutuante para abrir ajuda */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
        onClick={() => setOpen(true)}
        title="Atalhos de teclado (Ctrl+/)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Keyboard className="h-6 w-6" />
              Atalhos de Teclado
            </DialogTitle>
            <DialogDescription>
              Use estes atalhos para navegar mais rapidamente pelo sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.split(" + ").map((key, i, arr) => (
                          <span key={i} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">
                              {key}
                            </kbd>
                            {i < arr.length - 1 && (
                              <span className="text-muted-foreground text-xs">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Dica:</strong> Pressione{" "}
              <kbd className="px-2 py-1 bg-background rounded text-xs">Esc</kbd> para
              fechar qualquer modal ou dialog.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Hook para usar atalhos de teclado em páginas específicas
 * 
 * @example
 * ```tsx
 * usePageShortcuts({
 *   onNew: () => navigate('/metas/nova'),
 *   onSave: () => handleSave(),
 *   onRefresh: () => refetch(),
 * });
 * ```
 */
export function usePageShortcuts(options?: {
  onNew?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
  onFilter?: () => void;
}) {
  useKeyboardShortcuts([
    ...(options?.onNew
      ? [
          {
            key: "n",
            ctrl: true,
            description: "Criar novo",
            action: options.onNew,
          },
        ]
      : []),
    ...(options?.onSave
      ? [
          {
            key: "s",
            ctrl: true,
            description: "Salvar",
            action: options.onSave,
          },
        ]
      : []),
    ...(options?.onEdit
      ? [
          {
            key: "e",
            ctrl: true,
            description: "Editar",
            action: options.onEdit,
          },
        ]
      : []),
    ...(options?.onRefresh
      ? [
          {
            key: "r",
            ctrl: true,
            description: "Recarregar",
            action: options.onRefresh,
          },
        ]
      : []),
    ...(options?.onFilter
      ? [
          {
            key: "f",
            ctrl: true,
            description: "Filtrar",
            action: options.onFilter,
          },
        ]
      : []),
  ]);
}
