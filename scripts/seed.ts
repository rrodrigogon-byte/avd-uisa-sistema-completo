import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  employees,
  departments,
  positions,
  competencies,
  competencyLevels,
  evaluationCycles,
  goals,
  performanceEvaluations,
  pdiPlans,
  pdiItems,
  developmentActions,
  nineBoxPositions,
} from "../drizzle/schema";

/**
 * Script de Seeds - Popula o banco de dados com dados de exemplo
 * Para executar: npx tsx scripts/seed.ts
 */

async function seed() {
  console.log("🌱 Iniciando seeds do banco de dados...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // ========================================================================
    // 1. DEPARTAMENTOS
    // ========================================================================
    console.log("📁 Criando departamentos...");
    const [dept1] = await db.insert(departments).values({
      code: "TI",
      name: "Tecnologia da Informação",
      description: "Departamento de TI e Inovação",
      active: true,
    });

    const [dept2] = await db.insert(departments).values({
      code: "RH",
      name: "Recursos Humanos",
      description: "Departamento de Gestão de Pessoas",
      active: true,
    });

    const [dept3] = await db.insert(departments).values({
      code: "FIN",
      name: "Financeiro",
      description: "Departamento Financeiro",
      active: true,
    });

    console.log("✅ 3 departamentos criados\n");

    // ========================================================================
    // 2. CARGOS
    // ========================================================================
    console.log("💼 Criando cargos...");
    const [pos1] = await db.insert(positions).values({
      code: "DEV_JR",
      title: "Desenvolvedor Júnior",
      description: "Desenvolvedor de software júnior",
      level: "junior",
      departmentId: Number(dept1.insertId),
      active: true,
    });

    const [pos2] = await db.insert(positions).values({
      code: "DEV_PL",
      title: "Desenvolvedor Pleno",
      description: "Desenvolvedor de software pleno",
      level: "pleno",
      departmentId: Number(dept1.insertId),
      active: true,
    });

    const [pos3] = await db.insert(positions).values({
      code: "DEV_SR",
      title: "Desenvolvedor Sênior",
      description: "Desenvolvedor de software sênior",
      level: "senior",
      departmentId: Number(dept1.insertId),
      active: true,
    });

    const [pos4] = await db.insert(positions).values({
      code: "ANALISTA_RH",
      title: "Analista de RH",
      description: "Analista de Recursos Humanos",
      level: "pleno",
      departmentId: Number(dept2.insertId),
      active: true,
    });

    console.log("✅ 4 cargos criados\n");

    // ========================================================================
    // 3. USUÁRIOS E COLABORADORES
    // ========================================================================
    console.log("👥 Criando usuários e colaboradores...");
    
    // Usuário Admin
    const [user1] = await db.insert(users).values({
      openId: "admin-001",
      name: "Administrador Sistema",
      email: "admin@uisa.com.br",
      role: "admin",
      loginMethod: "password",
    });

    const [emp1] = await db.insert(employees).values({
      userId: Number(user1.insertId),
      employeeCode: "EMP001",
      name: "Administrador Sistema",
      email: "admin@uisa.com.br",
      cpf: "000.000.000-00",
      hireDate: new Date("2020-01-01"),
      departmentId: Number(dept1.insertId),
      positionId: Number(pos3.insertId),
      status: "ativo",
    });

    // Colaborador 1
    const [user2] = await db.insert(users).values({
      openId: "user-002",
      name: "João Silva",
      email: "joao.silva@uisa.com.br",
      role: "colaborador",
      loginMethod: "password",
    });

    const [emp2] = await db.insert(employees).values({
      userId: Number(user2.insertId),
      employeeCode: "EMP002",
      name: "João Silva",
      email: "joao.silva@uisa.com.br",
      cpf: "111.111.111-11",
      hireDate: new Date("2021-03-15"),
      departmentId: Number(dept1.insertId),
      positionId: Number(pos2.insertId),
      managerId: Number(emp1.insertId),
      status: "ativo",
    });

    // Colaborador 2
    const [user3] = await db.insert(users).values({
      openId: "user-003",
      name: "Maria Santos",
      email: "maria.santos@uisa.com.br",
      role: "colaborador",
      loginMethod: "password",
    });

    const [emp3] = await db.insert(employees).values({
      userId: Number(user3.insertId),
      employeeCode: "EMP003",
      name: "Maria Santos",
      email: "maria.santos@uisa.com.br",
      cpf: "222.222.222-22",
      hireDate: new Date("2022-06-01"),
      departmentId: Number(dept2.insertId),
      positionId: Number(pos4.insertId),
      status: "ativo",
    });

    console.log("✅ 3 usuários e colaboradores criados\n");

    // ========================================================================
    // 4. COMPETÊNCIAS
    // ========================================================================
    console.log("🎯 Criando competências...");
    
    const [comp1] = await db.insert(competencies).values({
      code: "LIDERANCA",
      name: "Liderança",
      description: "Capacidade de liderar equipes",
      category: "lideranca",
      active: true,
    });

    const [comp2] = await db.insert(competencies).values({
      code: "COMUNICACAO",
      name: "Comunicação",
      description: "Habilidade de comunicação efetiva",
      category: "comportamental",
      active: true,
    });

    const [comp3] = await db.insert(competencies).values({
      code: "PROGRAMACAO",
      name: "Programação",
      description: "Conhecimento em linguagens de programação",
      category: "tecnica",
      active: true,
    });

    // Níveis de competência
    for (const compId of [Number(comp1.insertId), Number(comp2.insertId), Number(comp3.insertId)]) {
      await db.insert(competencyLevels).values([
        { competencyId: compId, level: 1, name: "Básico", description: "Conhecimento básico" },
        { competencyId: compId, level: 2, name: "Intermediário", description: "Conhecimento intermediário" },
        { competencyId: compId, level: 3, name: "Avançado", description: "Conhecimento avançado" },
        { competencyId: compId, level: 4, name: "Especialista", description: "Especialista" },
        { competencyId: compId, level: 5, name: "Referência", description: "Referência na área" },
      ]);
    }

    console.log("✅ 3 competências criadas com 5 níveis cada\n");

    // ========================================================================
    // 5. CICLO DE AVALIAÇÃO
    // ========================================================================
    console.log("📅 Criando ciclo de avaliação...");
    
    const [cycle] = await db.insert(evaluationCycles).values({
      name: "Ciclo 2025",
      year: 2025,
      type: "anual",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      status: "em_andamento",
      description: "Ciclo de avaliação anual 2025",
    });

    console.log("✅ 1 ciclo de avaliação criado\n");

    // ========================================================================
    // 6. METAS
    // ========================================================================
    console.log("🎯 Criando metas...");
    
    await db.insert(goals).values([
      {
        cycleId: Number(cycle.insertId),
        employeeId: Number(emp2.insertId),
        title: "Desenvolver 3 novos módulos do sistema",
        description: "Implementar módulos de relatórios, dashboard e integrações",
        type: "individual",
        category: "quantitativa",
        targetValue: "3",
        currentValue: "1",
        unit: "módulos",
        weight: 3,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
        status: "em_andamento",
        progress: 33,
        linkedToPLR: true,
        linkedToBonus: false,
        createdBy: Number(user1.insertId),
      },
      {
        cycleId: Number(cycle.insertId),
        employeeId: Number(emp2.insertId),
        title: "Reduzir bugs em produção",
        description: "Diminuir número de bugs críticos em produção",
        type: "individual",
        category: "quantitativa",
        targetValue: "5",
        currentValue: "8",
        unit: "bugs/mês",
        weight: 2,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        status: "em_andamento",
        progress: 40,
        linkedToPLR: false,
        linkedToBonus: true,
        createdBy: Number(user1.insertId),
      },
    ]);

    console.log("✅ 2 metas criadas\n");

    // ========================================================================
    // 7. AVALIAÇÕES 360°
    // ========================================================================
    console.log("📊 Criando avaliações 360°...");
    
    await db.insert(performanceEvaluations).values({
      cycleId: Number(cycle.insertId),
      employeeId: Number(emp2.insertId),
      type: "360",
      status: "em_andamento",
      selfEvaluationCompleted: true,
      managerEvaluationCompleted: false,
      peersEvaluationCompleted: false,
      subordinatesEvaluationCompleted: false,
    });

    console.log("✅ 1 avaliação 360° criada\n");

    // ========================================================================
    // 8. AÇÕES DE DESENVOLVIMENTO (Catálogo)
    // ========================================================================
    console.log("📚 Criando catálogo de ações de desenvolvimento...");
    
    await db.insert(developmentActions).values([
      {
        code: "PROJ_001",
        title: "Liderar projeto de reestruturação",
        description: "Assumir liderança de projeto estratégico",
        category: "70_pratica",
        type: "projeto",
        competencyId: Number(comp1.insertId),
        duration: 160,
        active: true,
      },
      {
        code: "MENT_001",
        title: "Mentoria com líder sênior",
        description: "Sessões de mentoria quinzenais",
        category: "20_mentoria",
        type: "mentoria",
        competencyId: Number(comp1.insertId),
        duration: 40,
        active: true,
      },
      {
        code: "CURSO_001",
        title: "Curso de Liderança Estratégica",
        description: "Curso online de liderança",
        category: "10_curso",
        type: "curso_online",
        competencyId: Number(comp1.insertId),
        duration: 20,
        provider: "Udemy",
        url: "https://udemy.com/lideranca",
        cost: 19900,
        active: true,
      },
      {
        code: "PROJ_002",
        title: "Desenvolver API REST completa",
        description: "Criar API com autenticação e documentação",
        category: "70_pratica",
        type: "projeto",
        competencyId: Number(comp3.insertId),
        duration: 80,
        active: true,
      },
    ]);

    console.log("✅ 4 ações de desenvolvimento criadas\n");

    // ========================================================================
    // 9. PDI (Plano de Desenvolvimento Individual)
    // ========================================================================
    console.log("📋 Criando PDI...");
    
    const [pdi] = await db.insert(pdiPlans).values({
      cycleId: Number(cycle.insertId),
      employeeId: Number(emp2.insertId),
      targetPositionId: Number(pos3.insertId),
      status: "aprovado",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      overallProgress: 25,
      approvedBy: Number(user1.insertId),
      approvedAt: new Date("2025-01-15"),
    });

    await db.insert(pdiItems).values([
      {
        planId: Number(pdi.insertId),
        actionId: 1,
        competencyId: Number(comp1.insertId),
        title: "Liderar projeto de reestruturação",
        description: "Assumir liderança de projeto estratégico",
        category: "70_pratica",
        type: "projeto",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-08-31"),
        status: "em_andamento",
        progress: 30,
      },
      {
        planId: Number(pdi.insertId),
        actionId: 2,
        competencyId: Number(comp1.insertId),
        title: "Mentoria com líder sênior",
        description: "Sessões de mentoria quinzenais",
        category: "20_mentoria",
        type: "mentoria",
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-12-15"),
        status: "em_andamento",
        progress: 20,
      },
      {
        planId: Number(pdi.insertId),
        actionId: 3,
        competencyId: Number(comp1.insertId),
        title: "Curso de Liderança Estratégica",
        description: "Curso online de liderança",
        category: "10_curso",
        type: "curso_online",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-03-31"),
        status: "concluida",
        progress: 100,
        completedAt: new Date("2025-03-20"),
      },
    ]);

    console.log("✅ 1 PDI criado com 3 ações\n");

    // ========================================================================
    // 10. MATRIZ 9-BOX
    // ========================================================================
    console.log("📈 Criando posicionamento 9-Box...");
    
    await db.insert(nineBoxPositions).values([
      {
        cycleId: Number(cycle.insertId),
        employeeId: Number(emp2.insertId),
        performance: 2,
        potential: 3,
        box: "2_3",
        calibrated: true,
        calibratedBy: Number(user1.insertId),
        calibratedAt: new Date("2025-01-20"),
        notes: "Alto potencial, performance em desenvolvimento",
      },
    ]);

    console.log("✅ 1 posicionamento 9-Box criado\n");

    console.log("🎉 Seeds concluídos com sucesso!\n");
    console.log("📊 Resumo:");
    console.log("  - 3 departamentos");
    console.log("  - 4 cargos");
    console.log("  - 3 usuários e colaboradores");
    console.log("  - 3 competências (15 níveis)");
    console.log("  - 1 ciclo de avaliação");
    console.log("  - 2 metas");
    console.log("  - 1 avaliação 360°");
    console.log("  - 4 ações de desenvolvimento");
    console.log("  - 1 PDI com 3 ações");
    console.log("  - 1 posicionamento 9-Box\n");

    console.log("✅ Banco de dados populado e pronto para uso!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar seeds:", error);
    process.exit(1);
  }
}

seed();
