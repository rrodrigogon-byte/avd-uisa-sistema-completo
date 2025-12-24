#!/usr/bin/env node
/**
 * Script para popular banco de dados com estrutura do Mapa Sucessório UISA
 * Baseado no PPT CópiadeMapaSucessórioGerencial-SF24.25(2).pptx
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { employees, positions, departments, successionPlans, successionCandidates } from './drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🚀 Iniciando população do Mapa Sucessório UISA...\n');

// 1. CRIAR DEPARTAMENTOS
const departmentData = [
  { name: 'Presidência', code: 'PRES', description: 'Presidência Executiva' },
  { name: 'Comercial', code: 'COM', description: 'Diretoria Comercial' },
  { name: 'Financeiro e Administrativo', code: 'FIN', description: 'Diretoria Financeira e Administrativa' },
  { name: 'Tecnologia e Inovação', code: 'TI', description: 'Diretoria de Tecnologia e Inovação' },
  { name: 'Gente e Cultura', code: 'RH', description: 'Diretoria de Gente e Cultura' },
  { name: 'Agroindustrial', code: 'AGRO', description: 'Diretoria Agroindustrial' },
  { name: 'Sustentabilidade', code: 'SUST', description: 'Gerência de Sustentabilidade' },
  { name: 'Suprimentos', code: 'SUP', description: 'Gerência Executiva de Suprimentos' },
  { name: 'Controladoria', code: 'CTRL', description: 'Gerência Executiva de Controladoria' },
  { name: 'Planejamento Estratégico', code: 'PLAN', description: 'Planejamento Estratégico e Novos Negócios' },
];

console.log('📁 Criando departamentos...');
const deptIds = {};
for (const dept of departmentData) {
  try {
    const [result] = await db.insert(departments).values(dept);
    deptIds[dept.code] = result.insertId;
    console.log(`  ✓ ${dept.name}`);
  } catch (e) {
    console.log(`  ⚠ ${dept.name} (já existe)`);
  }
}

// 2. CRIAR CARGOS
const positionData = [
  // Presidência
  { title: 'Gerente Executivo Jurídico, Compliance e Contratos', level: 'gerencia_executiva', departmentId: deptIds['PRES'] },
  
  // Financeiro
  { title: 'Gerente Estruturação Financeira e RI', level: 'gerencia', departmentId: deptIds['FIN'] },
  { title: 'Gerente Executivo Planejamento Estratégico e Novos Negócios', level: 'gerencia_executiva', departmentId: deptIds['PLAN'] },
  { title: 'Gerente Planejamento e Custos', level: 'gerencia', departmentId: deptIds['PLAN'] },
  { title: 'Gerente Executivo de Controladoria', level: 'gerencia_executiva', departmentId: deptIds['CTRL'] },
  { title: 'Coordenador Contábil', level: 'coordenacao', departmentId: deptIds['CTRL'] },
  { title: 'Coordenador Tributário', level: 'coordenacao', departmentId: deptIds['CTRL'] },
  
  // Sustentabilidade
  { title: 'Gerente Sustentabilidade', level: 'gerencia', departmentId: deptIds['SUST'] },
  { title: 'Coordenador de Sustentabilidade', level: 'coordenacao', departmentId: deptIds['SUST'] },
  { title: 'Analista de Sustentabilidade PL', level: 'analista', departmentId: deptIds['SUST'] },
  
  // Suprimentos
  { title: 'Gerente Executivo Suprimentos', level: 'gerencia_executiva', departmentId: deptIds['SUP'] },
  { title: 'Coordenadora de Compras', level: 'coordenacao', departmentId: deptIds['SUP'] },
  
  // Comercial
  { title: 'Gerente Executivo Comercial', level: 'gerencia_executiva', departmentId: deptIds['COM'] },
  { title: 'Gerente de Filial', level: 'gerencia', departmentId: deptIds['COM'] },
  { title: 'Coordenador Comercial', level: 'coordenacao', departmentId: deptIds['COM'] },
  { title: 'Especialista Key Account', level: 'especialista', departmentId: deptIds['COM'] },
  { title: 'Gerente de Logística', level: 'gerencia', departmentId: deptIds['COM'] },
  
  // TI
  { title: 'Gerente de Automação', level: 'gerencia', departmentId: deptIds['TI'] },
  
  // Agroindustrial
  { title: 'Gerente SST', level: 'gerencia', departmentId: deptIds['AGRO'] },
  { title: 'Coordenadora de SST', level: 'coordenacao', departmentId: deptIds['AGRO'] },
  { title: 'Gerente Agrícola e Manutenção', level: 'gerencia', departmentId: deptIds['AGRO'] },
];

console.log('\n💼 Criando cargos...');
const posIds = {};
for (const pos of positionData) {
  try {
    const [result] = await db.insert(positions).values(pos);
    posIds[pos.title] = result.insertId;
    console.log(`  ✓ ${pos.title}`);
  } catch (e) {
    console.log(`  ⚠ ${pos.title} (já existe)`);
  }
}

// 3. CRIAR FUNCIONÁRIOS
const employeeData = [
  // Presidência
  { name: 'Camila', fullName: 'Camila Silva', positionId: posIds['Gerente Executivo Jurídico, Compliance e Contratos'], departmentId: deptIds['PRES'], status: 'ativo', email: 'camila.silva@uisa.com.br' },
  { name: 'Mércia', fullName: 'Mércia Santos', positionId: posIds['Coordenador Contábil'], departmentId: deptIds['PRES'], status: 'ativo', email: 'mercia.santos@uisa.com.br' },
  
  // Financeiro
  { name: 'Eduardo Vasconcelos Gerscovich', fullName: 'Eduardo Vasconcelos Gerscovich', positionId: posIds['Gerente Estruturação Financeira e RI'], departmentId: deptIds['FIN'], status: 'ativo', email: 'eduardo.gerscovich@uisa.com.br', admissionDate: new Date('2023-08-01') },
  { name: 'Tomaz Carraro Pereira', fullName: 'Tomaz Carraro Pereira', positionId: posIds['Gerente Executivo Planejamento Estratégico e Novos Negócios'], departmentId: deptIds['PLAN'], status: 'ativo', email: 'tomaz.pereira@uisa.com.br', admissionDate: new Date('2021-03-01') },
  { name: 'Moroni Felipe da Cruz Ribeiro', fullName: 'Moroni Felipe da Cruz Ribeiro', positionId: posIds['Gerente Planejamento e Custos'], departmentId: deptIds['PLAN'], status: 'ativo', email: 'moroni.ribeiro@uisa.com.br', admissionDate: new Date('2022-06-01') },
  { name: 'Fabio Luiz Dal Posso', fullName: 'Fabio Luiz Dal Posso', positionId: posIds['Gerente Executivo de Controladoria'], departmentId: deptIds['CTRL'], status: 'ativo', email: 'fabio.posso@uisa.com.br', admissionDate: new Date('1995-02-01') },
  { name: 'Wilson Oliveira Eduardo', fullName: 'Wilson Oliveira Eduardo', positionId: posIds['Coordenador Contábil'], departmentId: deptIds['CTRL'], status: 'ativo', email: 'wilson.eduardo@uisa.com.br', admissionDate: new Date('2022-06-01') },
  { name: 'Dilson Ferreira Santos', fullName: 'Dilson Ferreira Santos', positionId: posIds['Coordenador Tributário'], departmentId: deptIds['CTRL'], status: 'ativo', email: 'dilson.santos@uisa.com.br', admissionDate: new Date('2021-03-01') },
  
  // Sustentabilidade
  { name: 'Caetano Henrique Grossi', fullName: 'Caetano Henrique Grossi', positionId: posIds['Gerente Sustentabilidade'], departmentId: deptIds['SUST'], status: 'ativo', email: 'caetano.grossi@uisa.com.br', admissionDate: new Date('2003-09-01') },
  { name: 'Luiz Carlos Machado Filho', fullName: 'Luiz Carlos Machado Filho', positionId: posIds['Coordenador de Sustentabilidade'], departmentId: deptIds['SUST'], status: 'ativo', email: 'luiz.machado@uisa.com.br', admissionDate: new Date('2007-09-01') },
  { name: 'Douglas Arvani Macedo', fullName: 'Douglas Arvani Macedo', positionId: posIds['Analista de Sustentabilidade PL'], departmentId: deptIds['SUST'], status: 'ativo', email: 'douglas.macedo@uisa.com.br', admissionDate: new Date('2021-04-01') },
  
  // Suprimentos
  { name: 'Carlos Eduardo Mesquita', fullName: 'Carlos Eduardo Mesquita', positionId: posIds['Gerente Executivo Suprimentos'], departmentId: deptIds['SUP'], status: 'ativo', email: 'carlos.mesquita@uisa.com.br', admissionDate: new Date('2022-10-01') },
  { name: 'Nádia Carvalho', fullName: 'Nádia Carvalho', positionId: posIds['Coordenadora de Compras'], departmentId: deptIds['SUP'], status: 'ativo', email: 'nadia.carvalho@uisa.com.br', admissionDate: new Date('2021-01-01') },
  
  // Comercial
  { name: 'Gustavo Levenhagem', fullName: 'Gustavo Levenhagem', positionId: posIds['Gerente Executivo Comercial'], departmentId: deptIds['COM'], status: 'ativo', email: 'gustavo.levenhagem@uisa.com.br', admissionDate: new Date('2020-06-01') },
  { name: 'Marcelo Camargo', fullName: 'Marcelo Camargo', positionId: posIds['Gerente de Filial'], departmentId: deptIds['COM'], status: 'ativo', email: 'marcelo.camargo@uisa.com.br', admissionDate: new Date('2004-01-01') },
  { name: 'Fernando Oliveira', fullName: 'Fernando Oliveira', positionId: posIds['Coordenador Comercial'], departmentId: deptIds['COM'], status: 'ativo', email: 'fernando.oliveira@uisa.com.br', admissionDate: new Date('2023-06-01') },
];

console.log('\n👥 Criando funcionários...');
const empIds = {};
for (const emp of employeeData) {
  try {
    const [result] = await db.insert(employees).values(emp);
    empIds[emp.fullName] = result.insertId;
    console.log(`  ✓ ${emp.fullName} - ${emp.positionId ? positionData.find(p => posIds[p.title] === emp.positionId)?.title : 'Sem cargo'}`);
  } catch (e) {
    console.log(`  ⚠ ${emp.fullName} (erro: ${e.message})`);
  }
}

console.log('\n✅ População concluída!');
console.log(`\n📊 Resumo:`);
console.log(`  - ${departmentData.length} departamentos`);
console.log(`  - ${positionData.length} cargos`);
console.log(`  - ${employeeData.length} funcionários`);

await connection.end();
