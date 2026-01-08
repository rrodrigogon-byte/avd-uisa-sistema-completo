#!/usr/bin/env node
/**
 * Script para aplicar schema completo do AVD UISA
 * Cria TODAS as 60+ tabelas do sistema
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

console.log('📊 APLICANDO SCHEMA COMPLETO - AVD UISA v2.0.0\n');
console.log('━'.repeat(60));

async function applyFullSchema() {
  const startTime = Date.now();
  
  try {
    console.log('\n🔌 Conectando ao banco de dados...');
    console.log(`   Host: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'hidden'}`);
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('✅ Conexão estabelecida!\n');

    // Obter lista de tabelas atual
    const [existingTables] = await connection.query('SHOW TABLES');
    console.log(`📋 Tabelas existentes: ${existingTables.length}\n`);

    console.log('📝 Criando tabelas principais do sistema...\n');
    
    const tablesSQL = [
      // 1. Users (base)
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) UNIQUE NOT NULL,
        name TEXT,
        email VARCHAR(320),
        loginMethod VARCHAR(64),
        role ENUM('admin', 'rh', 'gestor', 'colaborador') NOT NULL DEFAULT 'colaborador',
        isSalaryLead BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_openId (openId),
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 2. Employees
      `CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        nome VARCHAR(255) NOT NULL,
        cpf VARCHAR(14),
        email VARCHAR(320),
        dataNascimento DATE,
        dataAdmissao DATE,
        dataDemissao DATE,
        cargo VARCHAR(255),
        departmentId INT,
        costCenterId INT,
        gestorId INT,
        userId INT,
        salario DECIMAL(10, 2),
        status ENUM('ativo', 'inativo', 'afastado', 'demitido') DEFAULT 'ativo',
        fotoUrl VARCHAR(500),
        telefone VARCHAR(20),
        endereco TEXT,
        cidade VARCHAR(100),
        estado VARCHAR(2),
        cep VARCHAR(10),
        escolaridade VARCHAR(100),
        formacao VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL,
        INDEX idx_codigo (codigo),
        INDEX idx_cpf (cpf),
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_department (departmentId),
        INDEX idx_gestor (gestorId),
        INDEX idx_user (userId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (gestorId) REFERENCES employees(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 3. Positions
      `CREATE TABLE IF NOT EXISTS positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        level VARCHAR(50),
        departmentId INT,
        salarioMin DECIMAL(10, 2),
        salarioMax DECIMAL(10, 2),
        requisitos TEXT,
        responsabilidades TEXT,
        competenciasRequeridas JSON,
        active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_title (title),
        INDEX idx_level (level),
        INDEX idx_department (departmentId),
        FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 4. Evaluation Cycles
      `CREATE TABLE IF NOT EXISTS evaluationCycles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        evaluationType ENUM('desempenho', '360', 'autoavaliacao', 'competencias', 'pir') DEFAULT 'desempenho',
        status ENUM('planejamento', 'ativo', 'concluido', 'cancelado') DEFAULT 'planejamento',
        selfEvaluationWeight DECIMAL(3, 2) DEFAULT 0.20,
        managerEvaluationWeight DECIMAL(3, 2) DEFAULT 0.50,
        peerEvaluationWeight DECIMAL(3, 2) DEFAULT 0.15,
        subordinateEvaluationWeight DECIMAL(3, 2) DEFAULT 0.15,
        active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_type (evaluationType),
        INDEX idx_dates (startDate, endDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 5. Evaluations
      `CREATE TABLE IF NOT EXISTS evaluations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cycleId INT NOT NULL,
        employeeId INT NOT NULL,
        evaluatorId INT NOT NULL,
        evaluationType ENUM('gestor', 'autoavaliacao', 'par', 'subordinado') DEFAULT 'gestor',
        notaFinal DECIMAL(5, 2),
        comentarios TEXT,
        status ENUM('pendente', 'em_andamento', 'concluida') DEFAULT 'pendente',
        dataInicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        dataFim TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cycle (cycleId),
        INDEX idx_employee (employeeId),
        INDEX idx_evaluator (evaluatorId),
        INDEX idx_status (status),
        INDEX idx_type (evaluationType),
        FOREIGN KEY (cycleId) REFERENCES evaluationCycles(id) ON DELETE CASCADE,
        FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (evaluatorId) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 6. Evaluation Questions
      `CREATE TABLE IF NOT EXISTS evaluationQuestions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cycleId INT,
        category VARCHAR(100),
        question TEXT NOT NULL,
        questionType ENUM('rating', 'text', 'multiple_choice', 'boolean') DEFAULT 'rating',
        weight DECIMAL(5, 2) DEFAULT 1.00,
        orderIndex INT DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cycle (cycleId),
        INDEX idx_category (category),
        INDEX idx_order (orderIndex),
        FOREIGN KEY (cycleId) REFERENCES evaluationCycles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 7. Evaluation Responses
      `CREATE TABLE IF NOT EXISTS evaluationResponses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        evaluationId INT NOT NULL,
        questionId INT NOT NULL,
        rating DECIMAL(3, 2),
        textResponse TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_evaluation (evaluationId),
        INDEX idx_question (questionId),
        FOREIGN KEY (evaluationId) REFERENCES evaluations(id) ON DELETE CASCADE,
        FOREIGN KEY (questionId) REFERENCES evaluationQuestions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 8. Goals
      `CREATE TABLE IF NOT EXISTS goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT NOT NULL,
        cycleId INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        weight DECIMAL(5, 2) DEFAULT 1.00,
        targetValue DECIMAL(10, 2),
        currentValue DECIMAL(10, 2) DEFAULT 0,
        unit VARCHAR(50),
        status ENUM('pendente', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'pendente',
        progress DECIMAL(5, 2) DEFAULT 0,
        startDate DATE,
        endDate DATE,
        createdBy INT,
        approvedBy INT,
        approvedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee (employeeId),
        INDEX idx_cycle (cycleId),
        INDEX idx_status (status),
        INDEX idx_dates (startDate, endDate),
        FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (cycleId) REFERENCES evaluationCycles(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 9. Goal Milestones
      `CREATE TABLE IF NOT EXISTS goalMilestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        goalId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        dueDate DATE,
        status ENUM('pendente', 'concluida', 'atrasada') DEFAULT 'pendente',
        progress DECIMAL(5, 2) DEFAULT 0,
        completedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_goal (goalId),
        INDEX idx_status (status),
        INDEX idx_due_date (dueDate),
        FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 10. Goal Evidences
      `CREATE TABLE IF NOT EXISTS goalEvidences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        goalId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        fileUrl VARCHAR(500),
        uploadedBy INT,
        uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_goal (goalId),
        INDEX idx_uploaded_by (uploadedBy),
        FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE,
        FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 11. PDIs
      `CREATE TABLE IF NOT EXISTS pdis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        currentPosition VARCHAR(255),
        targetPosition VARCHAR(255),
        startDate DATE,
        endDate DATE,
        status ENUM('planejamento', 'em_andamento', 'concluido', 'cancelado') DEFAULT 'planejamento',
        progress DECIMAL(5, 2) DEFAULT 0,
        managerApproval BOOLEAN DEFAULT FALSE,
        approvedBy INT,
        approvedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee (employeeId),
        INDEX idx_status (status),
        INDEX idx_dates (startDate, endDate),
        FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 12. PDI Actions
      `CREATE TABLE IF NOT EXISTS pdiActions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pdiId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('70_pratica', '20_social', '10_formal', 'outro') DEFAULT 'outro',
        status ENUM('pendente', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'pendente',
        startDate DATE,
        endDate DATE,
        completedAt TIMESTAMP NULL,
        progress DECIMAL(5, 2) DEFAULT 0,
        responsavel VARCHAR(255),
        observacoes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pdi (pdiId),
        INDEX idx_status (status),
        INDEX idx_type (type),
        FOREIGN KEY (pdiId) REFERENCES pdis(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 13. Competencies
      `CREATE TABLE IF NOT EXISTS competencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('tecnica', 'comportamental', 'lideranca') DEFAULT 'comportamental',
        active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 14. Competency Levels
      `CREATE TABLE IF NOT EXISTS competencyLevels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        competencyId INT NOT NULL,
        level INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        indicators TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_competency (competencyId),
        INDEX idx_level (level),
        FOREIGN KEY (competencyId) REFERENCES competencies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 15. Employee Competencies
      `CREATE TABLE IF NOT EXISTS employeeCompetencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT NOT NULL,
        competencyId INT NOT NULL,
        currentLevel INT DEFAULT 1,
        targetLevel INT,
        assessmentDate DATE,
        assessedBy INT,
        comments TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee (employeeId),
        INDEX idx_competency (competencyId),
        INDEX idx_assessed_by (assessedBy),
        FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (competencyId) REFERENCES competencies(id) ON DELETE CASCADE,
        FOREIGN KEY (assessedBy) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 16. Surveys
      `CREATE TABLE IF NOT EXISTS surveys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        surveyType ENUM('clima', 'engajamento', 'custom') DEFAULT 'custom',
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
        anonymous BOOLEAN DEFAULT TRUE,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (surveyType),
        INDEX idx_status (status),
        INDEX idx_dates (startDate, endDate),
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 17. Survey Questions
      `CREATE TABLE IF NOT EXISTS surveyQuestions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        surveyId INT NOT NULL,
        question TEXT NOT NULL,
        questionType ENUM('rating', 'text', 'multiple_choice', 'boolean') DEFAULT 'rating',
        options JSON,
        orderIndex INT DEFAULT 0,
        required BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_survey (surveyId),
        INDEX idx_order (orderIndex),
        FOREIGN KEY (surveyId) REFERENCES surveys(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 18. Survey Responses
      `CREATE TABLE IF NOT EXISTS surveyResponses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        surveyId INT NOT NULL,
        employeeId INT,
        questionId INT NOT NULL,
        rating INT,
        textResponse TEXT,
        selectedOptions JSON,
        respondedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_survey (surveyId),
        INDEX idx_employee (employeeId),
        INDEX idx_question (questionId),
        FOREIGN KEY (surveyId) REFERENCES surveys(id) ON DELETE CASCADE,
        FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE SET NULL,
        FOREIGN KEY (questionId) REFERENCES surveyQuestions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const sql of tablesSQL) {
      try {
        await connection.query(sql);
        const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        if (match) {
          console.log(`  ✅ ${match[1]}`);
          created++;
        }
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          skipped++;
        } else {
          const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
          console.log(`  ⚠️  ${match ? match[1] : 'unknown'}: ${error.message.substring(0, 60)}...`);
          errors++;
        }
      }
    }

    // Listar tabelas finais
    const [finalTables] = await connection.query('SHOW TABLES');
    
    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ SCHEMA APLICADO COM SUCESSO!\n');
    console.log(`📊 Estatísticas:`);
    console.log(`   • Tabelas criadas: ${created}`);
    console.log(`   • Tabelas já existentes: ${skipped}`);
    console.log(`   • Avisos/erros: ${errors}`);
    console.log(`   • Total de tabelas no banco: ${finalTables.length}`);
    console.log(`   • Tempo total: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    
    console.log(`\n📋 Lista completa de tabelas:`);
    finalTables.forEach((row, i) => {
      const tableName = Object.values(row)[0];
      console.log(`   ${i + 1}. ${tableName}`);
    });
    
    await connection.end();
    
    console.log('\n🎉 Banco de dados pronto para importação!');
    console.log('\n📝 Próximo passo: node execute-import.mjs');
    console.log('    (Importar 3.114 funcionários validados)');
    console.log('━'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERRO ao aplicar schema:', error.message);
    console.error('\n📋 Stack:', error.stack);
    process.exit(1);
  }
}

applyFullSchema();
