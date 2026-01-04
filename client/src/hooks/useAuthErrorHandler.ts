import { useEffect, useRef } from 'react';
import { TRPCClientError } from '@trpc/client';
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { toast } from 'sonner';
import { getLoginUrl } from '@/const';

/**
 * Hook para gerenciar erros de autenticação de forma centralizada
 * Fornece feedback visual e redirecionamento automático
 */
export function useAuthErrorHandler() {
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownToastRef = useRef(false);

  const handleAuthError = (error: unknown) => {
    if (!(error instanceof TRPCClientError)) return false;
    if (typeof window === 'undefined') return false;

    const isUnauthorized = error.message === UNAUTHED_ERR_MSG || 
                          error.data?.code === 'UNAUTHORIZED' ||
                          error.shape?.data?.code === 'UNAUTHORIZED';

    if (!isUnauthorized) return false;

    // Evitar múltiplos toasts
    if (!hasShownToastRef.current) {
      hasShownToastRef.current = true;
      
      toast.error('Sessão expirada', {
        description: 'Você será redirecionado para o login em 3 segundos...',
        duration: 3000,
      });

      // Limpar timeout anterior se existir
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }

      // Redirecionar após 3 segundos
      redirectTimeoutRef.current = setTimeout(() => {
        // Salvar URL atual para retornar após login
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        
        window.location.href = getLoginUrl();
      }, 3000);
    }

    return true;
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  return { handleAuthError };
}

/**
 * Função utilitária para verificar se um erro é de autenticação
 */
export function isAuthError(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;
  
  return error.message === UNAUTHED_ERR_MSG || 
         error.data?.code === 'UNAUTHORIZED' ||
         error.shape?.data?.code === 'UNAUTHORIZED';
}

/**
 * Função para redirecionar após login bem-sucedido
 */
export function redirectAfterLogin() {
  const redirectPath = sessionStorage.getItem('redirectAfterLogin');
  
  if (redirectPath && redirectPath !== '/login') {
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectPath;
  } else {
    window.location.href = '/';
  }
}
