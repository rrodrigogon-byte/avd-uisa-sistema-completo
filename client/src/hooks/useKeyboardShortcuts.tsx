import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

const shortcuts: KeyboardShortcut[] = [
  {
    key: "k",
    ctrl: true,
    description: "Abrir busca global",
    action: () => {
      // Dispara evento customizado que o GlobalSearch escuta
      window.dispatchEvent(new CustomEvent("open-global-search"));
    },
  },
  {
    key: "h",
    ctrl: true,
    description: "Ir para início",
    action: () => {
      window.location.href = "/";
    },
  },
  {
    key: "m",
    ctrl: true,
    description: "Ir para metas",
    action: () => {
      window.location.href = "/metas";
    },
  },
  {
    key: "a",
    ctrl: true,
    description: "Ir para avaliações",
    action: () => {
      window.location.href = "/avaliacoes";
    },
  },
  {
    key: "p",
    ctrl: true,
    description: "Ir para PDI",
    action: () => {
      window.location.href = "/pdi";
    },
  },
  {
    key: "t",
    ctrl: true,
    description: "Ir para minhas atividades",
    action: () => {
      window.location.href = "/minhas-atividades";
    },
  },
  {
    key: "?",
    shift: true,
    description: "Mostrar atalhos de teclado",
    action: () => {
      window.dispatchEvent(new CustomEvent("show-keyboard-shortcuts"));
    },
  },
  {
    key: "n",
    ctrl: true,
    description: "Nova meta (quando em /metas)",
    action: () => {
      if (window.location.pathname === "/metas") {
        window.location.href = "/metas/criar";
      }
    },
    enabled: () => window.location.pathname === "/metas",
  },
];

export function useKeyboardShortcuts() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorar se estiver em input, textarea ou contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      // Permitir apenas Ctrl+K para busca global
      if (!(e.key === "k" && (e.ctrlKey || e.metaKey))) {
        return;
      }
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        shiftMatch &&
        altMatch
      ) {
        // Verificar se o atalho está habilitado
        if (shortcut.enabled && !shortcut.enabled()) {
          continue;
        }

        e.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

// Componente para mostrar lista de atalhos
export function KeyboardShortcutsHelp() {
  const shortcuts = useKeyboardShortcuts();

  useEffect(() => {
    const handleShow = () => {
      toast.info(
        <div className="space-y-2">
          <div className="font-semibold mb-2">Atalhos de Teclado</div>
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{shortcut.description}</span>
              <kbd className="ml-4 px-2 py-1 bg-muted rounded text-xs font-mono">
                {shortcut.ctrl && "Ctrl+"}
                {shortcut.shift && "Shift+"}
                {shortcut.alt && "Alt+"}
                {shortcut.key.toUpperCase()}
              </kbd>
            </div>
          ))}
        </div>,
        { duration: 10000 }
      );
    };

    window.addEventListener("show-keyboard-shortcuts", handleShow);
    return () => window.removeEventListener("show-keyboard-shortcuts", handleShow);
  }, [shortcuts]);

  return null;
}

// Hook para registrar atalhos personalizados em páginas específicas
export function usePageShortcuts(pageShortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of pageShortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          if (shortcut.enabled && !shortcut.enabled()) {
            continue;
          }

          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pageShortcuts]);
}
