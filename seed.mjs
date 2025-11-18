import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

console.log("🌱 Iniciando seed do banco de dados...\n");

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

// Dados de seed
const departamentos = [
  { code: "TI", name: "Tecnologia da Informação", description: "Desenvolvimento e infraestrutura" },
  { code: "RH", name: "Recursos Humanos", description: "Gestão de pessoas" },
  { code: "FIN", name: "Financeiro", description: "Controladoria e finanças" },
  { code: "COM", name: "Comercial", description: "Vendas e relacionamento" },
  { code: "MKT", name: "Marketing", description: "Comunicação e branding" },
  { code: "OPS", name: "Operações", description: "Processos e logística" },
];

const posicoes = [
  { code: "DIR", title: "Diretor", level: "executivo", description: "Liderança estratégica" },
  { code: "GER", title: "Gerente", level: "senior", description: "Gestão tática" },
  { code: "COORD", title: "Coordenador", level: "pleno", description: "Coordenação de equipes" },
  { code: "ANA-SR", title: "Analista Sênior", level: "senior", description: "Especialista" },
  { code: "ANA-PL", title: "Analista Pleno", level: "pleno", description: "Profissional experiente" },
  { code: "ANA-JR", title: "Analista Júnior", level: "junior", description: "Profissional em desenvolvimento" },
  { code: "ASS", title: "Assistente", level: "junior", description: "Suporte operacional" },
];

const nomes = [
  "Ana Silva", "Bruno Costa", "Carla Santos", "Daniel Oliveira", "Elena Rodrigues",
  "Felipe Almeida", "Gabriela Lima", "Henrique Martins", "Isabela Ferreira", "João Pereira",
  "Karina Souza", "Lucas Barbosa", "Mariana Gomes", "Nicolas Ribeiro", "Olivia Cardoso",
  "Paulo Araújo", "Quitéria Mendes", "Rafael Dias", "Sofia Castro", "Thiago Rocha",
  "Ursula Monteiro", "Vitor Teixeira", "Wanda Correia", "Xavier Nunes", "Yasmin Pinto",
  "Zé Carlos Moura", "Amanda Freitas", "Bernardo Lopes", "Cecília Ramos", "Diego Carvalho",
  "Eduarda Melo", "Fábio Cunha", "Giovana Azevedo", "Hugo Batista", "Inês Campos",
  "Jorge Vieira", "Larissa Duarte", "Marcos Nogueira", "Natália Farias", "Otávio Pires",
  "Patrícia Moreira", "Quintino Borges", "Renata Cavalcanti", "Sérgio Macedo", "Tatiana Rezende",
  "Ulisses Fonseca", "Vanessa Guimarães", "Wagner Sampaio", "Xuxa Andrade", "Yuri Tavares",
  "Zilda Nascimento", "André Viana", "Beatriz Coelho", "Caio Monteiro", "Daniela Siqueira",
];

// Função para gerar CPF fictício
function gerarCPF() {
  const n = () => Math.floor(Math.random() * 10);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

// Função para gerar e-mail
function gerarEmail(nome) {
  return nome.toLowerCase().replace(/\s+/g, ".") + "@empresa.com.br";
}

// Função para data aleatória
function dataAleatoria(inicio, fim) {
  return new Date(inicio.getTime() + Math.random() * (fim.getTime() - inicio.getTime()));
}

try {
  // 1. Criar ciclo de avaliação
  console.log("📅 Criando ciclo de avaliação 2025...");
  const [ciclo] = await db.insert(schema.evaluationCycles).values({
    name: "Ciclo 2025",
    year: 2025,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    status: "active",
  });
  const cycleId = ciclo.insertId;

  // 2. Criar departamentos
  console.log("🏢 Criando departamentos...");
  const deptIds = [];
  for (const dept of departamentos) {
    const [result] = await db.insert(schema.departments).values(dept);
    deptIds.push({ ...dept, id: result.insertId });
  }

  // 3. Criar posições
  console.log("💼 Criando posições...");
  const posIds = [];
  for (const pos of posicoes) {
    for (const dept of deptIds) {
      const [result] = await db.insert(schema.positions).values({
        ...pos,
        code: `${dept.code}-${pos.code}`,
        departmentId: dept.id,
      });
      posIds.push({ ...pos, id: result.insertId, departmentId: dept.id });
    }
  }

  // 4. Criar usuários e colaboradores
  console.log("👥 Criando 100 colaboradores...");
  const employeeIds = [];
  for (let i = 0; i < 100; i++) {
    const nome = nomes[i % nomes.length] + ` ${i + 1}`;
    const email = gerarEmail(nome);
    
    // Criar usuário
    const [user] = await db.insert(schema.users).values({
      openId: `seed-user-${i + 1}`,
      name: nome,
      email: email,
      role: i < 5 ? "admin" : i < 15 ? "rh" : i < 30 ? "gestor" : "colaborador",
    });

    // Selecionar departamento e posição aleatórios
    const dept = deptIds[Math.floor(Math.random() * deptIds.length)];
    const posicoesDept = posIds.filter(p => p.departmentId === dept.id);
    const pos = posicoesDept[Math.floor(Math.random() * posicoesDept.length)];

    // Criar colaborador
    const [employee] = await db.insert(schema.employees).values({
      userId: user.insertId,
      employeeCode: `EMP${String(i + 1).padStart(4, "0")}`,
      name: nome,
      email: email,
      cpf: gerarCPF(),
      birthDate: dataAleatoria(new Date("1980-01-01"), new Date("2000-12-31")),
      hireDate: dataAleatoria(new Date("2015-01-01"), new Date("2024-12-31")),
      departmentId: dept.id,
      positionId: pos.id,
      status: "ativo",
    });

    employeeIds.push(employee.insertId);
  }

  // 5. Criar metas (80% dos colaboradores)
  console.log("🎯 Criando metas...");
  for (let i = 0; i < Math.floor(employeeIds.length * 0.8); i++) {
    const empId = employeeIds[i];
    const numMetas = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < numMetas; j++) {
      const progress = Math.floor(Math.random() * 101);
      await db.insert(schema.goals).values({
        cycleId: cycleId,
        employeeId: empId,
        title: `Meta ${j + 1} - ${["Vendas", "Qualidade", "Produtividade", "Inovação"][j % 4]}`,
        description: "Descrição da meta",
        type: ["individual", "equipe", "organizacional"][Math.floor(Math.random() * 3)],
        category: ["estrategica", "operacional", "desenvolvimento"][Math.floor(Math.random() * 3)],
        targetValue: 100,
        currentValue: progress,
        unit: "percentual",
        weight: 33,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        status: progress === 100 ? "concluida" : progress > 0 ? "em_andamento" : "nao_iniciada",
        progress: progress,
        createdBy: empId,
      });
    }
  }

  // 6. Criar PDIs (60% dos colaboradores)
  console.log("📋 Criando PDIs...");
  for (let i = 0; i < Math.floor(employeeIds.length * 0.6); i++) {
    const empId = employeeIds[i];
    await db.insert(schema.pdiPlans).values({
      cycleId: cycleId,
      employeeId: empId,
      objectives: "Desenvolvimento de liderança e habilidades técnicas",
      status: ["em_andamento", "aprovado", "pendente"][Math.floor(Math.random() * 3)],
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      createdBy: empId,
    });
  }

  // 7. Criar avaliações 360° (50% dos colaboradores)
  console.log("🔄 Criando avaliações 360°...");
  for (let i = 0; i < Math.floor(employeeIds.length * 0.5); i++) {
    const empId = employeeIds[i];
    const score = Math.floor(Math.random() * 3) + 3; // 3-5
    await db.insert(schema.performanceEvaluations).values({
      cycleId: cycleId,
      employeeId: empId,
      evaluatorId: employeeIds[Math.floor(Math.random() * employeeIds.length)],
      type: "360",
      status: "concluida",
      finalScore: score,
      evaluationDate: dataAleatoria(new Date("2025-01-01"), new Date()),
    });
  }

  // 8. Criar posições Nine Box (70% dos colaboradores)
  console.log("📊 Criando posições Nine Box...");
  for (let i = 0; i < Math.floor(employeeIds.length * 0.7); i++) {
    const empId = employeeIds[i];
    const performance = Math.floor(Math.random() * 3) + 1; // 1-3
    const potential = Math.floor(Math.random() * 3) + 1; // 1-3
    
    await db.insert(schema.nineBoxPositions).values({
      cycleId: cycleId,
      employeeId: empId,
      performance: performance,
      potential: potential,
      category: `${performance}-${potential}`,
      notes: "Avaliação baseada em desempenho e potencial",
      createdBy: 1,
    });
  }

  // 9. Criar badges
  console.log("🏆 Criando badges...");
  const badgeData = [
    { name: "Primeira Meta Concluída", code: "FIRST_GOAL", description: "Complete sua primeira meta", icon: "🎯", points: 10 },
    { name: "PDI Criado", code: "PDI_CREATED", description: "Crie seu PDI", icon: "📋", points: 15 },
    { name: "Avaliação 360° Completa", code: "360_COMPLETE", description: "Complete uma avaliação 360°", icon: "🔄", points: 20 },
    { name: "Feedback Master", code: "FEEDBACK_MASTER", description: "Envie 10 feedbacks", icon: "💬", points: 25 },
  ];

  for (const badge of badgeData) {
    await db.insert(schema.badges).values(badge);
  }

  // 10. Conceder badges aleatoriamente (30% dos colaboradores)
  console.log("🎖️ Concedendo badges...");
  for (let i = 0; i < Math.floor(employeeIds.length * 0.3); i++) {
    const empId = employeeIds[i];
    const badgeId = Math.floor(Math.random() * badgeData.length) + 1;
    
    await db.insert(schema.employeeBadges).values({
      employeeId: empId,
      badgeId: badgeId,
      earnedAt: dataAleatoria(new Date("2025-01-01"), new Date()),
    });
  }

  console.log("\n✅ Seed concluído com sucesso!");
  console.log(`📊 Resumo:`);
  console.log(`   - ${deptIds.length} departamentos`);
  console.log(`   - ${posIds.length} posições`);
  console.log(`   - ${employeeIds.length} colaboradores`);
  console.log(`   - ~${Math.floor(employeeIds.length * 0.8 * 2)} metas`);
  console.log(`   - ~${Math.floor(employeeIds.length * 0.6)} PDIs`);
  console.log(`   - ~${Math.floor(employeeIds.length * 0.5)} avaliações 360°`);
  console.log(`   - ~${Math.floor(employeeIds.length * 0.7)} posições Nine Box`);
  console.log(`   - ${badgeData.length} badges criados`);
  console.log(`   - ~${Math.floor(employeeIds.length * 0.3)} badges concedidos`);

} catch (error) {
  console.error("❌ Erro ao executar seed:", error);
  process.exit(1);
} finally {
  await connection.end();
  process.exit(0);
}
