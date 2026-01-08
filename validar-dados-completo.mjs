#!/usr/bin/env node
/**
 * Script de Validação Completa de Dados - Sistema AVD UISA
 * Verifica integridade, qualidade e consistência de todos os dados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// ============================================
// VALIDAÇÕES DE ARQUIVOS
// ============================================

const dataFiles = [
  { 
    path: './import-data.json', 
    required: true, 
    minSize: 1 * 1024 * 1024, // 1 MB
    description: 'Dados de funcionários',
    validate: (data) => {
      const errors = [];
      if (!data.employees || !Array.isArray(data.employees)) {
        errors.push('Campo employees não encontrado ou não é array');
      } else {
        if (data.employees.length < 3000) {
          errors.push(`Apenas ${data.employees.length} funcionários (esperado: 3000+)`);
        }
        // Validar estrutura de alguns funcionários
        const sample = data.employees.slice(0, 10);
        sample.forEach((emp, idx) => {
          if (!emp.name) errors.push(`Funcionário ${idx}: campo 'name' faltando`);
          if (!emp.email) errors.push(`Funcionário ${idx}: campo 'email' faltando`);
          if (!emp.employeeCode) errors.push(`Funcionário ${idx}: campo 'employeeCode' faltando`);
        });
      }
      return errors;
    }
  },
  { 
    path: './users-credentials.json', 
    required: true, 
    minSize: 50 * 1024, // 50 KB
    description: 'Credenciais de usuários',
    validate: (data) => {
      const errors = [];
      if (!Array.isArray(data)) {
        errors.push('Arquivo não é um array');
      } else {
        if (data.length < 300) {
          errors.push(`Apenas ${data.length} usuários (esperado: 300+)`);
        }
        // Verificar senhas em texto plano
        const hasPlainPassword = data.some(u => u.password && u.password.length < 50);
        if (hasPlainPassword) {
          errors.push('⚠️  ATENÇÃO: Senhas em texto plano detectadas (precisam hash)');
        }
      }
      return errors;
    }
  },
  { 
    path: './pdi_data.json', 
    required: true, 
    minSize: 5 * 1024, // 5 KB
    description: 'Dados de PDI',
    validate: (data) => {
      const errors = [];
      if (!Array.isArray(data)) {
        errors.push('Arquivo não é um array');
      } else {
        if (data.length < 2) {
          errors.push(`Apenas ${data.length} PDIs (recomendado: criar mais)`);
        }
        // Validar estrutura 70-20-10
        data.forEach((pdi, idx) => {
          if (!pdi.plano_acao) {
            errors.push(`PDI ${idx}: campo 'plano_acao' faltando`);
          } else {
            if (!pdi.plano_acao['70_pratica']) {
              errors.push(`PDI ${idx}: '70_pratica' faltando`);
            }
            if (!pdi.plano_acao['20_social']) {
              errors.push(`PDI ${idx}: '20_social' faltando`);
            }
            if (!pdi.plano_acao['10_formal']) {
              errors.push(`PDI ${idx}: '10_formal' faltando`);
            }
          }
        });
      }
      return errors;
    }
  },
  { 
    path: './succession-data-uisa.json', 
    required: true, 
    minSize: 5 * 1024, // 5 KB
    description: 'Mapa de sucessão',
    validate: (data) => {
      const errors = [];
      if (!data.positions || !Array.isArray(data.positions)) {
        errors.push('Campo positions não encontrado ou não é array');
      } else {
        if (data.positions.length < 10) {
          errors.push(`Apenas ${data.positions.length} posições mapeadas (recomendado: mais posições)`);
        }
        // Validar metodologia
        if (data.methodology !== '9-Box Succession Planning') {
          errors.push('Metodologia diferente da esperada (9-Box)');
        }
      }
      return errors;
    }
  },
  { 
    path: './data/uisa-job-descriptions.json', 
    required: true, 
    minSize: 3 * 1024 * 1024, // 3 MB
    description: 'Descrições de cargo',
    validate: (data) => {
      const errors = [];
      if (!Array.isArray(data)) {
        errors.push('Arquivo não é um array');
      } else {
        if (data.length < 400) {
          errors.push(`Apenas ${data.length} descrições (esperado: 400+)`);
        }
        // Validar estrutura
        const sample = data.slice(0, 5);
        sample.forEach((desc, idx) => {
          if (!desc.cargo) errors.push(`Descrição ${idx}: campo 'cargo' faltando`);
          if (!desc.departamento) errors.push(`Descrição ${idx}: campo 'departamento' faltando`);
          if (!desc.competencias || !Array.isArray(desc.competencias)) {
            errors.push(`Descrição ${idx}: competências não definidas`);
          }
        });
      }
      return errors;
    }
  },
  { 
    path: './funcionarios-hierarquia.xlsx', 
    required: false, 
    minSize: 100 * 1024, // 100 KB
    description: 'Planilha de hierarquia',
    validate: null // Não validamos XLSX (binário)
  },
  { 
    path: './job_descriptions.json', 
    required: false, 
    minSize: 10 * 1024, // 10 KB
    description: 'Descrições complementares',
    validate: null
  }
];

const sqlFiles = [
  { path: './migration-employees.sql', description: 'Migração de funcionários' },
  { path: './migration_avd_5_passos.sql', description: 'Migração AVD 360°' },
  { path: './migration_pir.sql', description: 'Migração testes PIR' },
  { path: './scripts/seed-competencias.sql', description: 'Seed de competências' },
  { path: './scripts/seed-complete-data.sql', description: 'Seed completo' },
  { path: './scripts/seed-psychometric-tests.sql', description: 'Testes psicométricos' },
  { path: './scripts/seed-sucessao-9box.sql', description: 'Sucessão 9-Box' },
];

const mjsFiles = [
  { path: './execute-import.mjs', description: 'Importação principal' },
  { path: './create-remaining-users.mjs', description: 'Criar usuários faltantes' },
  { path: './import-employees.mjs', description: 'Importar funcionários' },
  { path: './verificar-integridade-dados.mjs', description: 'Verificar integridade' },
  { path: './scripts/seed-demo-data.mjs', description: 'Dados de demonstração' },
  { path: './scripts/seed-succession.mjs', description: 'Seed de sucessão' },
  { path: './scripts/import-job-desc.mjs', description: 'Importar descrições' },
];

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  VALIDAÇÃO COMPLETA DE DADOS - Sistema AVD UISA v2.0    ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  const results = {
    files: { total: 0, found: 0, missing: 0, invalid: 0 },
    sql: { total: 0, found: 0, missing: 0 },
    mjs: { total: 0, found: 0, missing: 0 },
    data: {},
    errors: [],
    warnings: []
  };

  // ============================================
  // 1. VALIDAR ARQUIVOS DE DADOS
  // ============================================
  
  log('📁 VALIDANDO ARQUIVOS DE DADOS', 'bright');
  log('═'.repeat(60), 'blue');

  for (const file of dataFiles) {
    results.files.total++;
    const filePath = path.join(__dirname, file.path);
    
    try {
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      log(`\n✓ ${file.path}`, 'green');
      log(`  Descrição: ${file.description}`, 'cyan');
      log(`  Tamanho: ${formatBytes(fileSize)}`, 'cyan');
      
      // Verificar tamanho mínimo
      if (file.minSize && fileSize < file.minSize) {
        const warning = `  ⚠️  Arquivo menor que o esperado (${formatBytes(file.minSize)})`;
        log(warning, 'yellow');
        results.warnings.push(`${file.path}: ${warning}`);
      }
      
      // Validar conteúdo (apenas JSON)
      if (file.path.endsWith('.json') && file.validate) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          const validationErrors = file.validate(data);
          
          if (validationErrors.length > 0) {
            log('  ⚠️  Problemas encontrados:', 'yellow');
            validationErrors.forEach(err => {
              log(`    - ${err}`, 'yellow');
              results.warnings.push(`${file.path}: ${err}`);
            });
            results.files.invalid++;
          } else {
            log('  ✓ Validação OK', 'green');
          }
          
          // Estatísticas
          if (file.path === './import-data.json') {
            results.data.employees = {
              total: data.employees.length,
              active: data.employees.filter(e => e.active !== false).length
            };
          } else if (file.path === './users-credentials.json') {
            results.data.users = {
              total: data.length,
              byRole: data.reduce((acc, u) => {
                const role = u.role || u.cargo || 'unknown';
                acc[role] = (acc[role] || 0) + 1;
                return acc;
              }, {})
            };
          } else if (file.path === './pdi_data.json') {
            results.data.pdis = data.length;
          } else if (file.path === './data/uisa-job-descriptions.json') {
            results.data.jobDescriptions = data.length;
          } else if (file.path === './succession-data-uisa.json') {
            results.data.succession = {
              positions: data.positions?.length || 0,
              methodology: data.methodology
            };
          }
          
        } catch (parseError) {
          const error = `  ✗ Erro ao validar: ${parseError.message}`;
          log(error, 'red');
          results.errors.push(`${file.path}: ${error}`);
          results.files.invalid++;
        }
      }
      
      results.files.found++;
      
    } catch (error) {
      if (file.required) {
        log(`✗ ${file.path} - FALTANDO (OBRIGATÓRIO)`, 'red');
        results.errors.push(`${file.path}: Arquivo obrigatório não encontrado`);
        results.files.missing++;
      } else {
        log(`⚠️  ${file.path} - Não encontrado (opcional)`, 'yellow');
        results.warnings.push(`${file.path}: Arquivo opcional não encontrado`);
        results.files.missing++;
      }
    }
  }

  // ============================================
  // 2. VALIDAR SCRIPTS SQL
  // ============================================
  
  log('\n\n📄 VALIDANDO SCRIPTS SQL', 'bright');
  log('═'.repeat(60), 'blue');

  for (const file of sqlFiles) {
    results.sql.total++;
    const filePath = path.join(__dirname, file.path);
    
    try {
      const stats = fs.statSync(filePath);
      log(`✓ ${file.path} (${formatBytes(stats.size)})`, 'green');
      results.sql.found++;
    } catch (error) {
      log(`⚠️  ${file.path} - Não encontrado`, 'yellow');
      results.sql.missing++;
    }
  }

  // ============================================
  // 3. VALIDAR SCRIPTS MJS
  // ============================================
  
  log('\n\n📜 VALIDANDO SCRIPTS MJS', 'bright');
  log('═'.repeat(60), 'blue');

  for (const file of mjsFiles) {
    results.mjs.total++;
    const filePath = path.join(__dirname, file.path);
    
    try {
      const stats = fs.statSync(filePath);
      log(`✓ ${file.path} (${formatBytes(stats.size)})`, 'green');
      results.mjs.found++;
    } catch (error) {
      log(`⚠️  ${file.path} - Não encontrado`, 'yellow');
      results.mjs.missing++;
    }
  }

  // ============================================
  // 4. VERIFICAR .ENV
  // ============================================
  
  log('\n\n⚙️  VERIFICANDO CONFIGURAÇÃO', 'bright');
  log('═'.repeat(60), 'blue');

  try {
    fs.statSync(path.join(__dirname, '.env'));
    log('✓ Arquivo .env existe', 'green');
    
    // Ler e verificar variáveis críticas
    const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingVars = [];
    
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName) || envContent.includes(`${varName}=`)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      log(`⚠️  Variáveis não configuradas: ${missingVars.join(', ')}`, 'yellow');
      results.warnings.push('.env: Variáveis críticas não configuradas');
    } else {
      log('✓ Variáveis críticas configuradas', 'green');
    }
    
  } catch (error) {
    log('✗ Arquivo .env NÃO encontrado', 'red');
    log('  Execute: cp .env.example .env', 'yellow');
    results.errors.push('.env: Arquivo não encontrado');
  }

  // Verificar .env.example
  try {
    fs.statSync(path.join(__dirname, '.env.example'));
    log('✓ Arquivo .env.example existe', 'green');
  } catch (error) {
    log('⚠️  Arquivo .env.example não encontrado', 'yellow');
    results.warnings.push('.env.example: Arquivo de template não encontrado');
  }

  // ============================================
  // 5. RESUMO FINAL
  // ============================================
  
  log('\n\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    RESUMO DA VALIDAÇÃO                   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  // Arquivos de Dados
  log('📁 ARQUIVOS DE DADOS', 'bright');
  log(`   Total: ${results.files.total}`);
  log(`   Encontrados: ${results.files.found}`, results.files.found === results.files.total ? 'green' : 'yellow');
  log(`   Faltando: ${results.files.missing}`, results.files.missing > 0 ? 'red' : 'green');
  log(`   Com problemas: ${results.files.invalid}`, results.files.invalid > 0 ? 'red' : 'green');

  // Scripts SQL
  log('\n📄 SCRIPTS SQL', 'bright');
  log(`   Total: ${results.sql.total}`);
  log(`   Encontrados: ${results.sql.found}`, results.sql.found === results.sql.total ? 'green' : 'yellow');
  log(`   Faltando: ${results.sql.missing}`, results.sql.missing > 0 ? 'yellow' : 'green');

  // Scripts MJS
  log('\n📜 SCRIPTS MJS', 'bright');
  log(`   Total: ${results.mjs.total}`);
  log(`   Encontrados: ${results.mjs.found}`, results.mjs.found === results.mjs.total ? 'green' : 'yellow');
  log(`   Faltando: ${results.mjs.missing}`, results.mjs.missing > 0 ? 'yellow' : 'green');

  // Estatísticas de Dados
  log('\n📊 ESTATÍSTICAS DE DADOS', 'bright');
  if (results.data.employees) {
    log(`   Funcionários: ${results.data.employees.total}`, 'cyan');
    log(`   Ativos: ${results.data.employees.active}`, 'cyan');
  }
  if (results.data.users) {
    log(`   Usuários: ${results.data.users.total}`, 'cyan');
    Object.entries(results.data.users.byRole).forEach(([role, count]) => {
      log(`     - ${role}: ${count}`, 'cyan');
    });
  }
  if (results.data.jobDescriptions) {
    log(`   Descrições de Cargo: ${results.data.jobDescriptions}`, 'cyan');
  }
  if (results.data.pdis) {
    log(`   PDIs: ${results.data.pdis}`, 'cyan');
  }
  if (results.data.succession) {
    log(`   Posições no Mapa de Sucessão: ${results.data.succession.positions}`, 'cyan');
  }

  // Erros
  if (results.errors.length > 0) {
    log('\n❌ ERROS CRÍTICOS', 'red');
    results.errors.forEach(err => log(`   - ${err}`, 'red'));
  }

  // Warnings
  if (results.warnings.length > 0) {
    log('\n⚠️  AVISOS', 'yellow');
    results.warnings.forEach(warn => log(`   - ${warn}`, 'yellow'));
  }

  // Status Final
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  if (results.errors.length === 0) {
    log('║                   ✅ VALIDAÇÃO APROVADA                  ║', 'green');
    log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
    log('✓ Todos os dados estão prontos para importação!', 'green');
    log('\nPróximos passos:', 'bright');
    log('1. Configurar DATABASE_URL no .env', 'cyan');
    log('2. Executar: pnpm db:push', 'cyan');
    log('3. Executar: node execute-import.mjs', 'cyan');
    log('4. Executar: node create-remaining-users.mjs', 'cyan');
    return 0;
  } else {
    log('║                   ❌ VALIDAÇÃO FALHOU                    ║', 'red');
    log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
    log('✗ Corrija os erros antes de prosseguir.', 'red');
    return 1;
  }
}

// Executar
main()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
