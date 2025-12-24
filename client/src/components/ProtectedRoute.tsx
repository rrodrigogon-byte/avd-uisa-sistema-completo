import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode, useEffect } from "react";
import { toast } from "sonner";

type UserRole = "admin" | "rh" | "gestor" | "colaborador";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

/**
 * Componente para proteger rotas baseado em roles de usuário
 * 
 * @param children - Conteúdo a ser renderizado se o acesso for permitido
 * @param allowedRoles - Array de roles permitidas (se não especificado, permite qualquer usuário autenticado)
 * @param requireAuth - Se true, requer autenticação (padrão: true)
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Se requer autenticação e não está autenticado
    if (requireAuth && !loading && !isAuthenticated) {
      toast.error("Você precisa estar autenticado para acessar esta página");
      setLocation("/");
      return;
    }

    // Se tem roles específicas e o usuário não tem permissão
    if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
      toast.error("Você não tem permissão para acessar esta página");
      setLocation("/");
      return;
    }
  }, [user, loading, isAuthenticated, requireAuth, allowedRoles, setLocation]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se requer autenticação e não está autenticado, não renderiza nada (redirect acontece no useEffect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Se tem roles específicas e o usuário não tem permissão, não renderiza nada (redirect acontece no useEffect)
  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    return null;
  }

  // Usuário tem permissão, renderiza o conteúdo
  return <>{children}</>;
}

/**
 * Hook para verificar se o usuário tem uma role específica
 */
export function useHasRole(role: UserRole | UserRole[]): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role as UserRole);
  }
  
  return user.role === role;
}

/**
 * Hook para verificar se o usuário é admin
 */
export function useIsAdmin(): boolean {
  return useHasRole("admin");
}

/**
 * Hook para verificar se o usuário é RH (admin ou rh)
 */
export function useIsRH(): boolean {
  return useHasRole(["admin", "rh"]);
}

/**
 * Hook para verificar se o usuário é gestor (admin, rh ou gestor)
 */
export function useIsGestor(): boolean {
  return useHasRole(["admin", "rh", "gestor"]);
}
