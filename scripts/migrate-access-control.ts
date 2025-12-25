/**
 * Script para criar tabelas do sistema de controle de acesso baseado em SOX
 * Executa SQL direto para evitar prompts interativos do drizzle-kit
 */

import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

async function migrateAccessControl() {
  console.log("🔐 Iniciando migração do sistema de controle de acesso...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // 1. Criar tabela de permissões
    console.log("📋 Criando tabela permissions...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        active BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_permission (resource, action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Tabela permissions criada\n");

    // 2. Criar tabela de perfis
    console.log("📋 Criando tabela profiles...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        level INT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Tabela profiles criada\n");

    // 3. Criar tabela de permissões por perfil
    console.log("📋 Criando tabela profilePermissions...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS profilePermissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profileId INT NOT NULL,
        permissionId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_profile_permission (profileId, permissionId),
        FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Tabela profilePermissions criada\n");

    // 4. Criar tabela de perfis de usuários
    console.log("📋 Criando tabela userProfiles...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS userProfiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        profileId INT NOT NULL,
        assignedBy INT NOT NULL,
        assignedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        revokedBy INT,
        revokedAt DATETIME,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (assignedBy) REFERENCES users(id),
        INDEX idx_user_active (userId, active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Tabela userProfiles criada\n");

    // 5. Criar tabela de logs de auditoria
    console.log("📋 Criando tabela accessAuditLogs...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS accessAuditLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        userName VARCHAR(255),
        userEmail VARCHAR(320),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        resourceId INT,
        actionType ENUM('create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'login', 'logout', 'permission_change') NOT NULL,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        requestMethod VARCHAR(10),
        requestPath VARCHAR(500),
        oldValue TEXT,
        newValue TEXT,
        success BOOLEAN NOT NULL,
        errorMessage TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sessionId VARCHAR(255),
        INDEX idx_user_timestamp (userId, timestamp),
        INDEX idx_resource_action (resource, action),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Tabela accessAuditLogs criada\n");

    // 6. Criar tabela de solicitações de mudança de permissões
    console.log("📋 Criando tabela permissionChangeRequests...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissionChangeRequests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        targetUserId INT NOT NULL,
        targetUserName VARCHAR(255),
        changeType ENUM('add_profile', 'remove_profile', 'change_profile') NOT NULL,
        currentProfileId INT,
        requestedProfileId INT NOT NULL,
        reason TEXT NOT NULL,
        businessJustification TEXT,
        requestedBy INT NOT NULL,
        requestedByName VARCHAR(255),
        requestedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
        approvedBy INT,
        approvedByName VARCHAR(255),
        approvedAt DATETIME,
        approvalComments TEXT,
        implementedBy INT,
        implementedAt DATETIME,
        expiresAt DATETIME,
        priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
        FOREIGN KEY (targetUserId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (requestedBy) REFERENCES users(id),
        INDEX idx_status (status),
        INDEX idx_target_user (targetUserId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Tabela permissionChangeRequests criada\n");

    console.log("🎉 Migração concluída com sucesso!");
    console.log("\n📊 Tabelas criadas:");
    console.log("  - permissions");
    console.log("  - profiles");
    console.log("  - profilePermissions");
    console.log("  - userProfiles");
    console.log("  - accessAuditLogs");
    console.log("  - permissionChangeRequests");

  } catch (error) {
    console.error("❌ Erro durante migração:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrateAccessControl();
