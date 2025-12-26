/**
 * Hook para verificação de permissões no frontend
 * Integrado com sistema de controle de acesso baseado em SOX
 */

import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

/**
 * Hook para verificar se usuário tem permissão específica
 */
export function usePermission(resource: string, action: string) {
  const { data: hasPermission, isLoading } = trpc.accessControl.checkPermission.useQuery({
    resource,
    action,
  });

  return {
    hasPermission: hasPermission ?? false,
    isLoading,
  };
}

/**
 * Hook para obter todas as permissões do usuário atual
 */
export function useMyPermissions() {
  const { data: permissions, isLoading } = trpc.accessControl.getMyPermissions.useQuery(undefined);

  const permissionsMap = useMemo(() => {
    if (!permissions) return new Map<string, Set<string>>();

    const map = new Map<string, Set<string>>();
    permissions.forEach((perm) => {
      if (!map.has(perm.resource)) {
        map.set(perm.resource, new Set());
      }
      map.get(perm.resource)!.add(perm.action);
    });
    return map;
  }, [permissions]);

  const hasPermission = (resource: string, action: string) => {
    return permissionsMap.get(resource)?.has(action) ?? false;
  };

  const hasAnyPermission = (resource: string, actions: string[]) => {
    const resourcePerms = permissionsMap.get(resource);
    if (!resourcePerms) return false;
    return actions.some((action) => resourcePerms.has(action));
  };

  const hasAllPermissions = (resource: string, actions: string[]) => {
    const resourcePerms = permissionsMap.get(resource);
    if (!resourcePerms) return false;
    return actions.every((action) => resourcePerms.has(action));
  };

  return {
    permissions: permissions ?? [],
    permissionsMap,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
  };
}

/**
 * Hook para obter perfis do usuário atual
 */
export function useMyProfiles() {
  const { data: profiles, isLoading } = trpc.accessControl.getUserProfiles.useQuery(undefined);

  const isAdmin = useMemo(() => {
    return profiles?.some((p) => p.code === "admin") ?? false;
  }, [profiles]);

  const isRhGerente = useMemo(() => {
    return profiles?.some((p) => p.code === "rh_gerente") ?? false;
  }, [profiles]);

  const isEspecialistaCS = useMemo(() => {
    return profiles?.some((p) => p.code === "especialista_cs") ?? false;
  }, [profiles]);

  const isLider = useMemo(() => {
    return profiles?.some((p) => p.code === "lider") ?? false;
  }, [profiles]);

  const isUsuario = useMemo(() => {
    return profiles?.some((p) => p.code === "usuario") ?? false;
  }, [profiles]);

  return {
    profiles: profiles ?? [],
    isAdmin,
    isRhGerente,
    isEspecialistaCS,
    isLider,
    isUsuario,
    isLoading,
  };
}
