import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Seeding employees data...\n");

try {
  // 1. Create Departments
  console.log("Creating departments...");
  const [deptResult] = await connection.query(`
    INSERT INTO departments (name, code, description, isActive) VALUES
    ('Tecnologia', 'TI', 'Departamento de Tecnologia da Informação', true),
    ('Recursos Humanos', 'RH', 'Departamento de Gestão de Pessoas', true),
    ('Comercial', 'COM', 'Departamento Comercial e Vendas', true),
    ('Financeiro', 'FIN', 'Departamento Financeiro', true),
    ('Operações', 'OPS', 'Departamento de Operações', true)
  `);
  console.log(`✓ ${deptResult.affectedRows} departments created\n`);

  // 2. Create Positions
  console.log("Creating positions...");
  const [posResult] = await connection.query(`
    INSERT INTO positions (title, code, level, description, isActive) VALUES
    ('Diretor', 'DIR', 1, 'Cargo de Direção Executiva', true),
    ('Gerente', 'GER', 2, 'Cargo de Gerência', true),
    ('Coordenador', 'COORD', 3, 'Cargo de Coordenação', true),
    ('Analista Sênior', 'AN-SR', 4, 'Analista Sênior', true),
    ('Analista Pleno', 'AN-PL', 5, 'Analista Pleno', true),
    ('Analista Júnior', 'AN-JR', 6, 'Analista Júnior', true),
    ('Assistente', 'AST', 7, 'Assistente', true)
  `);
  console.log(`✓ ${posResult.affectedRows} positions created\n`);

  // 3. Create Employees
  console.log("Creating employees...");
  
  // CEO (no supervisor)
  const [ceoResult] = await connection.query(`
    INSERT INTO employees (fullName, email, employeeId, departmentId, positionId, supervisorId, hireDate, status, location)
    VALUES ('Carlos Silva', 'carlos.silva@empresa.com', 'EMP001', 1, 1, NULL, '2020-01-15', 'active', 'São Paulo')
  `);
  const ceoId = ceoResult.insertId;
  console.log(`✓ CEO created (ID: ${ceoId})`);

  // Directors (report to CEO)
  const [dirTIResult] = await connection.query(`
    INSERT INTO employees (fullName, email, employeeId, departmentId, positionId, supervisorId, hireDate, status, location)
    VALUES ('Ana Costa', 'ana.costa@empresa.com', 'EMP002', 1, 1, ${ceoId}, '2020-03-01', 'active', 'São Paulo')
  `);
  const dirTIId = dirTIResult.insertId;

  const [dirRHResult] = await connection.query(`
    INSERT INTO employees (fullName, email, employeeId, departmentId, positionId, supervisorId, hireDate, status, location)
    VALUES ('Roberto Santos', 'roberto.santos@empresa.com', 'EMP003', 2, 1, ${ceoId}, '2020-04-10', 'active', 'São Paulo')
  `);
  const dirRHId = dirRHResult.insertId;

  const [dirComResult] = await connection.query(`
    INSERT INTO employees (fullName, email, employeeId, departmentId, positionId, supervisorId, hireDate, status, location)
    VALUES ('Mariana Oliveira', 'mariana.oliveira@empresa.com', 'EMP004', 3, 1, ${ceoId}, '2020-05-20', 'active', 'Rio de Janeiro')
  `);
  const dirComId = dirComResult.insertId;

  console.log(`✓ 3 Directors created`);

  // Managers (report to Directors)
  const [gerTI1Result] = await connection.query(`
    INSERT INTO employees (fullName, email, employeeId, departmentId, positionId, supervisorId, hireDate, status, location)
    VALUES ('Pedro Almeida', 'pedro.almeida@empresa.com', 'EMP005', 1, 2, ${dirTIId}, '2021-01-10', 'active', 'São Paulo')
  `);
  const gerTI1Id = gerTI1Result.insertId;

  const [gerRH1Result] = await connection.query(`
    INSERT INTO employees (fullName, email, employeeId, departmentId, positionId, supervisorId, hireDate, status, location)
    VALUES ('Julia Ferreira', 'julia.ferreira@empresa.com', 'EMP006', 2, 2, ${dirRHId}, '2021-02-15', 'active', 'São Paulo')
  `);
  const gerRH1Id = gerRH1Result.insertId;

  const [gerCom1Result] = await connection.query(`
    INSERT INTO employees (fullName, email, employeeId, departmentId, positionId, supervisorId, hireDate, status, location)
    VALUES ('Lucas Martins', 'lucas.martins@empresa.com', 'EMP007', 3, 2, ${dirComId}, '2021-03-20', 'active', 'Rio de Janeiro')
  `);
  const gerCom1Id = gerCom1Result.insertId;

  console.log(`✓ 3 Managers created`);

  // Coordinators and Analysts (report to Managers)
  await connection.query(`
    INSERT INTO employees (fullName, email, employeeId, departmentId, positionId, supervisorId, hireDate, status, location) VALUES
    ('Fernanda Lima', 'fernanda.lima@empresa.com', 'EMP008', 1, 3, ${gerTI1Id}, '2021-06-01', 'active', 'São Paulo'),
    ('Ricardo Souza', 'ricardo.souza@empresa.com', 'EMP009', 1, 4, ${gerTI1Id}, '2021-07-15', 'active', 'São Paulo'),
    ('Camila Rocha', 'camila.rocha@empresa.com', 'EMP010', 1, 5, ${gerTI1Id}, '2022-01-10', 'active', 'São Paulo'),
    ('Bruno Dias', 'bruno.dias@empresa.com', 'EMP011', 1, 6, ${gerTI1Id}, '2022-03-20', 'active', 'São Paulo'),
    ('Patricia Gomes', 'patricia.gomes@empresa.com', 'EMP012', 2, 4, ${gerRH1Id}, '2021-08-01', 'active', 'São Paulo'),
    ('Thiago Barbosa', 'thiago.barbosa@empresa.com', 'EMP013', 2, 5, ${gerRH1Id}, '2022-02-15', 'active', 'São Paulo'),
    ('Amanda Silva', 'amanda.silva@empresa.com', 'EMP014', 3, 4, ${gerCom1Id}, '2021-09-10', 'active', 'Rio de Janeiro'),
    ('Rafael Costa', 'rafael.costa@empresa.com', 'EMP015', 3, 5, ${gerCom1Id}, '2022-04-01', 'active', 'Rio de Janeiro'),
    ('Juliana Santos', 'juliana.santos@empresa.com', 'EMP016', 3, 6, ${gerCom1Id}, '2022-05-15', 'active', 'Rio de Janeiro')
  `);

  console.log(`✓ 9 Coordinators and Analysts created`);

  console.log("\n✅ Seed completed successfully!");
  console.log("\nSummary:");
  console.log("- 5 Departments");
  console.log("- 7 Positions");
  console.log("- 16 Employees (with hierarchical structure)");
  console.log("\nHierarchy structure:");
  console.log("CEO → 3 Directors → 3 Managers → 9 Team members");

} catch (error) {
  console.error("❌ Error seeding data:", error);
  throw error;
} finally {
  await connection.end();
}
