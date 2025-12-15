import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

/**
 * Hook para gerenciar atalhos de teclado globais
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 'k',
 *     ctrl: true,
 *     description: 'Abrir busca',
 *     action: () => setSearchOpen(true),
 *   },
 *   {
 *     key: 'n',
 *     ctrl: true,
 *     description: 'Novo item',
 *     action: () => navigate('/novo'),
 *   },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignorar se estiver em um campo de input/textarea (exceto se for Escape)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField && event.key !== "Escape") {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const metaMatches = shortcut.meta ? event.metaKey : true;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Hook com atalhos de teclado padrão do dashboard
 * 
 * Atalhos incluídos:
 * - Ctrl+K: Abrir busca global
 * - Ctrl+H: Ir para home
 * - Ctrl+/: Mostrar ajuda de atalhos
 * - Escape: Fechar modals/dialogs
 */
export function useDashboardShortcuts(options?: {
  onSearch?: () => void;
  onHome?: () => void;
  onHelp?: () => void;
  onEscape?: () => void;
}) {
  const [, navigate] = useLocation();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "k",
      ctrl: true,
      description: "Abrir busca global",
      action: () => {
        if (options?.onSearch) {
          options.onSearch();
        } else {
          // Focar no campo de busca se existir
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="search"], input[placeholder*="Buscar"]'
          );
          if (searchInput) {
            searchInput.focus();
          }
        }
      },
    },
    {
      key: "h",
      ctrl: true,
      description: "Ir para página inicial",
      action: () => {
        if (options?.onHome) {
          options.onHome();
        } else {
          navigate("/");
        }
      },
    },
    {
      key: "/",
      ctrl: true,
      description: "Mostrar ajuda de atalhos",
      action: () => {
        if (options?.onHelp) {
          options.onHelp();
        }
      },
    },
    {
      key: "Escape",
      description: "Fechar modal/dialog",
      action: () => {
        if (options?.onEscape) {
          options.onEscape();
        } else {
          // Tentar fechar o modal/dialog aberto
          const closeButton = document.querySelector<HTMLButtonElement>(
            '[role="dialog"] button[aria-label="Close"], [role="dialog"] [data-dismiss]'
          );
          if (closeButton) {
            closeButton.click();
          }
        }
      },
      preventDefault: false,
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

/**
 * Hook para exibir lista de atalhos disponíveis
 */
export function useShortcutsList(shortcuts: KeyboardShortcut[]) {
  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const keys: string[] = [];
    
    if (shortcut.ctrl) keys.push("Ctrl");
    if (shortcut.alt) keys.push("Alt");
    if (shortcut.shift) keys.push("Shift");
    if (shortcut.meta) keys.push("Cmd");
    
    keys.push(shortcut.key.toUpperCase());
    
    return keys.join(" + ");
  }, []);

  return shortcuts.map((shortcut) => ({
    keys: formatShortcut(shortcut),
    description: shortcut.description,
  }));
}
