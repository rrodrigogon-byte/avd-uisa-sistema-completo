import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Conectar ao banco de dados
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Ler arquivo Excel
const workbook = XLSX.readFile(join(__dirname, "../funcionarios-hierarquia.xlsx"));
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Total de registros no Excel: ${data.length}`);

// Mapear dados únicos de funcionários
const employeesMap = new Map();
const managersMap = new Map();

for (const row of data) {
  // Adicionar funcionário principal
  if (row.Chapa && row.Nome) {
    employeesMap.set(row.Chapa, {
      chapa: row.Chapa.toString(),
      employeeCode: row.Chapa.toString(),
      name: row.Nome,
      email: row.Email || null,
      funcao: row.Função || null,
      secao: row.Seção || null,
    });
  }

  // Mapear hierarquia
  if (row.Chapa && row["[Chapa Coordenador]"]) {
    managersMap.set(row.Chapa.toString(), row["[Chapa Coordenador]"].toString());
  } else if (row.Chapa && row["[Chapa Gestor]"]) {
    managersMap.set(row.Chapa.toString(), row["[Chapa Gestor]"].toString());
  } else if (row.Chapa && row["[Chapa Diretor]"]) {
    managersMap.set(row.Chapa.toString(), row["[Chapa Diretor]"].toString());
  } else if (row.Chapa && row["[Chapa Presidente]"]) {
    managersMap.set(row.Chapa.toString(), row["[Chapa Presidente]"].toString());
  }

  // Adicionar coordenador
  if (row["[Chapa Coordenador]"] && row.Coordenador) {
    employeesMap.set(row["[Chapa Coordenador]"], {
      chapa: row["[Chapa Coordenador]"].toString(),
      employeeCode: row["[Chapa Coordenador]"].toString(),
      name: row.Coordenador,
      email: row["[Email Coordenador]"] || null,
      funcao: row["[Função Coordenador]"] || null,
      secao: row.Seção || null,
    });
  }

  // Adicionar gestor
  if (row["[Chapa Gestor]"] && row.Gestor) {
    employeesMap.set(row["[Chapa Gestor]"], {
      chapa: row["[Chapa Gestor]"].toString(),
      employeeCode: row["[Chapa Gestor]"].toString(),
      name: row.Gestor,
      email: row["[Email Gestor]"] || null,
      funcao: row["[Função Gestor]"] || null,
      secao: row.Seção || null,
    });
  }

  // Adicionar diretor
  if (row["[Chapa Diretor]"] && row.Diretor) {
    employeesMap.set(row["[Chapa Diretor]"], {
      chapa: row["[Chapa Diretor]"].toString(),
      employeeCode: row["[Chapa Diretor]"].toString(),
      name: row.Diretor,
      email: row["[Email Diretor]"] || null,
      funcao: row["[Função Diretor]"] || null,
      secao: row.Seção || null,
    });
  }

  // Adicionar presidente
  if (row["[Chapa Presidente]"] && row.Presidente) {
    employeesMap.set(row["[Chapa Presidente]"], {
      chapa: row["[Chapa Presidente]"].toString(),
      employeeCode: row["[Chapa Presidente]"].toString(),
      name: row.Presidente,
      email: row["[Email Presidente]"] || null,
      funcao: row["[Função Presidente]"] || null,
      secao: row.Seção || null,
    });
  }
}

console.log(`Total de funcionários únicos: ${employeesMap.size}`);

// Inserir funcionários no banco de dados
let insertedCount = 0;
let updatedCount = 0;

for (const [chapa, employee] of employeesMap) {
  try {
    // Verificar se funcionário já existe
    const [existing] = await connection.execute(
      "SELECT id FROM employees WHERE chapa = ?",
      [chapa]
    );

    if (existing.length > 0) {
      // Atualizar funcionário existente
      await connection.execute(
        `UPDATE employees 
         SET name = ?, email = ?, funcao = ?, secao = ?
         WHERE chapa = ?`,
        [employee.name, employee.email, employee.funcao, employee.secao, chapa]
      );
      updatedCount++;
    } else {
      // Inserir novo funcionário
      await connection.execute(
        `INSERT INTO employees (chapa, employeeCode, name, email, funcao, secao, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [chapa, employee.employeeCode, employee.name, employee.email, employee.funcao, employee.secao]
      );
      insertedCount++;
    }
  } catch (error) {
    console.error(`Erro ao processar funcionário ${chapa}:`, error.message);
  }
}

console.log(`Funcionários inseridos: ${insertedCount}`);
console.log(`Funcionários atualizados: ${updatedCount}`);

// Atualizar hierarquia (managerId)
let hierarchyUpdated = 0;

for (const [employeeChapa, managerChapa] of managersMap) {
  try {
    // Buscar IDs dos funcionários
    const [employeeResult] = await connection.execute(
      "SELECT id FROM employees WHERE chapa = ?",
      [employeeChapa]
    );

    const [managerResult] = await connection.execute(
      "SELECT id FROM employees WHERE chapa = ?",
      [managerChapa]
    );

    if (employeeResult.length > 0 && managerResult.length > 0) {
      const employeeId = employeeResult[0].id;
      const managerId = managerResult[0].id;

      await connection.execute(
        "UPDATE employees SET managerId = ? WHERE id = ?",
        [managerId, employeeId]
      );
      hierarchyUpdated++;
    }
  } catch (error) {
    console.error(`Erro ao atualizar hierarquia ${employeeChapa} -> ${managerChapa}:`, error.message);
  }
}

console.log(`Hierarquias atualizadas: ${hierarchyUpdated}`);

await connection.end();
console.log("Importação concluída!");
