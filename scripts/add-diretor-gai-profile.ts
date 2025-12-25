/**
 * Script para adicionar perfil "Diretor GAI" (Gente, Administração e Inovação)
 * e atribuir ao Rodrigo Ribeiro Gonçalves
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import { profiles, profilePermissions, permissions, users, userProfiles } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function addDiretorGAIProfile() {
  console.log("🚀 Adicionando perfil Diretor GAI...\n");

  try {
    // 1. Criar perfil Diretor GAI
    console.log("1. Criando perfil Diretor GAI...");
    const [diretorProfile] = await db.insert(profiles).values({
      code: "diretor_gai",
      name: "Diretor de Gente, Administração e Inovação",
      description: "Diretor responsável por Gente, Administração e Inovação. Aprovação final de descrições de cargos, políticas de RH e decisões estratégicas.",
      level: 2, // Entre Admin (1) e RH Gerente (3)
      active: true,
    });

    console.log("✅ Perfil Diretor GAI criado!\n");

    // 2. Buscar todas as permissões (Diretor GAI tem quase todas, exceto config de sistema)
    console.log("2. Buscando permissões...");
    const allPermissions = await db.select().from(permissions).where(eq(permissions.active, true));
    
    // Filtrar permissões (Diretor GAI não tem permissões de configuração de sistema)
    const diretorPermissions = allPermissions.filter(p => 
      p.resource !== "config" || p.action !== "editar_sistema"
    );

    console.log(`✅ ${diretorPermissions.length} permissões encontradas\n`);

    // 3. Atribuir permissões ao perfil
    console.log("3. Atribuindo permissões ao perfil Diretor GAI...");
    
    const diretorProfileId = diretorProfile.insertId;
    
    for (const permission of diretorPermissions) {
      await db.insert(profilePermissions).values({
        profileId: diretorProfileId,
        permissionId: permission.id,
      });
    }

    console.log(`✅ ${diretorPermissions.length} permissões atribuídas!\n`);

    // 4. Buscar usuário Rodrigo Ribeiro Gonçalves
    console.log("4. Buscando usuário Rodrigo Ribeiro Gonçalves...");
    const [rodrigo] = await db
      .select()
      .from(users)
      .where(eq(users.email, "rodrigogon@gmail.com"))
      .limit(1);

    if (!rodrigo) {
      console.log("⚠️  Usuário Rodrigo não encontrado. Tentando buscar por nome...");
      const [rodrigoByName] = await db
        .select()
        .from(users)
        .where(eq(users.name, "Rodrigo Ribeiro goncalves"))
        .limit(1);
      
      if (!rodrigoByName) {
        console.log("❌ Usuário Rodrigo não encontrado no sistema.");
        console.log("   Execute o script de importação de funcionários primeiro.");
        return;
      }
      
      console.log(`✅ Usuário encontrado: ${rodrigoByName.name} (ID: ${rodrigoByName.id})\n`);
      
      // 5. Atribuir perfil Diretor GAI ao Rodrigo
      console.log("5. Atribuindo perfil Diretor GAI ao Rodrigo...");
      await db.insert(userProfiles).values({
        userId: rodrigoByName.id,
        profileId: diretorProfileId,
        assignedBy: rodrigoByName.id, // Auto-atribuição inicial
      });
      
      console.log("✅ Perfil atribuído com sucesso!\n");
      
      console.log("✨ Processo concluído!");
      console.log(`   Rodrigo Ribeiro Gonçalves agora tem o perfil "Diretor GAI"`);
      console.log(`   Total de permissões: ${diretorPermissions.length}`);
      
      return;
    }

    console.log(`✅ Usuário encontrado: ${rodrigo.name} (ID: ${rodrigo.id})\n`);

    // 5. Atribuir perfil Diretor GAI ao Rodrigo
    console.log("5. Atribuindo perfil Diretor GAI ao Rodrigo...");
    await db.insert(userProfiles).values({
      userId: rodrigo.id,
      profileId: diretorProfileId,
      assignedBy: rodrigo.id, // Auto-atribuição inicial
    });

    console.log("✅ Perfil atribuído com sucesso!\n");

    console.log("✨ Processo concluído!");
    console.log(`   Rodrigo Ribeiro Gonçalves agora tem o perfil "Diretor GAI"`);
    console.log(`   Total de permissões: ${diretorPermissions.length}`);

  } catch (error) {
    console.error("❌ Erro ao adicionar perfil Diretor GAI:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addDiretorGAIProfile();
