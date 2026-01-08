#!/usr/bin/env node
/**
 * Script de Validação Completa de Dados - Sistema AVD UISA
 * Valida TODOS os aspectos dos dados antes da importação
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
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Resultados da validação
const results = {
  total: 0,
  passed: 0,
  warnings: 0,
  errors: 0,
  details: []
};

function addResult(type, category, message, details = null) {
  results.total++;
  results[type === 'passed' ? 'passed' : type === 'warning' ? 'warnings' : 'errors']++;
  results.details.push({ type, category, message, details });
}

// Validar estrutura de arquivo
function validateFileStructure(filePath, expectedFields) {
  const fileName = path.basename(filePath);
  
  if (!fs.existsSync(filePath)) {
    addResult('error', 'Arquivo', `${fileName} não encontrado`, { filePath });
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
    addResult('passed', 'Arquivo', `${fileName} válido (${fileSize} MB)`, { size: fileSize });
    
    return data;
  } catch (err) {
    addResult('error', 'Arquivo', `${fileName} com erro: ${err.message}`, { error: err.message });
    return null;
  }
}

// Validar funcionários
function validateEmployees(data) {
  section('VALIDAÇÃO: FUNCIONÁRIOS');
  
  if (!data || !data.employees) {
    error('Estrutura inválida: campo "employees" não encontrado');
    addResult('error', 'Funcionários', 'Estrutura inválida');
    return;
  }

  const employees = data.employees;
  success(`Total de funcionários: ${employees.length}`);
  addResult('passed', 'Funcionários', `Total: ${employees.length}`, { count: employees.length });

  // Validar campos obrigatórios
  const requiredFields = ['name', 'email', 'employeeCode', 'active'];
  let missingFields = 0;
  let invalidEmails = 0;
  let duplicateEmails = new Set();
  let duplicateCodes = new Set();
  const emails = new Map();
  const codes = new Map();
  
  let ativos = 0;
  let inativos = 0;
  const cargos = new Map();
  const diretorias = new Map();

  employees.forEach((emp, index) => {
    // Campos obrigatórios
    requiredFields.forEach(field => {
      if (!emp[field]) {
        missingFields++;
      }
    });

    // Email válido
    if (emp.email && (!emp.email.includes('@') || !emp.email.includes('.'))) {
      invalidEmails++;
    }

    // Emails duplicados
    if (emp.email) {
      if (emails.has(emp.email)) {
        duplicateEmails.add(emp.email);
      } else {
        emails.set(emp.email, index);
      }
    }

    // Códigos duplicados
    if (emp.employeeCode) {
      if (codes.has(emp.employeeCode)) {
        duplicateCodes.add(emp.employeeCode);
      } else {
        codes.set(emp.employeeCode, index);
      }
    }

    // Estatísticas
    if (emp.active) ativos++;
    else inativos++;

    if (emp.cargo) {
      cargos.set(emp.cargo, (cargos.get(emp.cargo) || 0) + 1);
    }

    if (emp.diretoria) {
      diretorias.set(emp.diretoria, (diretorias.get(emp.diretoria) || 0) + 1);
    }
  });

  // Relatório de validação
  if (missingFields === 0) {
    success('Todos os campos obrigatórios estão presentes');
    addResult('passed', 'Funcionários', 'Campos obrigatórios OK');
  } else {
    warning(`${missingFields} campos obrigatórios ausentes`);
    addResult('warning', 'Funcionários', `${missingFields} campos ausentes`);
  }

  if (invalidEmails === 0) {
    success('Todos os emails são válidos');
    addResult('passed', 'Funcionários', 'Emails válidos');
  } else {
    warning(`${invalidEmails} emails inválidos`);
    addResult('warning', 'Funcionários', `${invalidEmails} emails inválidos`);
  }

  if (duplicateEmails.size === 0) {
    success('Nenhum email duplicado');
    addResult('passed', 'Funcionários', 'Emails únicos');
  } else {
    error(`${duplicateEmails.size} emails duplicados`);
    addResult('error', 'Funcionários', `${duplicateEmails.size} emails duplicados`, { emails: Array.from(duplicateEmails) });
  }

  if (duplicateCodes.size === 0) {
    success('Nenhum código duplicado');
    addResult('passed', 'Funcionários', 'Códigos únicos');
  } else {
    error(`${duplicateCodes.size} códigos duplicados`);
    addResult('error', 'Funcionários', `${duplicateCodes.size} códigos duplicados`, { codes: Array.from(duplicateCodes) });
  }

  info(`Ativos: ${ativos} (${(ativos / employees.length * 100).toFixed(1)}%)`);
  info(`Inativos: ${inativos} (${(inativos / employees.length * 100).toFixed(1)}%)`);
  addResult('passed', 'Funcionários', `Ativos: ${ativos}, Inativos: ${inativos}`, { ativos, inativos });

  // Top 10 cargos
  const topCargos = Array.from(cargos.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  info('\nTop 10 Cargos:');
  topCargos.forEach(([cargo, count]) => {
    info(`  ${cargo}: ${count} (${(count / employees.length * 100).toFixed(1)}%)`);
  });

  // Top 5 diretorias
  const topDiretorias = Array.from(diretorias.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  info('\nTop 5 Diretorias:');
  topDiretorias.forEach(([diretoria, count]) => {
    info(`  ${diretoria}: ${count} (${(count / employees.length * 100).toFixed(1)}%)`);
  });
}

// Validar usuários
function validateUsers(data) {
  section('VALIDAÇÃO: USUÁRIOS');
  
  if (!data || data.length === 0) {
    error('Arquivo de usuários vazio ou inválido');
    addResult('error', 'Usuários', 'Arquivo vazio');
    return;
  }

  success(`Total de usuários: ${data.length}`);
  addResult('passed', 'Usuários', `Total: ${data.length}`, { count: data.length });

  // Estatísticas por role
  const roles = new Map();
  let withPassword = 0;
  let withUsername = 0;

  data.forEach(user => {
    if (user.role || user.cargo) {
      const role = user.role || user.cargo;
      roles.set(role, (roles.get(role) || 0) + 1);
    }
    if (user.password) withPassword++;
    if (user.username) withUsername++;
  });

  info('\nDistribuição por Role:');
  Array.from(roles.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([role, count]) => {
      info(`  ${role}: ${count} (${(count / data.length * 100).toFixed(1)}%)`);
    });

  if (withPassword === data.length) {
    success('Todos os usuários possuem senha');
    addResult('passed', 'Usuários', 'Senhas presentes');
  } else {
    warning(`${data.length - withPassword} usuários sem senha`);
    addResult('warning', 'Usuários', `${data.length - withPassword} sem senha`);
  }

  if (withUsername === data.length) {
    success('Todos os usuários possuem username');
    addResult('passed', 'Usuários', 'Usernames presentes');
  } else {
    warning(`${data.length - withUsername} usuários sem username`);
    addResult('warning', 'Usuários', `${data.length - withUsername} sem username`);
  }

  // Verificar se senhas estão em texto plano
  const samplePassword = data[0]?.password || '';
  if (samplePassword.length < 40) {
    warning('Senhas parecem estar em texto plano (precisam ser hasheadas)');
    addResult('warning', 'Usuários', 'Senhas em texto plano', { action: 'Hashear com bcrypt' });
  } else {
    success('Senhas parecem estar hasheadas');
    addResult('passed', 'Usuários', 'Senhas hasheadas');
  }
}

// Validar PDIs
function validatePDIs(data) {
  section('VALIDAÇÃO: PDIs');
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    warning('Nenhum PDI encontrado');
    addResult('warning', 'PDIs', 'Nenhum PDI encontrado', { recommendation: 'Criar PDIs para gestores' });
    return;
  }

  success(`Total de PDIs: ${data.length}`);
  addResult('passed', 'PDIs', `Total: ${data.length}`, { count: data.length });

  // Validar estrutura de cada PDI
  let completos = 0;
  let comGaps = 0;
  let comPlano70 = 0;
  let comPlano20 = 0;
  let comPlano10 = 0;

  data.forEach(pdi => {
    if (pdi.nome && pdi.cargo && pdi.plano_acao) {
      completos++;
    }
    if (pdi.gaps_prioritarios && pdi.gaps_prioritarios.length > 0) {
      comGaps++;
    }
    if (pdi.plano_acao?.['70_pratica'] && pdi.plano_acao['70_pratica'].length > 0) {
      comPlano70++;
    }
    if (pdi.plano_acao?.['20_social'] && pdi.plano_acao['20_social'].length > 0) {
      comPlano20++;
    }
    if (pdi.plano_acao?.['10_formal'] && pdi.plano_acao['10_formal'].length > 0) {
      comPlano10++;
    }
  });

  info(`PDIs completos: ${completos} (${(completos / data.length * 100).toFixed(1)}%)`);
  info(`Com gaps mapeados: ${comGaps} (${(comGaps / data.length * 100).toFixed(1)}%)`);
  info(`Com plano 70% (prática): ${comPlano70} (${(comPlano70 / data.length * 100).toFixed(1)}%)`);
  info(`Com plano 20% (social): ${comPlano20} (${(comPlano20 / data.length * 100).toFixed(1)}%)`);
  info(`Com plano 10% (formal): ${comPlano10} (${(comPlano10 / data.length * 100).toFixed(1)}%)`);

  if (completos === data.length) {
    success('Todos os PDIs estão completos');
    addResult('passed', 'PDIs', 'Todos completos');
  } else {
    warning(`${data.length - completos} PDIs incompletos`);
    addResult('warning', 'PDIs', `${data.length - completos} incompletos`);
  }

  if (data.length < 100) {
    warning('Poucos PDIs cadastrados (recomendado: 260+ para gestores)');
    addResult('warning', 'PDIs', 'Poucos PDIs', { recommendation: 'Criar PDIs em massa' });
  }
}

// Validar Descrições de Cargo
function validateJobDescriptions(data) {
  section('VALIDAÇÃO: DESCRIÇÕES DE CARGO');
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    error('Nenhuma descrição de cargo encontrada');
    addResult('error', 'Descrições', 'Nenhuma descrição encontrada');
    return;
  }

  success(`Total de descrições: ${data.length}`);
  addResult('passed', 'Descrições', `Total: ${data.length}`, { count: data.length });

  // Validar estrutura
  let completas = 0;
  let comCompetencias = 0;
  let comRequisitos = 0;
  let comResponsabilidades = 0;
  const niveis = new Map();

  data.forEach(job => {
    if (job.cargo && job.descricao && job.departamento) {
      completas++;
    }
    if (job.competencias && job.competencias.length > 0) {
      comCompetencias++;
    }
    if (job.requisitos) {
      comRequisitos++;
    }
    if (job.responsabilidades && job.responsabilidades.length > 0) {
      comResponsabilidades++;
    }
    if (job.nivel) {
      niveis.set(job.nivel, (niveis.get(job.nivel) || 0) + 1);
    }
  });

  info(`Descrições completas: ${completas} (${(completas / data.length * 100).toFixed(1)}%)`);
  info(`Com competências: ${comCompetencias} (${(comCompetencias / data.length * 100).toFixed(1)}%)`);
  info(`Com requisitos: ${comRequisitos} (${(comRequisitos / data.length * 100).toFixed(1)}%)`);
  info(`Com responsabilidades: ${comResponsabilidades} (${(comResponsabilidades / data.length * 100).toFixed(1)}%)`);

  if (niveis.size > 0) {
    info('\nDistribuição por Nível:');
    Array.from(niveis.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([nivel, count]) => {
        info(`  ${nivel}: ${count} (${(count / data.length * 100).toFixed(1)}%)`);
      });
  }

  if (completas === data.length) {
    success('Todas as descrições estão completas');
    addResult('passed', 'Descrições', 'Todas completas');
  } else {
    warning(`${data.length - completas} descrições incompletas`);
    addResult('warning', 'Descrições', `${data.length - completas} incompletas`);
  }
}

// Validar Mapa de Sucessão
function validateSuccession(data) {
  section('VALIDAÇÃO: MAPA DE SUCESSÃO');
  
  if (!data || !data.positions) {
    error('Estrutura de sucessão inválida');
    addResult('error', 'Sucessão', 'Estrutura inválida');
    return;
  }

  const positions = data.positions;
  success(`Total de posições mapeadas: ${positions.length}`);
  addResult('passed', 'Sucessão', `Posições: ${positions.length}`, { count: positions.length });

  let comSucessores = 0;
  let semSucessores = 0;
  let totalSucessores = 0;
  const readiness = new Map();
  const exitRisks = new Map();

  positions.forEach(pos => {
    if (pos.successors && pos.successors.length > 0) {
      comSucessores++;
      totalSucessores += pos.successors.length;
      
      pos.successors.forEach(suc => {
        if (suc.readiness) {
          readiness.set(suc.readiness, (readiness.get(suc.readiness) || 0) + 1);
        }
      });
    } else {
      semSucessores++;
    }

    if (pos.incumbent?.exitRisk) {
      exitRisks.set(pos.incumbent.exitRisk, (exitRisks.get(pos.incumbent.exitRisk) || 0) + 1);
    }
  });

  info(`Posições com sucessores: ${comSucessores} (${(comSucessores / positions.length * 100).toFixed(1)}%)`);
  info(`Posições sem sucessores: ${semSucessores} (${(semSucessores / positions.length * 100).toFixed(1)}%)`);
  info(`Total de sucessores mapeados: ${totalSucessores}`);
  info(`Média de sucessores por posição: ${(totalSucessores / positions.length).toFixed(1)}`);

  if (readiness.size > 0) {
    info('\nReadiness dos Sucessores:');
    Array.from(readiness.entries())
      .forEach(([level, count]) => {
        info(`  ${level}: ${count}`);
      });
  }

  if (exitRisks.size > 0) {
    info('\nRisco de Saída dos Titulares:');
    Array.from(exitRisks.entries())
      .forEach(([risk, count]) => {
        info(`  ${risk}: ${count}`);
      });
  }

  if (semSucessores === 0) {
    success('Todas as posições possuem sucessores');
    addResult('passed', 'Sucessão', 'Todas com sucessores');
  } else {
    warning(`${semSucessores} posições sem sucessores mapeados`);
    addResult('warning', 'Sucessão', `${semSucessores} sem sucessores`);
  }
}

// Validar Scripts
function validateScripts() {
  section('VALIDAÇÃO: SCRIPTS DE IMPORTAÇÃO');
  
  const requiredScripts = [
    'execute-import.mjs',
    'create-remaining-users.mjs',
    'seed-data.mjs',
    'scripts/seed-complete-data.sql',
    'migration-employees.sql',
    'migration_avd_5_passos.sql'
  ];

  requiredScripts.forEach(script => {
    if (fs.existsSync(script)) {
      success(`${script} encontrado`);
      addResult('passed', 'Scripts', `${script} OK`);
    } else {
      error(`${script} NÃO encontrado`);
      addResult('error', 'Scripts', `${script} ausente`, { path: script });
    }
  });
}

// Main
async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║    VALIDAÇÃO COMPLETA DE DADOS - SISTEMA AVD UISA         ║', 'bright');
  log('║    Versão 2.0.0 | Janeiro 2026                            ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');

  // 1. Validar Funcionários
  const employeesData = validateFileStructure('./import-data.json', ['employees']);
  if (employeesData) {
    validateEmployees(employeesData);
  }

  // 2. Validar Usuários
  const usersData = validateFileStructure('./users-credentials.json', ['employeeCode', 'email']);
  if (usersData) {
    validateUsers(usersData);
  }

  // 3. Validar PDIs
  const pdiData = validateFileStructure('./pdi_data.json', ['nome', 'cargo']);
  if (pdiData) {
    validatePDIs(pdiData);
  }

  // 4. Validar Descrições de Cargo
  const jobDescData = validateFileStructure('./data/uisa-job-descriptions.json', ['cargo']);
  if (jobDescData) {
    validateJobDescriptions(jobDescData);
  }

  // 5. Validar Mapa de Sucessão
  const successionData = validateFileStructure('./succession-data-uisa.json', ['positions']);
  if (successionData) {
    validateSuccession(successionData);
  }

  // 6. Validar Scripts
  validateScripts();

  // Relatório Final
  section('RELATÓRIO FINAL');
  
  log(`\nTotal de validações: ${results.total}`, 'bright');
  success(`Sucesso: ${results.passed} (${(results.passed / results.total * 100).toFixed(1)}%)`);
  if (results.warnings > 0) {
    warning(`Avisos: ${results.warnings} (${(results.warnings / results.total * 100).toFixed(1)}%)`);
  }
  if (results.errors > 0) {
    error(`Erros: ${results.errors} (${(results.errors / results.total * 100).toFixed(1)}%)`);
  }

  // Status geral
  const successRate = (results.passed / results.total * 100);
  log('\nSTATUS GERAL:', 'bright');
  if (successRate >= 90) {
    success('🟢 EXCELENTE - Dados prontos para importação!');
  } else if (successRate >= 70) {
    warning('🟡 BOM - Alguns ajustes recomendados antes da importação');
  } else {
    error('🔴 ATENÇÃO - Correções necessárias antes da importação');
  }

  // Salvar relatório JSON
  const reportPath = './validacao-dados-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  info(`\nRelatório completo salvo em: ${reportPath}`);

  log('\n' + '='.repeat(60), 'cyan');
  log('Validação concluída!', 'bright');
  log('='.repeat(60) + '\n', 'cyan');

  process.exit(results.errors > 0 ? 1 : 0);
}

main().catch(err => {
  error(`Erro fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});
