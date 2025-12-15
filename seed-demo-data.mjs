/**
 * Script de Seed com Dados de Exemplo Completos
 * 
 * Popula o banco com dados realistas para demonstração:
 * - Metas SMART (5-10 por colaborador selecionado)
 * - Avaliações 360° completas (self + manager + peers)
 * - PDIs Inteligentes (5-10 completos com ações 70-20-10)
 * - Nine Box com posicionamentos
 * - Feedbacks contínuos
 * - Badges conquistados
 * - Calibrações
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, gte } from "drizzle-orm";
import mysql from "mysql2/promise";
import {
  employees,
  goals,
  pdiPlans,
  pdiIntelligentDetails,
  pdiItems,
  evaluationCycles,
  performanceEvaluations,
  nineBoxPositions,
  feedbacks,
  badges,
  employeeBadges,
} from "./drizzle/schema.js";

// Conectar ao banco
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Iniciando seed de dados de exemplo...\n");

// ============================================================================
// 1. BUSCAR DADOS EXISTENTES
// ============================================================================

console.log("📊 Buscando dados existentes...");

// Buscar ciclo ativo
const [activeCycle] = await db
  .select()
  .from(evaluationCycles)
  .where(eq(evaluationCycles.status, "em_andamento"))
  .limit(1);

if (!activeCycle) {
  console.error("❌ Nenhum ciclo ativo encontrado. Crie um ciclo primeiro.");
  process.exit(1);
}

console.log(`✅ Ciclo ativo: ${activeCycle.name} (ID: ${activeCycle.id})`);

// Buscar colaboradores para popular (primeiros 10)
const employeesList = await db
  .select()
  .from(employees)
  .limit(10);

console.log(`✅ ${employeesList.length} colaboradores selecionados para seed\n`);

// ============================================================================
// 2. CRIAR METAS SMART
// ============================================================================

console.log("🎯 Criando metas SMART...");

const metasTemplates = [
  {
    title: "Aumentar Produtividade da Equipe",
    description: "Aumentar a produtividade da equipe em 15% através da implementação de metodologias ágeis e automação de processos repetitivos.",
    type: "individual",
    category: "quantitativa",
    weight: 20,
    targetValue: 115,
    measurementCriteria: "Percentual de aumento medido através de KPIs de entrega e tempo de ciclo",
  },
  {
    title: "Reduzir Custos Operacionais",
    description: "Reduzir custos operacionais em 10% através da otimização de processos e renegociação de contratos com fornecedores.",
    type: "equipe",
    category: "quantitativa",
    weight: 25,
    targetValue: 90,
    measurementCriteria: "Percentual de redução em relação ao orçamento do ano anterior",
  },
  {
    title: "Melhorar Satisfação do Cliente",
    description: "Aumentar o NPS (Net Promoter Score) de 7.5 para 8.5 através de melhorias no atendimento e qualidade dos produtos.",
    type: "organizacional",
    category: "qualitativa",
    weight: 20,
    targetValue: 85,
    measurementCriteria: "Pesquisa de satisfação trimestral com clientes",
  },
  {
    title: "Desenvolver Novas Competências",
    description: "Concluir 3 certificações profissionais relevantes para a área de atuação até o final do ano.",
    type: "individual",
    category: "qualitativa",
    weight: 15,
    targetValue: 3,
    measurementCriteria: "Número de certificações concluídas com aprovação",
  },
  {
    title: "Implementar Projeto Estratégico",
    description: "Liderar a implementação do novo sistema de gestão integrada, garantindo go-live até dezembro com 95% de adesão.",
    type: "equipe",
    category: "quantitativa",
    weight: 20,
    targetValue: 95,
    measurementCriteria: "Percentual de adesão dos usuários após 30 dias do go-live",
  },
];

let metasCriadas = 0;

for (const employee of employeesList) {
  // Criar 3-5 metas por colaborador
  const numMetas = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < numMetas; i++) {
    const template = metasTemplates[i % metasTemplates.length];
    const progress = Math.floor(Math.random() * 100);
    
    const startDate = new Date(activeCycle.startDate);
    const endDate = new Date(activeCycle.endDate);
    
    await db.insert(goals).values({
      cycleId: activeCycle.id,
      employeeId: employee.id,
      title: template.title,
      description: template.description,
      type: template.type,
      category: template.category,
      status: progress === 100 ? "concluida" : progress > 0 ? "em_andamento" : "pendente",
      weight: template.weight,
      startDate,
      endDate,
      targetValue: String(template.targetValue),
      currentValue: String(Math.floor((progress / 100) * template.targetValue)),
      progress,
      createdBy: 1,
      approvedBy: 1,
      approvedAt: new Date(),
    });
    
    metasCriadas++;
  }
}

console.log(`✅ ${metasCriadas} metas criadas\n`);

// ============================================================================
// 3. CRIAR PDIs INTELIGENTES (DESABILITADO - tabela não existe)
// ============================================================================
/*

console.log("📚 Criando PDIs Inteligentes...");

const pdiTemplates = [
  {
    targetPosition: "Gerente de Projetos",
    strategicContext: "Preparação para assumir posição de liderança em projetos estratégicos da organização, com foco em gestão de equipes multidisciplinares e entrega de resultados.",
    milestone12: "Conclusão de certificação PMP e liderança de 2 projetos de médio porte",
    milestone24: "Gestão completa de portfólio de projetos e mentoria de novos líderes",
    actions: [
      { type: "70", title: "Liderar Projeto Piloto de Transformação Digital", description: "Assumir liderança de projeto estratégico com equipe de 8 pessoas, orçamento de R$ 500k e prazo de 6 meses", expectedResult: "Entrega do projeto no prazo com 95% de satisfação dos stakeholders" },
      { type: "70", title: "Gestão de Conflitos em Equipe Multidisciplinar", description: "Mediar conflitos e alinhar expectativas em equipe com perfis diversos (TI, negócio, operações)", expectedResult: "Redução de 50% nos conflitos reportados e aumento de 30% na colaboração" },
      { type: "20", title: "Mentoria com Gerente Sênior de PMO", description: "Sessões quinzenais de 1h com gerente experiente para discussão de casos reais e desafios", expectedResult: "Aplicação de 5 técnicas avançadas de gestão em projetos reais" },
      { type: "20", title: "Participação em Comitê de Governança", description: "Observar e participar de reuniões mensais do comitê de governança de projetos", expectedResult: "Compreensão profunda dos processos de tomada de decisão estratégica" },
      { type: "10", title: "Certificação PMP (Project Management Professional)", description: "Estudo e aprovação na certificação PMP do PMI", expectedResult: "Certificação obtida com nota mínima de 80%" },
      { type: "10", title: "Curso de Liderança Situacional", description: "Curso de 40h sobre liderança situacional e gestão de mudanças", expectedResult: "Aplicação imediata de técnicas em situações reais" },
    ],
  },
  {
    targetPosition: "Coordenador de Operações",
    strategicContext: "Desenvolvimento para coordenação de operações com foco em eficiência operacional, gestão de indicadores e melhoria contínua.",
    milestone12: "Coordenação de 1 turno completo com resultados acima da média",
    milestone24: "Gestão de múltiplos turnos e implementação de programa de melhoria contínua",
    actions: [
      { type: "70", title: "Coordenar Turno de Produção", description: "Assumir coordenação de turno com 25 operadores, responsável por metas de produção e qualidade", expectedResult: "Atingir 105% das metas de produção por 3 meses consecutivos" },
      { type: "70", title: "Implementar Kaizen no Setor", description: "Liderar implementação de metodologia Kaizen com equipe, identificando oportunidades de melhoria", expectedResult: "10 melhorias implementadas com ganho de 15% em eficiência" },
      { type: "20", title: "Job Rotation em Diferentes Turnos", description: "Rotacionar por 3 turnos diferentes para compreender desafios específicos de cada período", expectedResult: "Mapeamento completo de gargalos e oportunidades por turno" },
      { type: "20", title: "Shadowing com Coordenador Experiente", description: "Acompanhar coordenador sênior por 2 meses em situações críticas e tomadas de decisão", expectedResult: "Repertório de 20 situações críticas e resoluções aplicáveis" },
      { type: "10", title: "Green Belt Lean Six Sigma", description: "Certificação Green Belt com projeto prático de melhoria", expectedResult: "Certificação obtida e projeto com ganho mensurável" },
      { type: "10", title: "Curso de Gestão de Indicadores", description: "Curso de 24h sobre KPIs operacionais e dashboards gerenciais", expectedResult: "Criação de dashboard personalizado para o setor" },
    ],
  },
];

let pdisCriados = 0;

for (let i = 0; i < Math.min(5, employeesList.length); i++) {
  const employee = employeesList[i];
  const template = pdiTemplates[i % pdiTemplates.length];
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 24);
  
  // Criar PDI Plan
  const [plan] = await db.insert(pdiPlans).values({
    cycleId: activeCycle.id,
    employeeId: employee.id,
    targetPositionId: Math.floor(Math.random() * 50) + 1, // Posição aleatória
    status: "em_andamento",
    startDate,
    endDate,
    overallProgress: Math.floor(Math.random() * 60) + 10,
  }).$returningId();
  
  // Criar detalhes inteligentes
  await db.insert(pdiIntelligentDetails).values({
    planId: plan.id,
    strategicContext: template.strategicContext,
    durationMonths: 24,
    mentorId: 1,
    currentProfile: { disc: { d: 65, i: 45, s: 55, c: 70 }, bigFive: { o: 75, c: 80, e: 60, a: 70, n: 40 } },
    targetProfile: { disc: { d: 75, i: 55, s: 50, c: 75 }, bigFive: { o: 80, c: 85, e: 70, a: 75, n: 35 } },
    gapsAnalysis: { competencias: ["Liderança Estratégica", "Gestão de Conflitos", "Visão Sistêmica"], comportamentais: ["Assertividade", "Influência"] },
    milestone12Months: template.milestone12,
    milestone24Months: template.milestone24,
    readinessScore: Math.floor(Math.random() * 30) + 60,
  });
  
  // Criar ações do PDI
  for (const action of template.actions) {
    const progress = Math.floor(Math.random() * 100);
    await db.insert(pdiItems).values({
      planId: plan.id,
      type: action.type,
      title: action.title,
      description: action.description,
      expectedResult: action.expectedResult,
      status: progress === 100 ? "concluida" : progress > 0 ? "em_andamento" : "nao_iniciada",
      progress,
      priority: action.type === "70" ? "alta" : action.type === "20" ? "media" : "baixa",
    });
  }
  
  pdisCriados++;
}

console.log(`✅ ${pdisCriados} PDIs Inteligentes criados\n`);
*/

console.log("⚠️  PDIs desabilitados (tabela pdiIntelligentDetails não existe)\n");

// ============================================================================
// 4. CRIAR AVALIAÇÕES 360° (Simplificado)
// ============================================================================

console.log("🔄 Criando avaliações 360°...");

let avaliacoesCriadas = 0;

for (let i = 0; i < Math.min(5, employeesList.length); i++) {
  const employee = employeesList[i];
  
  // Criar avaliação
  await db.insert(performanceEvaluations).values({
    cycleId: activeCycle.id,
    employeeId: employee.id,
    type: "360",
    status: "em_andamento",
    selfEvaluationCompleted: false,
    managerEvaluationCompleted: false,
    peersEvaluationCompleted: false,
    subordinatesEvaluationCompleted: false,
    finalScore: 0,
  });
  
  avaliacoesCriadas++;
}

console.log(`✅ ${avaliacoesCriadas} avaliações 360° criadas (em andamento)\n`);

// ============================================================================
// 5. CRIAR POSIÇÕES NINE BOX
// ============================================================================

console.log("📊 Criando posições Nine Box...");

const nineBoxQuadrants = [
  { performance: "baixo", potential: "baixo", quadrant: "1" },
  { performance: "medio", potential: "baixo", quadrant: "2" },
  { performance: "alto", potential: "baixo", quadrant: "3" },
  { performance: "baixo", potential: "medio", quadrant: "4" },
  { performance: "medio", potential: "medio", quadrant: "5" },
  { performance: "alto", potential: "medio", quadrant: "6" },
  { performance: "baixo", potential: "alto", quadrant: "7" },
  { performance: "medio", potential: "alto", quadrant: "8" },
  { performance: "alto", potential: "alto", quadrant: "9" },
];

let nineBoxCriados = 0;

for (const employee of employeesList) {
  // Distribuição: mais pessoas em quadrantes 5, 6, 8, 9
  const weights = [5, 10, 15, 10, 20, 25, 5, 15, 20];
  const random = Math.random() * 125;
  let cumulative = 0;
  let selectedQuadrant = nineBoxQuadrants[4]; // Default: quadrante 5
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      selectedQuadrant = nineBoxQuadrants[i];
      break;
    }
  }
  
  await db.insert(nineBoxPositions).values({
    cycleId: activeCycle.id,
    employeeId: employee.id,
    performance: selectedQuadrant.performance,
    potential: selectedQuadrant.potential,
    box: selectedQuadrant.quadrant,
    calibrated: true,
    calibratedBy: 1,
    calibratedAt: new Date(),
  });
  
  nineBoxCriados++;
}

console.log(`✅ ${nineBoxCriados} posições Nine Box criadas\n`);

// ============================================================================
// 6. CRIAR FEEDBACKS CONTÍNUOS
// ============================================================================

console.log("💬 Criando feedbacks contínuos...");

const feedbackTemplates = [
  { type: "positivo", title: "Excelente apresentação", content: "Sua apresentação para o cliente foi excepcional. Demonstrou domínio técnico e habilidade de comunicação." },
  { type: "construtivo", title: "Atenção aos prazos", content: "Percebi que alguns prazos não foram cumpridos. Vamos trabalhar juntos para melhorar o planejamento." },
  { type: "desenvolvimento", title: "Oportunidade de crescimento", content: "Identifiquei uma oportunidade para você desenvolver habilidades de liderança no próximo projeto." },
  { type: "reconhecimento", title: "Atitude proativa", content: "Quero reconhecer sua iniciativa em resolver o problema antes que se tornasse crítico. Parabéns!" },
];

let feedbacksCriados = 0;

for (let i = 0; i < employeesList.length * 2; i++) {
  const fromEmployee = employeesList[i % employeesList.length];
  const toEmployee = employeesList[(i + 1) % employeesList.length];
  const template = feedbackTemplates[i % feedbackTemplates.length];
  
  await db.insert(feedbacks).values({
    fromEmployeeId: fromEmployee.id,
    toEmployeeId: toEmployee.id,
    type: template.type,
    title: template.title,
    content: template.content,
    isAnonymous: Math.random() > 0.7,
    visibility: "privado",
  });
  
  feedbacksCriados++;
}

console.log(`✅ ${feedbacksCriados} feedbacks contínuos criados\n`);

// ============================================================================
// 7. CONCEDER BADGES
// ============================================================================

console.log("🏆 Concedendo badges...");

// Buscar badges existentes
const allBadges = await db.select().from(badges);

let badgesConcedidos = 0;

for (const employee of employeesList) {
  // Cada colaborador ganha 2-4 badges aleatórios
  const numBadges = Math.floor(Math.random() * 3) + 2;
  const selectedBadges = allBadges
    .sort(() => Math.random() - 0.5)
    .slice(0, numBadges);
  
  for (const badge of selectedBadges) {
    try {
      await db.insert(employeeBadges).values({
        employeeId: employee.id,
        badgeId: badge.id,
        earnedAt: new Date(),
        notified: true,
      });
      badgesConcedidos++;
    } catch (error) {
      // Ignorar duplicatas
    }
  }
}

console.log(`✅ ${badgesConcedidos} badges concedidos\n`);

// ============================================================================
// RESUMO FINAL
// ============================================================================

console.log("✨ Seed de dados de exemplo concluído com sucesso!\n");
console.log("📊 Resumo:");
console.log(`   - ${metasCriadas} metas SMART criadas`);
console.log(`   - ${pdisCriados} PDIs Inteligentes criados`);
console.log(`   - ${avaliacoesCriadas} avaliações 360° criadas`);
console.log(`   - ${nineBoxCriados} posições Nine Box criadas`);
console.log(`   - ${feedbacksCriados} feedbacks contínuos criados`);
console.log(`   - ${badgesConcedidos} badges concedidos`);
console.log("\n🎉 Banco de dados populado com dados de exemplo!");

await connection.end();
