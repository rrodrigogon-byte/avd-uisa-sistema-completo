import { drizzle } from "drizzle-orm/mysql2";
import { integrityTests } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function checkData() {
  try {
    const tests = await db.select().from(integrityTests).limit(5);
    console.log("Testes de integridade encontrados:", tests.length);
    console.log(JSON.stringify(tests, null, 2));
  } catch (error) {
    console.error("Erro ao buscar testes:", error.message);
  }
}

checkData();
