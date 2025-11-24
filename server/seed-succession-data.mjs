import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { employees, positions, departments, costCenters, successionPlans, successionCandidates } from '../drizzle/schema.js';

/**
 * Script de Seed para Popular Dados Reais do Mapa de Sucessão UISA
 * - 42 funcionários
 * - 30 cargos críticos
 * - Planos de sucessão iniciais
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('🚀 Iniciando seed de dados de sucessão...\n');

// Departamentos UISA
const departmentData = [
  { name: 'Diretoria Executiva', code: 'DIR-EXEC' },
  { name: 'Comercial', code: 'COM' },
  { name: 'Operações', code: 'OPS' },
  { name: 'Financeiro', code: 'FIN' },
  { name: 'Recursos Humanos', code: 'RH' },
  { name: 'TI', code: 'TI' },
  { name: 'Marketing', code: 'MKT' },
  { name: 'Jurídico', code: 'JUR' },
];

// Centros de Custo
const costCenterData = [
  { code: 'CC-001', name: 'Diretoria', budget: 5000000 },
  { code: 'CC-002', name: 'Comercial', budget: 3000000 },
  { code: 'CC-003', name: 'Operações', budget: 4000000 },
  { code: 'CC-004', name: 'Administrativo', budget: 2000000 },
];

// 30 Cargos Críticos
const positionData = [
  // Diretoria (5 cargos)
  { title: 'CEO', level: 'diretoria', department: 'Diretoria Executiva', isCritical: true },
  { title: 'Diretor Comercial', level: 'diretoria', department: 'Comercial', isCritical: true },
  { title: 'Diretor de Operações', level: 'diretoria', department: 'Operações', isCritical: true },
  { title: 'Diretor Financeiro', level: 'diretoria', department: 'Financeiro', isCritical: true },
  { title: 'Diretor de RH', level: 'diretoria', department: 'Recursos Humanos', isCritical: true },
  
  // Gerência (10 cargos)
  { title: 'Gerente de Vendas', level: 'gerencia', department: 'Comercial', isCritical: true },
  { title: 'Gerente de Marketing', level: 'gerencia', department: 'Marketing', isCritical: true },
  { title: 'Gerente de Operações', level: 'gerencia', department: 'Operações', isCritical: true },
  { title: 'Gerente de Logística', level: 'gerencia', department: 'Operações', isCritical: true },
  { title: 'Gerente Financeiro', level: 'gerencia', department: 'Financeiro', isCritical: true },
  { title: 'Gerente de Controladoria', level: 'gerencia', department: 'Financeiro', isCritical: true },
  { title: 'Gerente de TI', level: 'gerencia', department: 'TI', isCritical: true },
  { title: 'Gerente de RH', level: 'gerencia', department: 'Recursos Humanos', isCritical: true },
  { title: 'Gerente Jurídico', level: 'gerencia', department: 'Jurídico', isCritical: true },
  { title: 'Gerente de Projetos', level: 'gerencia', department: 'Operações', isCritical: true },
  
  // Coordenação (10 cargos)
  { title: 'Coordenador de Vendas', level: 'coordenacao', department: 'Comercial', isCritical: false },
  { title: 'Coordenador de Marketing Digital', level: 'coordenacao', department: 'Marketing', isCritical: false },
  { title: 'Coordenador de Produção', level: 'coordenacao', department: 'Operações', isCritical: false },
  { title: 'Coordenador de Qualidade', level: 'coordenacao', department: 'Operações', isCritical: false },
  { title: 'Coordenador Financeiro', level: 'coordenacao', department: 'Financeiro', isCritical: false },
  { title: 'Coordenador de Contas a Pagar', level: 'coordenacao', department: 'Financeiro', isCritical: false },
  { title: 'Coordenador de Infraestrutura', level: 'coordenacao', department: 'TI', isCritical: false },
  { title: 'Coordenador de Recrutamento', level: 'coordenacao', department: 'Recursos Humanos', isCritical: false },
  { title: 'Coordenador de Treinamento', level: 'coordenacao', department: 'Recursos Humanos', isCritical: false },
  { title: 'Coordenador de Contratos', level: 'coordenacao', department: 'Jurídico', isCritical: false },
  
  // Operacional (5 cargos)
  { title: 'Analista de Vendas Sênior', level: 'operacional', department: 'Comercial', isCritical: false },
  { title: 'Analista Financeiro Sênior', level: 'operacional', department: 'Financeiro', isCritical: false },
  { title: 'Analista de RH Sênior', level: 'operacional', department: 'Recursos Humanos', isCritical: false },
  { title: 'Analista de TI Sênior', level: 'operacional', department: 'TI', isCritical: false },
  { title: 'Analista de Marketing Sênior', level: 'operacional', department: 'Marketing', isCritical: false },
];

// 42 Funcionários
const employeeData = [
  // Diretoria (5 pessoas)
  { name: 'Carlos Eduardo Silva', email: 'carlos.silva@uisa.com.br', position: 'CEO', department: 'Diretoria Executiva', salary: 45000, admissionDate: '2015-01-15' },
  { name: 'Ana Paula Mendes', email: 'ana.mendes@uisa.com.br', position: 'Diretor Comercial', department: 'Comercial', salary: 35000, admissionDate: '2016-03-20' },
  { name: 'Roberto Almeida', email: 'roberto.almeida@uisa.com.br', position: 'Diretor de Operações', department: 'Operações', salary: 35000, admissionDate: '2016-06-10' },
  { name: 'Fernanda Costa', email: 'fernanda.costa@uisa.com.br', position: 'Diretor Financeiro', department: 'Financeiro', salary: 35000, admissionDate: '2017-02-01' },
  { name: 'Juliana Santos', email: 'juliana.santos@uisa.com.br', position: 'Diretor de RH', department: 'Recursos Humanos', salary: 32000, admissionDate: '2017-08-15' },
  
  // Gerência (10 pessoas)
  { name: 'Marcos Oliveira', email: 'marcos.oliveira@uisa.com.br', position: 'Gerente de Vendas', department: 'Comercial', salary: 18000, admissionDate: '2018-01-10' },
  { name: 'Patricia Lima', email: 'patricia.lima@uisa.com.br', position: 'Gerente de Marketing', department: 'Marketing', salary: 16000, admissionDate: '2018-04-15' },
  { name: 'Ricardo Souza', email: 'ricardo.souza@uisa.com.br', position: 'Gerente de Operações', department: 'Operações', salary: 17000, admissionDate: '2018-07-20' },
  { name: 'Camila Rodrigues', email: 'camila.rodrigues@uisa.com.br', position: 'Gerente de Logística', department: 'Operações', salary: 16000, admissionDate: '2019-01-05' },
  { name: 'Bruno Ferreira', email: 'bruno.ferreira@uisa.com.br', position: 'Gerente Financeiro', department: 'Financeiro', salary: 17000, admissionDate: '2019-03-12' },
  { name: 'Luciana Martins', email: 'luciana.martins@uisa.com.br', position: 'Gerente de Controladoria', department: 'Financeiro', salary: 16000, admissionDate: '2019-06-18' },
  { name: 'Felipe Barbosa', email: 'felipe.barbosa@uisa.com.br', position: 'Gerente de TI', department: 'TI', salary: 18000, admissionDate: '2019-09-22' },
  { name: 'Tatiana Gomes', email: 'tatiana.gomes@uisa.com.br', position: 'Gerente de RH', department: 'Recursos Humanos', salary: 15000, admissionDate: '2020-01-08' },
  { name: 'André Carvalho', email: 'andre.carvalho@uisa.com.br', position: 'Gerente Jurídico', department: 'Jurídico', salary: 19000, admissionDate: '2020-04-14' },
  { name: 'Renata Dias', email: 'renata.dias@uisa.com.br', position: 'Gerente de Projetos', department: 'Operações', salary: 17000, admissionDate: '2020-07-20' },
  
  // Coordenação (15 pessoas)
  { name: 'Paulo Henrique', email: 'paulo.henrique@uisa.com.br', position: 'Coordenador de Vendas', department: 'Comercial', salary: 10000, admissionDate: '2020-10-05' },
  { name: 'Mariana Castro', email: 'mariana.castro@uisa.com.br', position: 'Coordenador de Marketing Digital', department: 'Marketing', salary: 9500, admissionDate: '2021-01-12' },
  { name: 'Thiago Ribeiro', email: 'thiago.ribeiro@uisa.com.br', position: 'Coordenador de Produção', department: 'Operações', salary: 10500, admissionDate: '2021-03-18' },
  { name: 'Gabriela Nunes', email: 'gabriela.nunes@uisa.com.br', position: 'Coordenador de Qualidade', department: 'Operações', salary: 10000, admissionDate: '2021-06-22' },
  { name: 'Leonardo Pinto', email: 'leonardo.pinto@uisa.com.br', position: 'Coordenador Financeiro', department: 'Financeiro', salary: 10500, admissionDate: '2021-09-08' },
  { name: 'Beatriz Moreira', email: 'beatriz.moreira@uisa.com.br', position: 'Coordenador de Contas a Pagar', department: 'Financeiro', salary: 9000, admissionDate: '2021-11-15' },
  { name: 'Rodrigo Teixeira', email: 'rodrigo.teixeira@uisa.com.br', position: 'Coordenador de Infraestrutura', department: 'TI', salary: 11000, admissionDate: '2022-01-20' },
  { name: 'Aline Freitas', email: 'aline.freitas@uisa.com.br', position: 'Coordenador de Recrutamento', department: 'Recursos Humanos', salary: 9500, admissionDate: '2022-03-25' },
  { name: 'Gustavo Araújo', email: 'gustavo.araujo@uisa.com.br', position: 'Coordenador de Treinamento', department: 'Recursos Humanos', salary: 9500, admissionDate: '2022-06-10' },
  { name: 'Vanessa Correia', email: 'vanessa.correia@uisa.com.br', position: 'Coordenador de Contratos', department: 'Jurídico', salary: 10000, admissionDate: '2022-08-15' },
  { name: 'Daniel Azevedo', email: 'daniel.azevedo@uisa.com.br', position: 'Analista de Vendas Sênior', department: 'Comercial', salary: 7500, admissionDate: '2022-10-20' },
  { name: 'Larissa Monteiro', email: 'larissa.monteiro@uisa.com.br', position: 'Analista Financeiro Sênior', department: 'Financeiro', salary: 7500, admissionDate: '2023-01-08' },
  { name: 'Vinícius Ramos', email: 'vinicius.ramos@uisa.com.br', position: 'Analista de RH Sênior', department: 'Recursos Humanos', salary: 7000, admissionDate: '2023-03-15' },
  { name: 'Isabela Cunha', email: 'isabela.cunha@uisa.com.br', position: 'Analista de TI Sênior', department: 'TI', salary: 8000, admissionDate: '2023-05-22' },
  { name: 'Rafael Cardoso', email: 'rafael.cardoso@uisa.com.br', position: 'Analista de Marketing Sênior', department: 'Marketing', salary: 7500, admissionDate: '2023-07-18' },
  
  // Operacional (12 pessoas)
  { name: 'Amanda Silva', email: 'amanda.silva@uisa.com.br', position: 'Analista de Vendas Sênior', department: 'Comercial', salary: 6500, admissionDate: '2023-09-10' },
  { name: 'Lucas Pereira', email: 'lucas.pereira@uisa.com.br', position: 'Analista Financeiro Sênior', department: 'Financeiro', salary: 6500, admissionDate: '2023-11-05' },
  { name: 'Juliana Rocha', email: 'juliana.rocha@uisa.com.br', position: 'Analista de RH Sênior', department: 'Recursos Humanos', salary: 6000, admissionDate: '2024-01-12' },
  { name: 'Pedro Santana', email: 'pedro.santana@uisa.com.br', position: 'Analista de TI Sênior', department: 'TI', salary: 7000, admissionDate: '2024-03-08' },
  { name: 'Carolina Vieira', email: 'carolina.vieira@uisa.com.br', position: 'Analista de Marketing Sênior', department: 'Marketing', salary: 6500, admissionDate: '2024-05-15' },
  { name: 'Matheus Alves', email: 'matheus.alves@uisa.com.br', position: 'Analista de Vendas Sênior', department: 'Comercial', salary: 6000, admissionDate: '2024-07-20' },
  { name: 'Bianca Fernandes', email: 'bianca.fernandes@uisa.com.br', position: 'Analista Financeiro Sênior', department: 'Financeiro', salary: 6000, admissionDate: '2024-09-10' },
  { name: 'Diego Nascimento', email: 'diego.nascimento@uisa.com.br', position: 'Analista de RH Sênior', department: 'Recursos Humanos', salary: 5500, admissionDate: '2024-10-15' },
  { name: 'Letícia Campos', email: 'leticia.campos@uisa.com.br', position: 'Analista de TI Sênior', department: 'TI', salary: 6500, admissionDate: '2024-11-01' },
  { name: 'Henrique Lopes', email: 'henrique.lopes@uisa.com.br', position: 'Analista de Marketing Sênior', department: 'Marketing', salary: 6000, admissionDate: '2024-11-20' },
  { name: 'Natália Moura', email: 'natalia.moura@uisa.com.br', position: 'Analista de Vendas Sênior', department: 'Comercial', salary: 5800, admissionDate: '2024-12-01' },
  { name: 'Fábio Costa', email: 'fabio.costa@uisa.com.br', position: 'Analista Financeiro Sênior', department: 'Financeiro', salary: 5800, admissionDate: '2024-12-10' },
];

try {
  // 1. Inserir Departamentos
  console.log('📁 Inserindo departamentos...');
  const insertedDepts = [];
  for (const dept of departmentData) {
    const [result] = await db.insert(departments).values(dept);
    insertedDepts.push({ ...dept, id: result.insertId });
  }
  console.log(`✅ ${insertedDepts.length} departamentos inseridos\n`);

  // 2. Inserir Centros de Custo
  console.log('💰 Inserindo centros de custo...');
  const insertedCCs = [];
  for (const cc of costCenterData) {
    const [result] = await db.insert(costCenters).values(cc);
    insertedCCs.push({ ...cc, id: result.insertId });
  }
  console.log(`✅ ${insertedCCs.length} centros de custo inseridos\n`);

  // 3. Inserir Cargos
  console.log('👔 Inserindo cargos...');
  const insertedPositions = [];
  for (const pos of positionData) {
    const dept = insertedDepts.find(d => d.name === pos.department);
    const [result] = await db.insert(positions).values({
      title: pos.title,
      level: pos.level,
      departmentId: dept?.id,
      isCritical: pos.isCritical,
    });
    insertedPositions.push({ ...pos, id: result.insertId });
  }
  console.log(`✅ ${insertedPositions.length} cargos inseridos\n`);

  // 4. Inserir Funcionários
  console.log('👥 Inserindo funcionários...');
  const insertedEmployees = [];
  for (const emp of employeeData) {
    const position = insertedPositions.find(p => p.title === emp.position);
    const dept = insertedDepts.find(d => d.name === emp.department);
    const cc = insertedCCs.find(c => c.name.includes(emp.department.split(' ')[0])) || insertedCCs[0];
    
    const [result] = await db.insert(employees).values({
      name: emp.name,
      email: emp.email,
      positionId: position?.id,
      departmentId: dept?.id,
      costCenterId: cc?.id,
      salary: emp.salary,
      admissionDate: new Date(emp.admissionDate),
      status: 'ativo',
    });
    insertedEmployees.push({ ...emp, id: result.insertId });
  }
  console.log(`✅ ${insertedEmployees.length} funcionários inseridos\n`);

  // 5. Criar Planos de Sucessão para Cargos Críticos
  console.log('📋 Criando planos de sucessão...');
  const criticalPositions = insertedPositions.filter(p => p.isCritical);
  let plansCreated = 0;
  
  for (const pos of criticalPositions) {
    const currentHolder = insertedEmployees.find(e => e.position === pos.title);
    if (currentHolder) {
      const [result] = await db.insert(successionPlans).values({
        positionId: pos.id,
        currentHolderId: currentHolder.id,
        riskLevel: 'medio',
        impactLevel: 'alto',
        status: 'ativo',
        lastReviewDate: new Date(),
      });
      plansCreated++;
      
      // Adicionar 2-3 sucessores potenciais por cargo crítico
      const potentialSuccessors = insertedEmployees
        .filter(e => e.department === pos.department && e.id !== currentHolder.id)
        .slice(0, 3);
      
      for (let i = 0; i < potentialSuccessors.length; i++) {
        const successor = potentialSuccessors[i];
        const readinessLevels = ['imediato', '1_ano', '2_3_anos'];
        await db.insert(successionCandidates).values({
          successionPlanId: result.insertId,
          employeeId: successor.id,
          readinessLevel: readinessLevels[i] || '2_3_anos',
          performance: Math.floor(Math.random() * 2) + 3, // 3-5
          potential: Math.floor(Math.random() * 2) + 3, // 3-5
          notes: `Candidato promissor para ${pos.title}`,
        });
      }
    }
  }
  console.log(`✅ ${plansCreated} planos de sucessão criados\n`);

  console.log('🎉 Seed concluído com sucesso!');
  console.log(`\n📊 Resumo:`);
  console.log(`   - ${insertedDepts.length} departamentos`);
  console.log(`   - ${insertedCCs.length} centros de custo`);
  console.log(`   - ${insertedPositions.length} cargos (${criticalPositions.length} críticos)`);
  console.log(`   - ${insertedEmployees.length} funcionários`);
  console.log(`   - ${plansCreated} planos de sucessão`);

} catch (error) {
  console.error('❌ Erro durante seed:', error);
  process.exit(1);
} finally {
  await connection.end();
}
