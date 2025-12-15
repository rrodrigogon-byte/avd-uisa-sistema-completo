/**
 * Script para popular permissões e perfis padrão do sistema
 * Baseado em SOX compliance e segregação de funções
 */

import { drizzle } from "drizzle-orm/mysql2";
import { permissions, profiles, profilePermissions } from "../drizzle/schema";

async function seedAccessControl() {
  console.log("🌱 Iniciando seed do sistema de controle de acesso...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // ========================================================================
    // 1. CRIAR PERMISSÕES
    // ========================================================================
    console.log("📋 Criando permissões do sistema...");

    const permissionsData = [
      // Metas
      { resource: "metas", action: "criar", description: "Criar novas metas", category: "Gestão de Metas" },
      { resource: "metas", action: "editar", description: "Editar metas existentes", category: "Gestão de Metas" },
      { resource: "metas", action: "excluir", description: "Excluir metas", category: "Gestão de Metas" },
      { resource: "metas", action: "visualizar", description: "Visualizar metas", category: "Gestão de Metas" },
      { resource: "metas", action: "aprovar", description: "Aprovar metas", category: "Gestão de Metas" },

      // Avaliações
      { resource: "avaliacoes", action: "criar", description: "Criar avaliações", category: "Avaliações" },
      { resource: "avaliacoes", action: "editar", description: "Editar avaliações", category: "Avaliações" },
      { resource: "avaliacoes", action: "excluir", description: "Excluir avaliações", category: "Avaliações" },
      { resource: "avaliacoes", action: "visualizar", description: "Visualizar avaliações", category: "Avaliações" },
      { resource: "avaliacoes", action: "aprovar", description: "Aprovar avaliações", category: "Avaliações" },
      { resource: "avaliacoes", action: "enviar", description: "Enviar avaliações para colaboradores", category: "Avaliações" },

      // PDI (Plano de Desenvolvimento Individual)
      { resource: "pdi", action: "criar", description: "Criar PDI", category: "Desenvolvimento" },
      { resource: "pdi", action: "editar", description: "Editar PDI", category: "Desenvolvimento" },
      { resource: "pdi", action: "excluir", description: "Excluir PDI", category: "Desenvolvimento" },
      { resource: "pdi", action: "visualizar", description: "Visualizar PDI", category: "Desenvolvimento" },
      { resource: "pdi", action: "aprovar", description: "Aprovar PDI", category: "Desenvolvimento" },

      // Desenvolvimento
      { resource: "desenvolvimento", action: "criar", description: "Criar ações de desenvolvimento", category: "Desenvolvimento" },
      { resource: "desenvolvimento", action: "editar", description: "Editar ações de desenvolvimento", category: "Desenvolvimento" },
      { resource: "desenvolvimento", action: "excluir", description: "Excluir ações de desenvolvimento", category: "Desenvolvimento" },
      { resource: "desenvolvimento", action: "visualizar", description: "Visualizar desenvolvimento", category: "Desenvolvimento" },

      // Sucessão
      { resource: "sucessao", action: "criar", description: "Criar planos de sucessão", category: "Sucessão" },
      { resource: "sucessao", action: "editar", description: "Editar planos de sucessão", category: "Sucessão" },
      { resource: "sucessao", action: "excluir", description: "Excluir planos de sucessão", category: "Sucessão" },
      { resource: "sucessao", action: "visualizar", description: "Visualizar planos de sucessão", category: "Sucessão" },
      { resource: "sucessao", action: "aprovar", description: "Aprovar planos de sucessão", category: "Sucessão" },

      // Pessoas
      { resource: "pessoas", action: "criar", description: "Criar colaboradores", category: "Gestão de Pessoas" },
      { resource: "pessoas", action: "editar", description: "Editar dados de colaboradores", category: "Gestão de Pessoas" },
      { resource: "pessoas", action: "excluir", description: "Excluir colaboradores", category: "Gestão de Pessoas" },
      { resource: "pessoas", action: "visualizar", description: "Visualizar colaboradores", category: "Gestão de Pessoas" },

      // Hierarquia
      { resource: "hierarquia", action: "criar", description: "Criar estrutura hierárquica", category: "Estrutura Organizacional" },
      { resource: "hierarquia", action: "editar", description: "Editar estrutura hierárquica", category: "Estrutura Organizacional" },
      { resource: "hierarquia", action: "excluir", description: "Excluir estrutura hierárquica", category: "Estrutura Organizacional" },
      { resource: "hierarquia", action: "visualizar", description: "Visualizar hierarquia", category: "Estrutura Organizacional" },

      // Cargos e Salários
      { resource: "cargos", action: "criar", description: "Criar cargos", category: "Cargos e Salários" },
      { resource: "cargos", action: "editar", description: "Editar cargos", category: "Cargos e Salários" },
      { resource: "cargos", action: "excluir", description: "Excluir cargos", category: "Cargos e Salários" },
      { resource: "cargos", action: "visualizar", description: "Visualizar cargos", category: "Cargos e Salários" },
      { resource: "salarios", action: "visualizar", description: "Visualizar salários", category: "Cargos e Salários" },
      { resource: "salarios", action: "editar", description: "Editar salários", category: "Cargos e Salários" },

      // Bônus
      { resource: "bonus", action: "criar", description: "Criar políticas de bônus", category: "Remuneração" },
      { resource: "bonus", action: "editar", description: "Editar políticas de bônus", category: "Remuneração" },
      { resource: "bonus", action: "excluir", description: "Excluir políticas de bônus", category: "Remuneração" },
      { resource: "bonus", action: "visualizar", description: "Visualizar bônus", category: "Remuneração" },
      { resource: "bonus", action: "aprovar", description: "Aprovar bônus", category: "Remuneração" },
      { resource: "bonus", action: "calcular", description: "Calcular bônus", category: "Remuneração" },

      // Competências
      { resource: "competencias", action: "criar", description: "Criar competências", category: "Competências" },
      { resource: "competencias", action: "editar", description: "Editar competências", category: "Competências" },
      { resource: "competencias", action: "excluir", description: "Excluir competências", category: "Competências" },
      { resource: "competencias", action: "visualizar", description: "Visualizar competências", category: "Competências" },

      // Tempo
      { resource: "tempo", action: "visualizar", description: "Visualizar registros de tempo", category: "Gestão de Tempo" },
      { resource: "tempo", action: "editar", description: "Editar registros de tempo", category: "Gestão de Tempo" },

      // Pendências
      { resource: "pendencias", action: "visualizar", description: "Visualizar pendências", category: "Aprovações" },
      { resource: "pendencias", action: "aprovar", description: "Aprovar pendências", category: "Aprovações" },
      { resource: "pendencias", action: "rejeitar", description: "Rejeitar pendências", category: "Aprovações" },

      // Aprovações
      { resource: "aprovacoes", action: "visualizar", description: "Visualizar aprovações", category: "Aprovações" },
      { resource: "aprovacoes", action: "aprovar", description: "Aprovar solicitações", category: "Aprovações" },
      { resource: "aprovacoes", action: "rejeitar", description: "Rejeitar solicitações", category: "Aprovações" },

      // Analytics
      { resource: "analytics", action: "visualizar", description: "Visualizar analytics", category: "Relatórios" },

      // Relatórios
      { resource: "relatorios", action: "visualizar", description: "Visualizar relatórios", category: "Relatórios" },
      { resource: "relatorios", action: "exportar", description: "Exportar relatórios", category: "Relatórios" },

      // Administração
      { resource: "admin", action: "gerenciar_perfis", description: "Gerenciar perfis de acesso", category: "Administração" },
      { resource: "admin", action: "gerenciar_usuarios", description: "Gerenciar usuários", category: "Administração" },
      { resource: "admin", action: "gerenciar_permissoes", description: "Gerenciar permissões", category: "Administração" },
      { resource: "admin", action: "visualizar_auditoria", description: "Visualizar logs de auditoria", category: "Administração" },

      // Configurações
      { resource: "config", action: "editar_sistema", description: "Editar configurações do sistema", category: "Configurações" },
      { resource: "config", action: "editar_regras", description: "Editar regras de negócio", category: "Configurações" },
      { resource: "config", action: "editar_notificacoes", description: "Editar configurações de notificações", category: "Configurações" },
    ];

    await db.insert(permissions).values(permissionsData).onDuplicateKeyUpdate({ set: { active: true } });
    console.log(`✅ ${permissionsData.length} permissões criadas\n`);

    // ========================================================================
    // 2. CRIAR PERFIS
    // ========================================================================
    console.log("👥 Criando perfis de acesso...");

    const profilesData = [
      {
        code: "admin",
        name: "Administrador",
        description: "Acesso total ao sistema, incluindo configurações críticas e gestão de permissões",
        level: 1,
      },
      {
        code: "rh_gerente",
        name: "RH Gerente",
        description: "Acesso completo exceto modificação de regras de sistema e configurações críticas",
        level: 2,
      },
      {
        code: "especialista_cs",
        name: "Especialista C&S",
        description: "Acesso a PDI, Cargos e Salários, Bônus, Estrutura Organizacional e Competências",
        level: 3,
      },
      {
        code: "lider",
        name: "Líder/Gestor",
        description: "Aprovações, gestão de equipe, visualização de relatórios da equipe e avaliações",
        level: 4,
      },
      {
        code: "usuario",
        name: "Usuário/Colaborador",
        description: "Acompanhamento pessoal, realizar tarefas, fazer solicitações e autoavaliação",
        level: 5,
      },
    ];

    await db.insert(profiles).values(profilesData).onDuplicateKeyUpdate({ set: { active: true } });
    console.log(`✅ ${profilesData.length} perfis criados\n`);

    // ========================================================================
    // 3. ATRIBUIR PERMISSÕES AOS PERFIS
    // ========================================================================
    console.log("🔗 Atribuindo permissões aos perfis...");

    // Buscar IDs dos perfis e permissões
    const allProfiles = await db.select().from(profiles);
    const allPermissions = await db.select().from(permissions);

    const getProfileId = (code: string) => allProfiles.find(p => p.code === code)?.id;
    const getPermissionId = (resource: string, action: string) => 
      allPermissions.find(p => p.resource === resource && p.action === action)?.id;

    const profilePermissionsData: Array<{ profileId: number; permissionId: number }> = [];

    // ADMIN - Todas as permissões
    const adminId = getProfileId("admin");
    if (adminId) {
      allPermissions.forEach(perm => {
        if (perm.id) {
          profilePermissionsData.push({ profileId: adminId, permissionId: perm.id });
        }
      });
    }

    // RH GERENTE - Todas exceto configurações críticas
    const rhGerenteId = getProfileId("rh_gerente");
    if (rhGerenteId) {
      allPermissions.forEach(perm => {
        if (perm.id && perm.resource !== "config") {
          profilePermissionsData.push({ profileId: rhGerenteId, permissionId: perm.id });
        }
      });
      // Adicionar apenas visualização de auditoria
      const auditPermId = getPermissionId("admin", "visualizar_auditoria");
      if (auditPermId) {
        profilePermissionsData.push({ profileId: rhGerenteId, permissionId: auditPermId });
      }
    }

    // ESPECIALISTA C&S - PDI, Cargos, Salários, Bônus, Competências, Estrutura
    const especialistaId = getProfileId("especialista_cs");
    if (especialistaId) {
      const recursos = ["pdi", "cargos", "salarios", "bonus", "competencias", "hierarquia", "desenvolvimento"];
      allPermissions.forEach(perm => {
        if (perm.id && recursos.includes(perm.resource)) {
          profilePermissionsData.push({ profileId: especialistaId, permissionId: perm.id });
        }
      });
      // Visualizar pessoas, relatórios e analytics
      const visualizarPessoas = getPermissionId("pessoas", "visualizar");
      const visualizarRelatorios = getPermissionId("relatorios", "visualizar");
      const exportarRelatorios = getPermissionId("relatorios", "exportar");
      const visualizarAnalytics = getPermissionId("analytics", "visualizar");
      if (visualizarPessoas) profilePermissionsData.push({ profileId: especialistaId, permissionId: visualizarPessoas });
      if (visualizarRelatorios) profilePermissionsData.push({ profileId: especialistaId, permissionId: visualizarRelatorios });
      if (exportarRelatorios) profilePermissionsData.push({ profileId: especialistaId, permissionId: exportarRelatorios });
      if (visualizarAnalytics) profilePermissionsData.push({ profileId: especialistaId, permissionId: visualizarAnalytics });
    }

    // LÍDER - Aprovações, visualizações, gestão de equipe
    const liderId = getProfileId("lider");
    if (liderId) {
      // Metas da equipe
      ["visualizar", "criar", "editar", "aprovar"].forEach(action => {
        const permId = getPermissionId("metas", action);
        if (permId) profilePermissionsData.push({ profileId: liderId, permissionId: permId });
      });
      // Avaliações da equipe
      ["visualizar", "criar", "editar", "aprovar", "enviar"].forEach(action => {
        const permId = getPermissionId("avaliacoes", action);
        if (permId) profilePermissionsData.push({ profileId: liderId, permissionId: permId });
      });
      // PDI da equipe
      ["visualizar", "criar", "editar", "aprovar"].forEach(action => {
        const permId = getPermissionId("pdi", action);
        if (permId) profilePermissionsData.push({ profileId: liderId, permissionId: permId });
      });
      // Desenvolvimento
      ["visualizar", "criar", "editar"].forEach(action => {
        const permId = getPermissionId("desenvolvimento", action);
        if (permId) profilePermissionsData.push({ profileId: liderId, permissionId: permId });
      });
      // Pessoas (apenas visualizar da equipe)
      const visualizarPessoas = getPermissionId("pessoas", "visualizar");
      if (visualizarPessoas) profilePermissionsData.push({ profileId: liderId, permissionId: visualizarPessoas });
      // Aprovações
      ["visualizar", "aprovar", "rejeitar"].forEach(action => {
        const permId = getPermissionId("aprovacoes", action);
        if (permId) profilePermissionsData.push({ profileId: liderId, permissionId: permId });
      });
      const permId = getPermissionId("pendencias", "visualizar");
      if (permId) profilePermissionsData.push({ profileId: liderId, permissionId: permId });
      // Relatórios da equipe
      const visualizarRelatorios = getPermissionId("relatorios", "visualizar");
      if (visualizarRelatorios) profilePermissionsData.push({ profileId: liderId, permissionId: visualizarRelatorios });
    }

    // USUÁRIO - Apenas visualizações pessoais e autoavaliação
    const usuarioId = getProfileId("usuario");
    if (usuarioId) {
      // Visualizar próprias metas
      const visualizarMetas = getPermissionId("metas", "visualizar");
      if (visualizarMetas) profilePermissionsData.push({ profileId: usuarioId, permissionId: visualizarMetas });
      // Visualizar próprias avaliações
      const visualizarAvaliacoes = getPermissionId("avaliacoes", "visualizar");
      if (visualizarAvaliacoes) profilePermissionsData.push({ profileId: usuarioId, permissionId: visualizarAvaliacoes });
      // Visualizar e editar próprio PDI
      const visualizarPDI = getPermissionId("pdi", "visualizar");
      const editarPDI = getPermissionId("pdi", "editar");
      if (visualizarPDI) profilePermissionsData.push({ profileId: usuarioId, permissionId: visualizarPDI });
      if (editarPDI) profilePermissionsData.push({ profileId: usuarioId, permissionId: editarPDI });
      // Visualizar próprio desenvolvimento
      const visualizarDesenvolvimento = getPermissionId("desenvolvimento", "visualizar");
      if (visualizarDesenvolvimento) profilePermissionsData.push({ profileId: usuarioId, permissionId: visualizarDesenvolvimento });
    }

    // Inserir permissões dos perfis
    if (profilePermissionsData.length > 0) {
      await db.insert(profilePermissions).values(profilePermissionsData)
        .onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
      console.log(`✅ ${profilePermissionsData.length} permissões atribuídas aos perfis\n`);
    }

    console.log("🎉 Seed do sistema de controle de acesso concluído com sucesso!");
    console.log("\n📊 Resumo:");
    console.log(`  - ${permissionsData.length} permissões criadas`);
    console.log(`  - ${profilesData.length} perfis criados`);
    console.log(`  - ${profilePermissionsData.length} relações perfil-permissão criadas`);

  } catch (error) {
    console.error("❌ Erro durante seed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedAccessControl();
