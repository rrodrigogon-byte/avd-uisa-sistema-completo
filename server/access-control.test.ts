/**
 * Testes do Sistema de Controle de Acesso baseado em SOX
 */

import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import {
  getAllPermissions,
  getAllProfiles,
  getProfilePermissions,
  getUserProfiles,
  assignProfileToUser,
  revokeProfileFromUser,
  hasPermission,
  getUserPermissions,
} from "./db-access-control";

describe("Sistema de Controle de Acesso", () => {
  let testUserId: number;
  let adminProfileId: number;
  let rhGerenteProfileId: number;
  let especialistaProfileId: number;
  let liderProfileId: number;
  let usuarioProfileId: number;

  beforeAll(async () => {
    // Usar usuário de teste existente (ID 1 geralmente é o owner)
    testUserId = 1;

    // Buscar IDs dos perfis
    const profiles = await getAllProfiles();
    adminProfileId = profiles.find(p => p.code === "admin")?.id || 0;
    rhGerenteProfileId = profiles.find(p => p.code === "rh_gerente")?.id || 0;
    especialistaProfileId = profiles.find(p => p.code === "especialista_cs")?.id || 0;
    liderProfileId = profiles.find(p => p.code === "lider")?.id || 0;
    usuarioProfileId = profiles.find(p => p.code === "usuario")?.id || 0;
  });

  describe("Permissões", () => {
    it("deve listar todas as permissões", async () => {
      const permissions = await getAllPermissions();
      expect(permissions).toBeDefined();
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.length).toBe(67); // Número de permissões criadas no seed
    });

    it("deve ter permissões com estrutura correta", async () => {
      const permissions = await getAllPermissions();
      const firstPermission = permissions[0];
      
      expect(firstPermission).toHaveProperty("id");
      expect(firstPermission).toHaveProperty("resource");
      expect(firstPermission).toHaveProperty("action");
      expect(firstPermission).toHaveProperty("description");
      expect(firstPermission).toHaveProperty("category");
      expect(firstPermission.active).toBe(true);
    });
  });

  describe("Perfis", () => {
    it("deve listar todos os perfis", async () => {
      const profiles = await getAllProfiles();
      expect(profiles).toBeDefined();
      expect(profiles.length).toBe(5); // Admin, RH Gerente, Especialista C&S, Líder, Usuário
    });

    it("deve ter perfis ordenados por nível hierárquico", async () => {
      const profiles = await getAllProfiles();
      
      expect(profiles[0].code).toBe("admin");
      expect(profiles[0].level).toBe(1);
      
      expect(profiles[4].code).toBe("usuario");
      expect(profiles[4].level).toBe(5);
    });

    it("deve ter perfis com estrutura correta", async () => {
      const profiles = await getAllProfiles();
      const adminProfile = profiles.find(p => p.code === "admin");
      
      expect(adminProfile).toBeDefined();
      expect(adminProfile?.name).toBe("Administrador");
      expect(adminProfile?.description).toContain("Acesso total");
      expect(adminProfile?.active).toBe(true);
    });
  });

  describe("Permissões de Perfis", () => {
    it("Admin deve ter todas as permissões", async () => {
      const permissions = await getProfilePermissions(adminProfileId);
      const allPermissions = await getAllPermissions();
      
      expect(permissions.length).toBe(allPermissions.length);
    });

    it("RH Gerente não deve ter permissões de configuração", async () => {
      const permissions = await getProfilePermissions(rhGerenteProfileId);
      const configPermissions = permissions.filter(p => p.resource === "config");
      
      expect(configPermissions.length).toBe(0);
    });

    it("Especialista C&S deve ter permissões específicas", async () => {
      const permissions = await getProfilePermissions(especialistaProfileId);
      const recursos = new Set(permissions.map(p => p.resource));
      
      expect(recursos.has("pdi")).toBe(true);
      expect(recursos.has("cargos")).toBe(true);
      expect(recursos.has("salarios")).toBe(true);
      expect(recursos.has("bonus")).toBe(true);
      expect(recursos.has("competencias")).toBe(true);
    });

    it("Líder deve ter permissões de aprovação", async () => {
      const permissions = await getProfilePermissions(liderProfileId);
      const approvalPermissions = permissions.filter(p => p.action === "aprovar");
      
      expect(approvalPermissions.length).toBeGreaterThan(0);
    });

    it("Usuário deve ter apenas permissões de visualização pessoal", async () => {
      const permissions = await getProfilePermissions(usuarioProfileId);
      const recursos = new Set(permissions.map(p => p.resource));
      
      // Usuário não deve ter permissões administrativas
      expect(recursos.has("admin")).toBe(false);
      expect(recursos.has("config")).toBe(false);
    });
  });

  describe("Atribuição de Perfis", () => {
    it("deve atribuir perfil a usuário", async () => {
      await assignProfileToUser(testUserId, usuarioProfileId, testUserId);
      
      const userProfiles = await getUserProfiles(testUserId);
      const hasUsuarioProfile = userProfiles.some(p => p.id === usuarioProfileId);
      
      expect(hasUsuarioProfile).toBe(true);
    });

    it("deve revogar perfil de usuário", async () => {
      // Primeiro atribuir
      await assignProfileToUser(testUserId, liderProfileId, testUserId);
      
      // Depois revogar
      await revokeProfileFromUser(testUserId, liderProfileId, testUserId);
      
      const userProfiles = await getUserProfiles(testUserId);
      const hasLiderProfile = userProfiles.some(p => p.id === liderProfileId);
      
      expect(hasLiderProfile).toBe(false);
    });
  });

  describe("Verificação de Permissões", () => {
    it("deve verificar permissão corretamente", async () => {
      // Atribuir perfil de admin ao usuário de teste
      await assignProfileToUser(testUserId, adminProfileId, testUserId);
      
      // Admin deve ter todas as permissões
      const hasPermissionMetas = await hasPermission(testUserId, "metas", "criar");
      expect(hasPermissionMetas).toBe(true);
      
      const hasPermissionAdmin = await hasPermission(testUserId, "admin", "gerenciar_usuarios");
      expect(hasPermissionAdmin).toBe(true);
    });

    it("deve retornar false para permissão não existente", async () => {
      const hasNonExistentPermission = await hasPermission(testUserId, "recurso_inexistente", "acao_inexistente");
      expect(hasNonExistentPermission).toBe(false);
    });

    it("deve obter todas as permissões do usuário", async () => {
      // Atribuir perfil de especialista
      await assignProfileToUser(testUserId, especialistaProfileId, testUserId);
      
      const permissions = await getUserPermissions(testUserId);
      expect(permissions.length).toBeGreaterThan(0);
      
      // Verificar se tem permissões de PDI
      const hasPdiPermissions = permissions.some(p => p.resource === "pdi");
      expect(hasPdiPermissions).toBe(true);
    });
  });

  describe("Segregação de Funções (SOX)", () => {
    it("Usuário comum não deve ter permissões administrativas", async () => {
      // Limpar perfis anteriores
      const currentProfiles = await getUserProfiles(testUserId);
      for (const profile of currentProfiles) {
        await revokeProfileFromUser(testUserId, profile.id, testUserId);
      }
      
      // Atribuir apenas perfil de usuário
      await assignProfileToUser(testUserId, usuarioProfileId, testUserId);
      
      const hasAdminPermission = await hasPermission(testUserId, "admin", "gerenciar_usuarios");
      expect(hasAdminPermission).toBe(false);
      
      const hasConfigPermission = await hasPermission(testUserId, "config", "editar_sistema");
      expect(hasConfigPermission).toBe(false);
    });

    it("RH Gerente não deve modificar configurações críticas", async () => {
      // Limpar perfis anteriores
      const currentProfiles = await getUserProfiles(testUserId);
      for (const profile of currentProfiles) {
        await revokeProfileFromUser(testUserId, profile.id, testUserId);
      }
      
      // Atribuir perfil de RH Gerente
      await assignProfileToUser(testUserId, rhGerenteProfileId, testUserId);
      
      const hasConfigPermission = await hasPermission(testUserId, "config", "editar_regras");
      expect(hasConfigPermission).toBe(false);
    });

    it("Especialista C&S deve ter acesso limitado a áreas específicas", async () => {
      // Limpar perfis anteriores
      const currentProfiles = await getUserProfiles(testUserId);
      for (const profile of currentProfiles) {
        await revokeProfileFromUser(testUserId, profile.id, testUserId);
      }
      
      // Atribuir perfil de Especialista C&S
      await assignProfileToUser(testUserId, especialistaProfileId, testUserId);
      
      // Deve ter acesso a cargos e salários
      const hasCargosPermission = await hasPermission(testUserId, "cargos", "visualizar");
      expect(hasCargosPermission).toBe(true);
      
      // Não deve ter acesso administrativo
      const hasAdminPermission = await hasPermission(testUserId, "admin", "gerenciar_usuarios");
      expect(hasAdminPermission).toBe(false);
    });
  });
});
