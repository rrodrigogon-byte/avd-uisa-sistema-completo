import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Script para criar usuários líderes e administradores
 * Execução: node scripts/seed-users.mjs
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// Função para gerar senha aleatória
function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Função para gerar openId único
function generateOpenId(name) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  const normalized = name.toLowerCase().replace(/\s+/g, "_");
  return `${normalized}_${timestamp}_${random}`;
}

// Usuários a serem criados
const usersToCreate = [
  {
    name: "Lucas dos Passos Silva",
    email: "lucas.silva@uisa.com.br",
    role: "gestor",
    isSalaryLead: false,
  },
  {
    name: "Marcio Bortolloto",
    email: "marcio.bortolloto@uisa.com.br",
    role: "gestor",
    isSalaryLead: false,
  },
  {
    name: "Ede Ogusuku",
    email: "ede.ogusuku@uisa.com.br",
    role: "gestor",
    isSalaryLead: false,
  },
  {
    name: "Rodrigo Ribeiro Goncalves",
    email: "rodrigo.goncalves@uisa.com.br",
    role: "admin",
    isSalaryLead: false,
    title: "Diretor de Gente, Administração e Inovação",
  },
  {
    name: "Andre Sbardelline",
    email: "andre.sbardelline@uisa.com.br",
    role: "admin",
    isSalaryLead: false,
    title: "Gerente de RH",
  },
  {
    name: "Caroline Mendes",
    email: "caroline.mendes@uisa.com.br",
    role: "admin",
    isSalaryLead: false,
    title: "Coordenadora de RH",
  },
];

async function seedUsers() {
  console.log("🌱 Iniciando seed de usuários...\n");

  const createdUsers = [];

  for (const userData of usersToCreate) {
    try {
      // Verificar se usuário já existe
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⚠️  Usuário ${userData.name} já existe (${userData.email})`);
        createdUsers.push({
          ...userData,
          password: "***EXISTENTE***",
          status: "existing",
        });
        continue;
      }

      // Gerar senha e openId
      const password = generatePassword();
      const openId = generateOpenId(userData.name);

      // Criar usuário
      await db.insert(users).values({
        openId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isSalaryLead: userData.isSalaryLead,
        loginMethod: "oauth",
        lastSignedIn: new Date(),
      });

      console.log(`✅ Criado: ${userData.name} (${userData.role})`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Senha: ${password}`);
      if (userData.title) {
        console.log(`   Cargo: ${userData.title}`);
      }
      console.log("");

      createdUsers.push({
        ...userData,
        password,
        status: "created",
      });
    } catch (error) {
      console.error(`❌ Erro ao criar ${userData.name}:`, error.message);
      createdUsers.push({
        ...userData,
        password: "***ERRO***",
        status: "error",
        error: error.message,
      });
    }
  }

  // Resumo
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DA CRIAÇÃO DE USUÁRIOS");
  console.log("=".repeat(60) + "\n");

  const created = createdUsers.filter((u) => u.status === "created");
  const existing = createdUsers.filter((u) => u.status === "existing");
  const errors = createdUsers.filter((u) => u.status === "error");

  console.log(`✅ Criados: ${created.length}`);
  console.log(`⚠️  Já existentes: ${existing.length}`);
  console.log(`❌ Erros: ${errors.length}`);
  console.log("");

  if (created.length > 0) {
    console.log("📧 CREDENCIAIS DOS NOVOS USUÁRIOS:");
    console.log("=".repeat(60));
    created.forEach((user) => {
      console.log(`\n👤 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Senha: ${user.password}`);
      console.log(`   Perfil: ${user.role === "admin" ? "Administrador" : "Gestor/Líder"}`);
      if (user.title) {
        console.log(`   Cargo: ${user.title}`);
      }
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Seed concluído!");
  console.log("=".repeat(60) + "\n");

  // Salvar credenciais em arquivo JSON
  const fs = await import("fs");
  const outputPath = "/home/ubuntu/avd-uisa-sistema-completo/scripts/usuarios-criados.json";
  fs.writeFileSync(outputPath, JSON.stringify(createdUsers, null, 2));
  console.log(`💾 Credenciais salvas em: ${outputPath}\n`);

  process.exit(0);
}

seedUsers().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
