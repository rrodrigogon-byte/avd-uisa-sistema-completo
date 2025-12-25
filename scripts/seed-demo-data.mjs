import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🌱 Iniciando seed de dados de demonstração...\n');

// 1. Buscar ciclo ativo
const [cycles] = await connection.query(
  "SELECT id FROM evaluationCycles WHERE status = 'active' LIMIT 1"
);

if (!cycles || cycles.length === 0) {
  console.error('❌ Nenhum ciclo ativo encontrado. Crie um ciclo antes de executar o seed.');
  process.exit(1);
}

const cycleId = cycles[0].id;
console.log(`✅ Ciclo ativo encontrado: ID ${cycleId}\n`);

// 2. Buscar colaboradores para associar metas
const [employees] = await connection.query(
  "SELECT id, name, email, positionId FROM employees ORDER BY RAND() LIMIT 50"
);

console.log(`✅ ${employees.length} colaboradores encontrados\n`);

// 3. Criar 40 Metas SMART de exemplo
console.log('📊 Criando 40 metas SMART de exemplo...');

const metasExemplo = [
  // Metas Financeiras (10)
  { title: 'Reduzir Custos Operacionais em 15%', description: 'Implementar medidas de eficiência para reduzir custos operacionais do departamento em 15% até o final do trimestre.', category: 'financial', unit: 'percentage', targetValue: 15, weight: 30, bonusEligible: true, bonusType: 'percentage', bonusValue: 5 },
  { title: 'Aumentar Receita em R$ 500.000', description: 'Gerar R$ 500.000 em receita adicional através de novos contratos e expansão de serviços.', category: 'financial', unit: 'currency', targetValue: 500000, weight: 40, bonusEligible: true, bonusType: 'fixed', bonusValue: 2000 },
  { title: 'Melhorar Margem de Lucro em 8%', description: 'Otimizar processos para aumentar a margem de lucro do departamento em 8 pontos percentuais.', category: 'financial', unit: 'percentage', targetValue: 8, weight: 35, bonusEligible: true, bonusType: 'percentage', bonusValue: 4 },
  { title: 'Reduzir Desperdício em 20%', description: 'Implementar programa de redução de desperdício de materiais em 20% no processo produtivo.', category: 'financial', unit: 'percentage', targetValue: 20, weight: 25, bonusEligible: true, bonusType: 'percentage', bonusValue: 3 },
  { title: 'Aumentar ROI de Projetos em 12%', description: 'Melhorar o retorno sobre investimento dos projetos em andamento em 12%.', category: 'financial', unit: 'percentage', targetValue: 12, weight: 30, bonusEligible: true, bonusType: 'percentage', bonusValue: 5 },
  { title: 'Economizar R$ 200.000 em Fornecedores', description: 'Renegociar contratos com fornecedores para economizar R$ 200.000 anuais.', category: 'financial', unit: 'currency', targetValue: 200000, weight: 35, bonusEligible: true, bonusType: 'fixed', bonusValue: 1500 },
  { title: 'Aumentar Faturamento em 25%', description: 'Expandir base de clientes e aumentar faturamento da unidade em 25%.', category: 'financial', unit: 'percentage', targetValue: 25, weight: 40, bonusEligible: true, bonusType: 'percentage', bonusValue: 6 },
  { title: 'Reduzir Inadimplência para 3%', description: 'Implementar política de cobrança eficaz para reduzir inadimplência para 3%.', category: 'financial', unit: 'percentage', targetValue: 3, weight: 30, bonusEligible: true, bonusType: 'percentage', bonusValue: 4 },
  { title: 'Aumentar Ticket Médio em R$ 5.000', description: 'Elevar o ticket médio de vendas em R$ 5.000 através de upselling e cross-selling.', category: 'financial', unit: 'currency', targetValue: 5000, weight: 25, bonusEligible: true, bonusType: 'fixed', bonusValue: 1000 },
  { title: 'Melhorar Eficiência Operacional em 18%', description: 'Automatizar processos para melhorar eficiência operacional em 18%.', category: 'financial', unit: 'percentage', targetValue: 18, weight: 35, bonusEligible: true, bonusType: 'percentage', bonusValue: 5 },
  
  // Metas Comportamentais (10)
  { title: 'Melhorar Comunicação com a Equipe', description: 'Realizar reuniões semanais de alinhamento e feedback com todos os membros da equipe.', category: 'behavioral', unit: 'count', targetValue: 48, weight: 20, bonusEligible: false },
  { title: 'Desenvolver Liderança Colaborativa', description: 'Participar de 3 workshops de liderança e aplicar técnicas de gestão participativa.', category: 'behavioral', unit: 'count', targetValue: 3, weight: 25, bonusEligible: false },
  { title: 'Aumentar Engajamento da Equipe para 85%', description: 'Implementar ações de reconhecimento e desenvolvimento para elevar engajamento para 85%.', category: 'behavioral', unit: 'percentage', targetValue: 85, weight: 30, bonusEligible: true, bonusType: 'percentage', bonusValue: 3 },
  { title: 'Reduzir Conflitos Internos em 50%', description: 'Aplicar técnicas de mediação e comunicação não-violenta para reduzir conflitos em 50%.', category: 'behavioral', unit: 'percentage', targetValue: 50, weight: 20, bonusEligible: false },
  { title: 'Melhorar Clima Organizacional', description: 'Elevar índice de satisfação da equipe de 70% para 85% através de ações de bem-estar.', category: 'behavioral', unit: 'percentage', targetValue: 85, weight: 25, bonusEligible: true, bonusType: 'percentage', bonusValue: 4 },
  { title: 'Desenvolver Inteligência Emocional', description: 'Completar curso de IE e aplicar técnicas de autoconhecimento e empatia no dia a dia.', category: 'behavioral', unit: 'count', targetValue: 1, weight: 15, bonusEligible: false },
  { title: 'Aumentar Colaboração entre Áreas', description: 'Criar 5 projetos interdepartamentais para melhorar sinergia entre equipes.', category: 'behavioral', unit: 'count', targetValue: 5, weight: 20, bonusEligible: false },
  { title: 'Melhorar Feedback Contínuo', description: 'Dar feedback construtivo semanal para 100% dos subordinados diretos.', category: 'behavioral', unit: 'percentage', targetValue: 100, weight: 25, bonusEligible: false },
  { title: 'Desenvolver Cultura de Inovação', description: 'Implementar programa de ideias que gere 20 sugestões de melhoria por trimestre.', category: 'behavioral', unit: 'count', targetValue: 20, weight: 30, bonusEligible: true, bonusType: 'percentage', bonusValue: 3 },
  { title: 'Aumentar Autonomia da Equipe', description: 'Delegar 70% das decisões operacionais para líderes de equipe.', category: 'behavioral', unit: 'percentage', targetValue: 70, weight: 20, bonusEligible: false },
  
  // Metas Corporativas (10)
  { title: 'Implementar Sistema de Gestão da Qualidade', description: 'Implantar ISO 9001 em todos os processos do departamento até dezembro.', category: 'corporate', unit: 'percentage', targetValue: 100, weight: 40, bonusEligible: true, bonusType: 'percentage', bonusValue: 5 },
  { title: 'Reduzir Turnover para 8%', description: 'Implementar programa de retenção de talentos para reduzir turnover de 15% para 8%.', category: 'corporate', unit: 'percentage', targetValue: 8, weight: 35, bonusEligible: true, bonusType: 'percentage', bonusValue: 4 },
  { title: 'Aumentar NPS para 80', description: 'Melhorar experiência do cliente para elevar Net Promoter Score para 80 pontos.', category: 'corporate', unit: 'score', targetValue: 80, weight: 30, bonusEligible: true, bonusType: 'percentage', bonusValue: 5 },
  { title: 'Reduzir Tempo de Resposta em 40%', description: 'Otimizar processos para reduzir tempo médio de resposta ao cliente em 40%.', category: 'corporate', unit: 'percentage', targetValue: 40, weight: 25, bonusEligible: true, bonusType: 'percentage', bonusValue: 3 },
  { title: 'Implementar Programa de Sustentabilidade', description: 'Reduzir consumo de energia em 15% e implementar coleta seletiva em 100% das áreas.', category: 'corporate', unit: 'percentage', targetValue: 15, weight: 30, bonusEligible: true, bonusType: 'percentage', bonusValue: 4 },
  { title: 'Aumentar Satisfação Interna para 90%', description: 'Elevar índice de satisfação dos colaboradores de 75% para 90%.', category: 'corporate', unit: 'percentage', targetValue: 90, weight: 35, bonusEligible: true, bonusType: 'percentage', bonusValue: 5 },
  { title: 'Reduzir Acidentes de Trabalho em 60%', description: 'Implementar programa de segurança para reduzir acidentes em 60%.', category: 'corporate', unit: 'percentage', targetValue: 60, weight: 40, bonusEligible: true, bonusType: 'percentage', bonusValue: 6 },
  { title: 'Aumentar Produtividade em 20%', description: 'Automatizar processos e treinar equipe para aumentar produtividade em 20%.', category: 'corporate', unit: 'percentage', targetValue: 20, weight: 35, bonusEligible: true, bonusType: 'percentage', bonusValue: 5 },
  { title: 'Implementar Transformação Digital', description: 'Digitalizar 80% dos processos manuais do departamento.', category: 'corporate', unit: 'percentage', targetValue: 80, weight: 40, bonusEligible: true, bonusType: 'percentage', bonusValue: 6 },
  { title: 'Melhorar Compliance para 100%', description: 'Garantir 100% de conformidade com normas regulatórias e políticas internas.', category: 'corporate', unit: 'percentage', targetValue: 100, weight: 40, bonusEligible: true, bonusType: 'percentage', bonusValue: 5 },
  
  // Metas de Desenvolvimento (10)
  { title: 'Completar MBA em Gestão Estratégica', description: 'Concluir curso de MBA com nota mínima 8.0 e aplicar conhecimentos no trabalho.', category: 'development', unit: 'count', targetValue: 1, weight: 30, bonusEligible: true, bonusType: 'fixed', bonusValue: 3000 },
  { title: 'Obter Certificação PMP', description: 'Estudar e obter certificação Project Management Professional até junho.', category: 'development', unit: 'count', targetValue: 1, weight: 35, bonusEligible: true, bonusType: 'fixed', bonusValue: 2500 },
  { title: 'Desenvolver Habilidade em Power BI', description: 'Completar 3 cursos de Power BI e criar 5 dashboards para o departamento.', category: 'development', unit: 'count', targetValue: 5, weight: 20, bonusEligible: false },
  { title: 'Aprender Inglês Avançado', description: 'Atingir nível C1 em inglês através de curso intensivo de 6 meses.', category: 'development', unit: 'count', targetValue: 1, weight: 25, bonusEligible: true, bonusType: 'fixed', bonusValue: 2000 },
  { title: 'Participar de 5 Congressos da Área', description: 'Representar a empresa em 5 eventos do setor e trazer insights para a equipe.', category: 'development', unit: 'count', targetValue: 5, weight: 20, bonusEligible: false },
  { title: 'Desenvolver Habilidade de Oratória', description: 'Fazer curso de oratória e apresentar 10 palestras internas sobre temas estratégicos.', category: 'development', unit: 'count', targetValue: 10, weight: 15, bonusEligible: false },
  { title: 'Mentorar 5 Colaboradores Júnior', description: 'Atuar como mentor de 5 profissionais júnior para desenvolvimento de carreira.', category: 'development', unit: 'count', targetValue: 5, weight: 20, bonusEligible: false },
  { title: 'Publicar 3 Artigos Técnicos', description: 'Escrever e publicar 3 artigos sobre boas práticas da área em revistas especializadas.', category: 'development', unit: 'count', targetValue: 3, weight: 15, bonusEligible: false },
  { title: 'Completar Trilha de Liderança', description: 'Concluir programa de desenvolvimento de líderes com 120 horas de treinamento.', category: 'development', unit: 'count', targetValue: 120, weight: 30, bonusEligible: true, bonusType: 'percentage', bonusValue: 4 },
  { title: 'Desenvolver Visão Estratégica', description: 'Participar de comitê estratégico e contribuir com 10 propostas de melhoria.', category: 'development', unit: 'count', targetValue: 10, weight: 25, bonusEligible: false },
];

let metasCriadas = 0;
const dataInicio = new Date();
const dataFim = new Date();
dataFim.setMonth(dataFim.getMonth() + 6); // 6 meses de prazo

for (const meta of metasExemplo) {
  const employee = employees[Math.floor(Math.random() * employees.length)];
  
  // Progresso aleatório entre 0-100%
  const currentValue = Math.floor(Math.random() * meta.targetValue);
  const progress = Math.min(100, Math.floor((currentValue / meta.targetValue) * 100));
  
  // Status baseado no progresso
  let status = 'in_progress';
  if (progress === 0) status = 'draft';
  else if (progress === 100) status = 'completed';
  else if (progress >= 70) status = 'on_track';
  else if (progress >= 40) status = 'at_risk';
  else status = 'behind';
  
  try {
    await connection.query(
      `INSERT INTO smartGoals (
        employeeId, cycleId, title, description, category, type,
        unit, targetValue, currentValue, progress, weight, status,
        startDate, dueDate, bonusEligible, bonusType, bonusValue,
        isSpecific, isMeasurable, isAchievable, isRelevant, isTimeBound,
        smartScore, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        employee.id, cycleId, meta.title, meta.description, meta.category, 'individual',
        meta.unit, meta.targetValue, currentValue, progress, meta.weight, status,
        dataInicio, dataFim, meta.bonusEligible || false, meta.bonusType || null, meta.bonusValue || null,
        true, true, true, true, true, 100
      ]
    );
    metasCriadas++;
  } catch (error) {
    console.error(`Erro ao criar meta "${meta.title}":`, error.message);
  }
}

console.log(`✅ ${metasCriadas} metas SMART criadas com sucesso!\n`);

// 4. Criar 10 Avaliações 360° de exemplo
console.log('🎯 Criando 10 avaliações 360° de exemplo...');

let avaliacoesCriadas = 0;

for (let i = 0; i < 10; i++) {
  const employee = employees[i];
  
  // Notas aleatórias entre 3.0 e 5.0
  const selfScore = (Math.random() * 2 + 3).toFixed(1);
  const managerScore = (Math.random() * 2 + 3).toFixed(1);
  const peerScore = (Math.random() * 2 + 3).toFixed(1);
  const subordinateScore = (Math.random() * 2 + 3).toFixed(1);
  const finalScore = ((parseFloat(selfScore) + parseFloat(managerScore) + parseFloat(peerScore) + parseFloat(subordinateScore)) / 4).toFixed(1);
  
  // Status aleatório
  const statuses = ['pending', 'self_assessment', 'manager_review', 'peer_review', 'completed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  try {
    await connection.query(
      `INSERT INTO evaluations (
        employeeId, cycleId, evaluationType, status,
        selfAssessmentScore, managerScore, peerScore, subordinateScore, finalScore,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        employee.id, cycleId, '360', status,
        selfScore, managerScore, peerScore, subordinateScore, finalScore
      ]
    );
    avaliacoesCriadas++;
  } catch (error) {
    console.error(`Erro ao criar avaliação para ${employee.name}:`, error.message);
  }
}

console.log(`✅ ${avaliacoesCriadas} avaliações 360° criadas com sucesso!\n`);

// 5. Criar 5 PDIs Inteligentes de exemplo
console.log('📚 Criando 5 PDIs Inteligentes de exemplo...');

const pdisExemplo = [
  {
    title: 'Desenvolvimento em Liderança Estratégica',
    description: 'Plano focado em desenvolver competências de liderança estratégica e gestão de mudanças.',
    duration: 12,
    objectives: 'Desenvolver visão estratégica, melhorar comunicação executiva, liderar projetos de transformação.',
    actions: '70% Experiência: Liderar 3 projetos estratégicos | 20% Relacionamento: Mentorias com C-Level | 10% Educação: MBA Executivo'
  },
  {
    title: 'Transição para Gestão de Pessoas',
    description: 'PDI para colaborador técnico que assumirá posição de liderança.',
    duration: 9,
    objectives: 'Desenvolver habilidades de gestão de equipes, feedback e desenvolvimento de pessoas.',
    actions: '70% Experiência: Co-liderar equipe de 5 pessoas | 20% Relacionamento: Mentoria com gestor sênior | 10% Educação: Curso de Liderança'
  },
  {
    title: 'Especialização Técnica em Data Analytics',
    description: 'Desenvolvimento de competências avançadas em análise de dados e BI.',
    duration: 6,
    objectives: 'Dominar Power BI, Python para análise de dados e storytelling com dados.',
    actions: '70% Experiência: Criar 10 dashboards estratégicos | 20% Relacionamento: Networking com analistas sênior | 10% Educação: Certificação Power BI'
  },
  {
    title: 'Preparação para Sucessão - Gerente de Operações',
    description: 'PDI para sucessor identificado para posição de Gerente de Operações.',
    duration: 18,
    objectives: 'Desenvolver visão sistêmica, gestão de processos e liderança de equipes multifuncionais.',
    actions: '70% Experiência: Job rotation em 4 áreas | 20% Relacionamento: Shadowing do gerente atual | 10% Educação: Especialização em Gestão'
  },
  {
    title: 'Desenvolvimento de Soft Skills',
    description: 'Foco em comunicação, inteligência emocional e trabalho em equipe.',
    duration: 6,
    objectives: 'Melhorar comunicação interpessoal, desenvolver empatia e colaboração.',
    actions: '70% Experiência: Participar de 5 projetos interdepartamentais | 20% Relacionamento: Grupo de estudos de IE | 10% Educação: Workshop de Comunicação'
  }
];

let pdisCriados = 0;

for (let i = 0; i < 5; i++) {
  const employee = employees[10 + i]; // Usar colaboradores diferentes
  const pdi = pdisExemplo[i];
  
  const statuses = ['draft', 'pending_approval', 'approved', 'in_progress'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + pdi.duration);
  
  try {
    await connection.query(
      `INSERT INTO pdis (
        employeeId, title, description, status, duration,
        objectives, actions, startDate, endDate,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        employee.id, pdi.title, pdi.description, status, pdi.duration,
        pdi.objectives, pdi.actions, startDate, endDate
      ]
    );
    pdisCriados++;
  } catch (error) {
    console.error(`Erro ao criar PDI "${pdi.title}":`, error.message);
  }
}

console.log(`✅ ${pdisCriados} PDIs Inteligentes criados com sucesso!\n`);

// 6. Resumo final
console.log('🎉 Seed de dados de demonstração concluído com sucesso!\n');
console.log('📊 Resumo:');
console.log(`   - ${metasCriadas} Metas SMART`);
console.log(`   - ${avaliacoesCriadas} Avaliações 360°`);
console.log(`   - ${pdisCriados} PDIs Inteligentes`);
console.log(`   - ${employees.length} Colaboradores utilizados`);
console.log(`   - Ciclo ID: ${cycleId}\n`);

await connection.end();
console.log('✅ Conexão com banco de dados encerrada.');
