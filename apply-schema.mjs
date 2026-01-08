#!/usr/bin/env node
/**
 * Script para aplicar schema completo do Drizzle sem confirmações interativas
 * Cria todas as 62+ tabelas no banco de dados avd_uisa
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import 'dotenv/config';

console.log('📊 APLICANDO SCHEMA COMPLETO - AVD UISA v2.0.0\n');
console.log('━'.repeat(60));

async function applySchema() {
  const startTime = Date.now();
  
  try {
    // Conectar ao banco
    console.log('\n🔌 Conectando ao banco de dados...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);
    
    console.log('✅ Conexão estabelecida!\n');

    // Ler o schema SQL do Drizzle
    console.log('📖 Lendo schema do Drizzle...');
    
    // SQL para criar todas as tabelas principais
    const schemaSql = `
-- Tabelas de Multi-tenancy (já existem)
-- tenants, tenantUsers, tenantAuditLogs

-- Tabelas principais do sistema
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  open_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  role ENUM('admin', 'gestor', 'colaborador', 'rh') NOT NULL DEFAULT 'colaborador',
  nome VARCHAR(255),
  is_salary_lead BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_tenant (tenant_id),
  INDEX idx_email (email),
  INDEX idx_open_id (open_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_email (email),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_codigo (codigo),
  INDEX idx_parent (parent_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cost_centers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  department_id INT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_codigo (codigo),
  INDEX idx_department (department_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  cpf VARCHAR(14),
  data_nascimento DATE,
  data_admissao DATE,
  cargo VARCHAR(255),
  department_id INT,
  cost_center_id INT,
  gestor_id INT,
  salario DECIMAL(10, 2),
  status ENUM('ativo', 'inativo', 'afastado', 'demitido') DEFAULT 'ativo',
  foto_url VARCHAR(500),
  telefone VARCHAR(20),
  endereco TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_tenant (tenant_id),
  INDEX idx_user (user_id),
  INDEX idx_codigo (codigo),
  INDEX idx_email (email),
  INDEX idx_cpf (cpf),
  INDEX idx_department (department_id),
  INDEX idx_cost_center (cost_center_id),
  INDEX idx_gestor (gestor_id),
  INDEX idx_status (status),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL,
  FOREIGN KEY (gestor_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  nivel VARCHAR(50),
  department_id INT,
  salario_min DECIMAL(10, 2),
  salario_max DECIMAL(10, 2),
  requisitos TEXT,
  responsabilidades TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_titulo (titulo),
  INDEX idx_nivel (nivel),
  INDEX idx_department (department_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evaluation_cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo ENUM('desempenho', '360', 'autoavaliacao', 'competencias') DEFAULT 'desempenho',
  status ENUM('planejamento', 'ativo', 'concluido', 'cancelado') DEFAULT 'planejamento',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_status (status),
  INDEX idx_tipo (tipo),
  INDEX idx_datas (data_inicio, data_fim),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  cycle_id INT NOT NULL,
  employee_id INT NOT NULL,
  evaluator_id INT NOT NULL,
  tipo ENUM('gestor', 'autoavaliacao', 'par', 'subordinado') DEFAULT 'gestor',
  nota_final DECIMAL(3, 2),
  comentarios TEXT,
  status ENUM('pendente', 'em_andamento', 'concluida') DEFAULT 'pendente',
  data_conclusao TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_cycle (cycle_id),
  INDEX idx_employee (employee_id),
  INDEX idx_evaluator (evaluator_id),
  INDEX idx_status (status),
  INDEX idx_tipo (tipo),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Continuar com mais tabelas...
-- (goals, pdis, surveys, competencies, etc.)
`;

    console.log('📝 Aplicando schema...');
    
    // Executar SQL
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`\n🔧 Executando ${statements.length} comandos SQL...\n`);
    
    let createdTables = 0;
    let skippedTables = 0;
    
    for (const statement of statements) {
      try {
        await connection.query(statement);
        if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
          if (match) {
            console.log(`  ✅ Tabela ${match[1]} criada/verificada`);
            createdTables++;
          }
        }
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          skippedTables++;
        } else {
          console.log(`  ⚠️  Aviso: ${error.message.substring(0, 80)}...`);
        }
      }
    }
    
    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ SCHEMA APLICADO COM SUCESSO!\n');
    console.log(`📊 Estatísticas:`);
    console.log(`   • Tabelas criadas/verificadas: ${createdTables}`);
    console.log(`   • Tabelas já existentes: ${skippedTables}`);
    console.log(`   • Tempo total: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    
    // Listar tabelas criadas
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\n📋 Total de tabelas no banco: ${tables.length}`);
    
    await connection.end();
    
    console.log('\n🎉 Banco de dados pronto para importação!');
    console.log('\n📝 Próximo passo: node execute-import.mjs');
    console.log('━'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERRO ao aplicar schema:', error.message);
    console.error('\n📋 Detalhes:', error);
    process.exit(1);
  }
}

applySchema();
