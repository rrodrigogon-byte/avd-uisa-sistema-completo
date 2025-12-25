import { drizzle } from "drizzle-orm/mysql2";
import { employees, departments, positions } from "./drizzle/schema.js";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function seedEmployees() {
  console.log("🌱 Iniciando seed de funcionários...");

  try {
    // Primeiro, vamos criar alguns departamentos se não existirem
    const deptResult = await db.insert(departments).values([
      { name: "Diretoria", description: "Diretoria Executiva", code: "DIR" },
      { name: "Recursos Humanos", description: "Departamento de RH", code: "RH" },
      { name: "Tecnologia", description: "Departamento de TI", code: "TI" },
      { name: "Comercial", description: "Departamento Comercial", code: "COM" },
      { name: "Financeiro", description: "Departamento Financeiro", code: "FIN" },
      { name: "Operações", description: "Departamento de Operações", code: "OPS" },
    ]).onDuplicateKeyUpdate({ set: { name: sql`name` } });

    console.log("✅ Departamentos criados/verificados");

    // Criar alguns cargos se não existirem
    const posResult = await db.insert(positions).values([
      { title: "CEO", description: "Chief Executive Officer", level: "Executivo", code: "CEO" },
      { title: "Diretor", description: "Diretor de Área", level: "Executivo", code: "DIR" },
      { title: "Gerente", description: "Gerente de Departamento", level: "Gerencial", code: "GER" },
      { title: "Coordenador", description: "Coordenador de Equipe", level: "Coordenação", code: "COORD" },
      { title: "Analista Sênior", description: "Analista Sênior", level: "Operacional", code: "ANSR" },
      { title: "Analista Pleno", description: "Analista Pleno", level: "Operacional", code: "ANPL" },
      { title: "Analista Júnior", description: "Analista Júnior", level: "Operacional", code: "ANJR" },
      { title: "Assistente", description: "Assistente Administrativo", level: "Operacional", code: "ASS" },
    ]).onDuplicateKeyUpdate({ set: { title: sql`title` } });

    console.log("✅ Cargos criados/verificados");

    // Buscar IDs dos departamentos e cargos criados
    const depts = await db.select().from(departments);
    const positions = await db.select().from(positions);

    const deptMap = Object.fromEntries(depts.map(d => [d.code, d.id]));
    const posMap = Object.fromEntries(positions.map(p => [p.code, p.id]));

    // Criar estrutura hierárquica de funcionários
    const employeesData = [
      // CEO (sem gestor)
      {
        employeeCode: "EMP001",
        name: "João Silva",
        email: "joao.silva@empresa.com",
        chapa: "001",
        departmentId: deptMap["DIR"],
        positionId: posMap["CEO"],
        managerId: null,
        cargo: "CEO",
        departamento: "Diretoria",
        telefone: "(11) 98765-4321",
        active: true,
      },
      
      // Diretores (reportam ao CEO)
      {
        employeeCode: "EMP002",
        name: "Maria Santos",
        email: "maria.santos@empresa.com",
        chapa: "002",
        departmentId: deptMap["RH"],
        positionId: posMap["DIR"],
        managerId: null, // Será atualizado depois
        cargo: "Diretora de RH",
        departamento: "Recursos Humanos",
        telefone: "(11) 98765-4322",
        active: true,
      },
      {
        employeeCode: "EMP003",
        name: "Carlos Oliveira",
        email: "carlos.oliveira@empresa.com",
        chapa: "003",
        departmentId: deptMap["TI"],
        positionId: posMap["DIR"],
        managerId: null,
        cargo: "Diretor de TI",
        departamento: "Tecnologia",
        telefone: "(11) 98765-4323",
        active: true,
      },
      {
        employeeCode: "EMP004",
        name: "Ana Paula Costa",
        email: "ana.costa@empresa.com",
        chapa: "004",
        departmentId: deptMap["COM"],
        positionId: posMap["DIR"],
        managerId: null,
        cargo: "Diretora Comercial",
        departamento: "Comercial",
        telefone: "(11) 98765-4324",
        active: true,
      },
      
      // Gerentes (reportam aos Diretores)
      {
        employeeCode: "EMP005",
        name: "Pedro Almeida",
        email: "pedro.almeida@empresa.com",
        chapa: "005",
        departmentId: deptMap["RH"],
        positionId: posMap["GER"],
        managerId: null,
        cargo: "Gerente de Recrutamento",
        departamento: "Recursos Humanos",
        telefone: "(11) 98765-4325",
        active: true,
      },
      {
        employeeCode: "EMP006",
        name: "Juliana Ferreira",
        email: "juliana.ferreira@empresa.com",
        chapa: "006",
        departmentId: deptMap["TI"],
        positionId: posMap["GER"],
        managerId: null,
        cargo: "Gerente de Desenvolvimento",
        departamento: "Tecnologia",
        telefone: "(11) 98765-4326",
        active: true,
      },
      {
        employeeCode: "EMP007",
        name: "Roberto Lima",
        email: "roberto.lima@empresa.com",
        chapa: "007",
        departmentId: deptMap["COM"],
        positionId: posMap["GER"],
        managerId: null,
        cargo: "Gerente de Vendas",
        departamento: "Comercial",
        telefone: "(11) 98765-4327",
        active: true,
      },
      
      // Coordenadores (reportam aos Gerentes)
      {
        employeeCode: "EMP008",
        name: "Fernanda Souza",
        email: "fernanda.souza@empresa.com",
        chapa: "008",
        departmentId: deptMap["TI"],
        positionId: posMap["COORD"],
        managerId: null,
        cargo: "Coordenadora de Projetos",
        departamento: "Tecnologia",
        telefone: "(11) 98765-4328",
        active: true,
      },
      {
        employeeCode: "EMP009",
        name: "Marcos Pereira",
        email: "marcos.pereira@empresa.com",
        chapa: "009",
        departmentId: deptMap["COM"],
        positionId: posMap["COORD"],
        managerId: null,
        cargo: "Coordenador de Vendas",
        departamento: "Comercial",
        telefone: "(11) 98765-4329",
        active: true,
      },
      
      // Analistas (reportam aos Coordenadores/Gerentes)
      {
        employeeCode: "EMP010",
        name: "Beatriz Rodrigues",
        email: "beatriz.rodrigues@empresa.com",
        chapa: "010",
        departmentId: deptMap["TI"],
        positionId: posMap["ANSR"],
        managerId: null,
        cargo: "Analista de Sistemas Sênior",
        departamento: "Tecnologia",
        telefone: "(11) 98765-4330",
        active: true,
      },
      {
        employeeCode: "EMP011",
        name: "Lucas Martins",
        email: "lucas.martins@empresa.com",
        chapa: "011",
        departmentId: deptMap["TI"],
        positionId: posMap["ANPL"],
        managerId: null,
        cargo: "Analista de Sistemas Pleno",
        departamento: "Tecnologia",
        telefone: "(11) 98765-4331",
        active: true,
      },
      {
        employeeCode: "EMP012",
        name: "Camila Dias",
        email: "camila.dias@empresa.com",
        chapa: "012",
        departmentId: deptMap["RH"],
        positionId: posMap["ANPL"],
        managerId: null,
        cargo: "Analista de RH Pleno",
        departamento: "Recursos Humanos",
        telefone: "(11) 98765-4332",
        active: true,
      },
      {
        employeeCode: "EMP013",
        name: "Rafael Santos",
        email: "rafael.santos@empresa.com",
        chapa: "013",
        departmentId: deptMap["COM"],
        positionId: posMap["ANSR"],
        managerId: null,
        cargo: "Analista Comercial Sênior",
        departamento: "Comercial",
        telefone: "(11) 98765-4333",
        active: true,
      },
      {
        employeeCode: "EMP014",
        name: "Patricia Oliveira",
        email: "patricia.oliveira@empresa.com",
        chapa: "014",
        departmentId: deptMap["TI"],
        positionId: posMap["ANJR"],
        managerId: null,
        cargo: "Analista de Sistemas Júnior",
        departamento: "Tecnologia",
        telefone: "(11) 98765-4334",
        active: true,
      },
      {
        employeeCode: "EMP015",
        name: "Thiago Costa",
        email: "thiago.costa@empresa.com",
        chapa: "015",
        departmentId: deptMap["COM"],
        positionId: posMap["ANJR"],
        managerId: null,
        cargo: "Analista Comercial Júnior",
        departamento: "Comercial",
        telefone: "(11) 98765-4335",
        active: true,
      },
    ];

    // Inserir funcionários
    const insertedEmployees = [];
    for (const emp of employeesData) {
      const result = await db.insert(employees).values(emp);
      insertedEmployees.push({ ...emp, id: result.insertId });
      console.log(`✅ Funcionário criado: ${emp.name} (${emp.employeeCode})`);
    }

    // Atualizar hierarquia (managerId)
    // CEO (id: 1) não tem gestor
    // Diretores (2,3,4) reportam ao CEO (1)
    await db.update(employees).set({ managerId: insertedEmployees[0].id }).where(sql`id IN (${insertedEmployees[1].id}, ${insertedEmployees[2].id}, ${insertedEmployees[3].id})`);
    
    // Gerentes reportam aos Diretores
    await db.update(employees).set({ managerId: insertedEmployees[1].id }).where(sql`id = ${insertedEmployees[4].id}`); // Gerente RH -> Diretora RH
    await db.update(employees).set({ managerId: insertedEmployees[2].id }).where(sql`id = ${insertedEmployees[5].id}`); // Gerente TI -> Diretor TI
    await db.update(employees).set({ managerId: insertedEmployees[3].id }).where(sql`id = ${insertedEmployees[6].id}`); // Gerente Comercial -> Diretora Comercial
    
    // Coordenadores reportam aos Gerentes
    await db.update(employees).set({ managerId: insertedEmployees[5].id }).where(sql`id = ${insertedEmployees[7].id}`); // Coord. Projetos -> Gerente TI
    await db.update(employees).set({ managerId: insertedEmployees[6].id }).where(sql`id = ${insertedEmployees[8].id}`); // Coord. Vendas -> Gerente Comercial
    
    // Analistas reportam aos Coordenadores/Gerentes
    await db.update(employees).set({ managerId: insertedEmployees[7].id }).where(sql`id IN (${insertedEmployees[9].id}, ${insertedEmployees[10].id}, ${insertedEmployees[13].id})`); // Analistas TI -> Coord. Projetos
    await db.update(employees).set({ managerId: insertedEmployees[4].id }).where(sql`id = ${insertedEmployees[11].id}`); // Analista RH -> Gerente RH
    await db.update(employees).set({ managerId: insertedEmployees[8].id }).where(sql`id IN (${insertedEmployees[12].id}, ${insertedEmployees[14].id})`); // Analistas Comercial -> Coord. Vendas

    console.log("✅ Hierarquia atualizada com sucesso!");
    console.log(`\n🎉 Seed concluído! ${employeesData.length} funcionários criados.`);
    
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  }
}

seedEmployees()
  .then(() => {
    console.log("✅ Processo concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });
