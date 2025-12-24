#!/usr/bin/env node
/**
 * Script para popular descrições de cargos no banco de dados
 * Uso: node seed-job-descriptions.mjs
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar dados extraídos
const jobDescriptionsData = JSON.parse(
  readFileSync(join(__dirname, 'job_descriptions.json'), 'utf-8')
);

// Conectar ao banco
const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Mapear nomes de cargos para IDs de posições (ajustar conforme necessário)
const positionMapping = {
  'GerenteSistemaGestãoIntegrado': 'Gerente de Sistema de Gestão Integrado',
  '5GerentePlanejamentoeCustos': 'Gerente de Planejamento e Custos',
  '2AnalistaPlanejamentoCustosPL': 'Analista de Planejamento e Custos - Pleno',
  '3AnalistaPlanejamentoCustosJR': 'Analista de Planejamento e Custos - Júnior',
  '6EspecialistaPlanejamentoeAnáliseFinanceira': 'Especialista em Planejamento e Análise Financeira',
  '1AnalistaPlanejamentoCustosSR': 'Analista de Planejamento e Custos - Sênior',
  '8EspecialistaPlanejamentoeCustos': 'Especialista em Planejamento e Custos',
  'AnalistaBusinessIntelligence-JR': 'Analista de Business Intelligence - Júnior',
  'AnalistaBusinessIntelligence-PL': 'Analista de Business Intelligence - Pleno',
  'AnalistaBusinessIntelligence-SR': 'Analista de Business Intelligence - Sênior',
};

async function seedJobDescriptions() {
  console.log('🌱 Iniciando seed de descrições de cargos...\n');

  try {
    // Primeiro, buscar posições existentes
    const [positions] = await connection.execute('SELECT id, title FROM positions');
    const positionMap = new Map(positions.map(p => [p.title, p.id]));

    console.log(`📋 Encontradas ${positions.length} posições no banco\n`);

    // Buscar departamentos
    const [departments] = await connection.execute('SELECT id, name FROM departments LIMIT 1');
    const defaultDepartmentId = departments.length > 0 ? departments[0].id : 1;

    // Buscar primeiro usuário admin para usar como createdBy
    const [users] = await connection.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    const createdById = users.length > 0 ? users[0].id : 1;

    let inserted = 0;
    let updated = 0;

    for (const jobDesc of jobDescriptionsData) {
      const positionName = positionMapping[jobDesc.cargo] || jobDesc.cargo;
      
      console.log(`\n📝 Processando: ${positionName}`);

      // Buscar ou criar posição
      let positionId = positionMap.get(positionName);
      
      if (!positionId) {
        console.log(`  ➕ Criando nova posição: ${positionName}`);
        const [result] = await connection.execute(
          'INSERT INTO positions (code, title, description, level, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [positionName.toLowerCase().replace(/\s+/g, '_'), positionName, jobDesc.objetivo_principal || '', 'pleno', true]
        );
        positionId = result.insertId;
        positionMap.set(positionName, positionId);
      }

      // Verificar se já existe descrição para esta posição
      const [existing] = await connection.execute(
        'SELECT id FROM jobDescriptions WHERE positionId = ?',
        [positionId]
      );

      let jobDescriptionId;

      if (existing.length > 0) {
        // Atualizar descrição existente
        jobDescriptionId = existing[0].id;
        console.log(`  ♻️  Atualizando descrição existente (ID: ${jobDescriptionId})`);
        
        await connection.execute(
          `UPDATE jobDescriptions 
           SET mainObjective = ?, positionTitle = ?, departmentId = ?, departmentName = ?,
               cbo = ?, educationLevel = ?, requiredExperience = ?, 
               status = ?, updatedAt = NOW()
           WHERE id = ?`,
          [
            jobDesc.objetivo_principal || '',
            positionName,
            defaultDepartmentId,
            jobDesc.departamento || 'Não especificado',
            jobDesc.cbo || '',
            jobDesc.formacao || '',
            jobDesc.experiencia || '',
            'approved',
            jobDescriptionId
          ]
        );

        // Limpar responsabilidades, conhecimentos e competências antigas
        await connection.execute('DELETE FROM jobResponsibilities WHERE jobDescriptionId = ?', [jobDescriptionId]);
        await connection.execute('DELETE FROM jobKnowledge WHERE jobDescriptionId = ?', [jobDescriptionId]);
        await connection.execute('DELETE FROM jobCompetencies WHERE jobDescriptionId = ?', [jobDescriptionId]);
        
        updated++;
      } else {
        // Inserir nova descrição
        console.log(`  ✅ Inserindo nova descrição`);
        
        const [result] = await connection.execute(
          `INSERT INTO jobDescriptions 
           (positionId, positionTitle, departmentId, departmentName, cbo, 
            mainObjective, educationLevel, requiredExperience, status, 
            createdById, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            positionId,
            positionName,
            defaultDepartmentId,
            jobDesc.departamento || 'Não especificado',
            jobDesc.cbo || '',
            jobDesc.objetivo_principal || '',
            jobDesc.formacao || '',
            jobDesc.experiencia || '',
            'approved',
            createdById
          ]
        );
        
        jobDescriptionId = result.insertId;
        inserted++;
      }

      // Inserir responsabilidades
      if (jobDesc.responsabilidades && jobDesc.responsabilidades.length > 0) {
        console.log(`  📊 Inserindo ${jobDesc.responsabilidades.length} responsabilidades`);
        for (let i = 0; i < jobDesc.responsabilidades.length; i++) {
          const resp = jobDesc.responsabilidades[i];
          if (resp && resp.length > 10) { // Ignorar textos muito curtos
            await connection.execute(
              'INSERT INTO jobResponsibilities (jobDescriptionId, category, description, displayOrder, createdAt) VALUES (?, ?, ?, ?, NOW())',
              [jobDescriptionId, 'Geral', resp, i]
            );
          }
        }
      }

      // Inserir conhecimentos técnicos
      if (jobDesc.conhecimentos_tecnicos && jobDesc.conhecimentos_tecnicos.length > 0) {
        console.log(`  🔧 Inserindo ${jobDesc.conhecimentos_tecnicos.length} conhecimentos técnicos`);
        for (let i = 0; i < jobDesc.conhecimentos_tecnicos.length; i++) {
          const conhecimento = jobDesc.conhecimentos_tecnicos[i];
          if (conhecimento && conhecimento.nome) {
            // Mapear nível para enum válido
            let nivel = 'basico';
            if (conhecimento.nivel) {
              const nivelLower = conhecimento.nivel.toLowerCase();
              if (nivelLower.includes('interm')) nivel = 'intermediario';
              else if (nivelLower.includes('avan')) nivel = 'avancado';
              else if (nivelLower.includes('obrig')) nivel = 'obrigatorio';
            }
            
            await connection.execute(
              'INSERT INTO jobKnowledge (jobDescriptionId, name, level, displayOrder, createdAt) VALUES (?, ?, ?, ?, NOW())',
              [jobDescriptionId, conhecimento.nome, nivel, i]
            );
          }
        }
      }

      // Inserir competências
      if (jobDesc.competencias && jobDesc.competencias.length > 0) {
        console.log(`  💡 Inserindo ${jobDesc.competencias.length} competências`);
        for (let i = 0; i < jobDesc.competencias.length; i++) {
          const comp = jobDesc.competencias[i];
          if (comp && comp.length > 3) { // Ignorar textos muito curtos
            await connection.execute(
              'INSERT INTO jobCompetencies (jobDescriptionId, name, displayOrder, createdAt) VALUES (?, ?, ?, NOW())',
              [jobDescriptionId, comp, i]
            );
          }
        }
      }
    }

    console.log('\n\n✅ Seed concluído com sucesso!');
    console.log(`   📥 Inseridos: ${inserted}`);
    console.log(`   ♻️  Atualizados: ${updated}`);
    console.log(`   📊 Total processado: ${jobDescriptionsData.length}`);

  } catch (error) {
    console.error('\n❌ Erro ao executar seed:', error);
    await connection.end();
    process.exit(1);
  }

  await connection.end();
  process.exit(0);
}

// Executar seed
seedJobDescriptions();
