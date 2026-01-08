#!/usr/bin/env node
/**
 * Script simplificado para criar tabelas de multi-tenancy
 */

import mysql from 'mysql2/promise';

const config = {
  host: '34.39.223.147',
  user: 'root',
  password: '|_89C{*ixPV5x4UJ',
  port: 3306,
  database: 'avd_uisa',
  connectTimeout: 10000,
};

async function main() {
  console.log('\n🚀 Criando tabelas de multi-tenancy...\n');

  const connection = await mysql.createConnection(config);
  
  try {
    // 1. Criar tabela tenants
    console.log('📝 Criando tabela "tenants"...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        legalName VARCHAR(255),
        cnpj VARCHAR(18) UNIQUE,
        active BOOLEAN DEFAULT TRUE NOT NULL,
        settings JSON,
        maxUsers INT DEFAULT 1000 NOT NULL,
        maxEmployees INT DEFAULT 5000 NOT NULL,
        contactName VARCHAR(255),
        contactEmail VARCHAR(320),
        contactPhone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zipCode VARCHAR(10),
        planType ENUM('trial', 'basic', 'professional', 'enterprise') DEFAULT 'trial' NOT NULL,
        trialEndsAt DATETIME,
        subscriptionExpiresAt DATETIME,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        createdBy INT,
        INDEX idx_tenant_code (code),
        INDEX idx_tenant_active (active),
        INDEX idx_tenant_plan (planType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "tenants" criada\n');

    // 2. Criar tabela tenantUsers
    console.log('📝 Criando tabela "tenantUsers"...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenantUsers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenantId INT NOT NULL,
        userId INT NOT NULL,
        role ENUM('super_admin', 'admin', 'manager', 'user') DEFAULT 'user' NOT NULL,
        permissions JSON,
        active BOOLEAN DEFAULT TRUE NOT NULL,
        joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        lastAccessAt TIMESTAMP NULL,
        UNIQUE KEY unique_tenant_user (tenantId, userId),
        INDEX idx_tenant_user_tenant (tenantId),
        INDEX idx_tenant_user_user (userId),
        INDEX idx_tenant_user_active (active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "tenantUsers" criada\n');

    // 3. Criar tabela tenantAuditLogs
    console.log('📝 Criando tabela "tenantAuditLogs"...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenantAuditLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenantId INT NOT NULL,
        userId INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        entityType VARCHAR(100),
        entityId INT,
        details JSON,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_tenant_audit_tenant (tenantId),
        INDEX idx_tenant_audit_user (userId),
        INDEX idx_tenant_audit_action (action),
        INDEX idx_tenant_audit_entity (entityType, entityId),
        INDEX idx_tenant_audit_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "tenantAuditLogs" criada\n');

    // 4. Inserir tenant UISA
    console.log('📝 Inserindo tenant padrão "UISA"...');
    await connection.query(`
      INSERT INTO tenants (
        code, name, legalName, cnpj, active, maxUsers, maxEmployees,
        contactName, contactEmail, planType
      ) VALUES (
        'UISA',
        'UISA - Bioenergia + Açúcar',
        'UISA Indústria S.A.',
        '12.345.678/0001-99',
        TRUE,
        5000,
        10000,
        'Administrador UISA',
        'admin@uisa.com.br',
        'enterprise'
      ) ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        updatedAt = NOW()
    `);
    console.log('✅ Tenant "UISA" criado\n');

    // 5. Verificar tenant criado
    const [tenants] = await connection.query(`
      SELECT * FROM tenants WHERE code = 'UISA'
    `);

    if (tenants.length > 0) {
      const tenant = tenants[0];
      console.log('✅ Tenant UISA verificado:\n');
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Code: ${tenant.code}`);
      console.log(`   Name: ${tenant.name}`);
      console.log(`   Max Users: ${tenant.maxUsers}`);
      console.log(`   Max Employees: ${tenant.maxEmployees}\n`);
    }

    // 6. Listar tabelas criadas
    const [tables] = await connection.query(`
      SHOW TABLES LIKE '%tenant%'
    `);

    console.log('📋 Tabelas de multi-tenancy criadas:\n');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   ✅ ${tableName}`);
    });

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MULTI-TENANCY CONFIGURADO COM SUCESSO!            ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📋 Próximos passos:\n');
    console.log('   1. Aplicar schema completo:');
    console.log('      pnpm db:push\n');
    console.log('   2. Importar dados:');
    console.log('      node execute-import.mjs\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
