/**
 * Script para popular templates Leadership Pipeline
 * Cria templates pré-configurados para cada nível hierárquico
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

const leadershipTemplates = [
  {
    name: 'Avaliação 360° - Nível Operacional',
    description: 'Template para colaboradores de nível operacional focado em execução de tarefas e trabalho em equipe',
    templateType: '360',
    hierarchyLevel: 'operacional',
    questions: [
      { category: 'Execução de Tarefas', questionText: 'Demonstra qualidade na execução das atividades diárias', weight: 3 },
      { category: 'Execução de Tarefas', questionText: 'Cumpre prazos e metas estabelecidas', weight: 3 },
      { category: 'Trabalho em Equipe', questionText: 'Colabora ativamente com colegas de equipe', weight: 2 },
      { category: 'Trabalho em Equipe', questionText: 'Compartilha conhecimento e ajuda outros membros', weight: 2 },
      { category: 'Disciplina', questionText: 'Segue procedimentos e normas de segurança', weight: 3 },
      { category: 'Disciplina', questionText: 'Mantém assiduidade e pontualidade', weight: 2 },
      { category: 'Aprendizado', questionText: 'Demonstra interesse em aprender novas técnicas', weight: 2 },
      { category: 'Comunicação', questionText: 'Comunica problemas e necessidades de forma clara', weight: 2 }
    ]
  },
  {
    name: 'Avaliação 360° - Nível Coordenação',
    description: 'Template para coordenadores focado em gestão de equipe e processos',
    templateType: '360',
    hierarchyLevel: 'coordenacao',
    questions: [
      { category: 'Gestão de Equipe', questionText: 'Distribui tarefas de forma equilibrada e eficiente', weight: 3 },
      { category: 'Gestão de Equipe', questionText: 'Desenvolve e orienta membros da equipe', weight: 3 },
      { category: 'Gestão de Equipe', questionText: 'Resolve conflitos de forma construtiva', weight: 2 },
      { category: 'Gestão de Processos', questionText: 'Garante cumprimento de procedimentos operacionais', weight: 3 },
      { category: 'Gestão de Processos', questionText: 'Identifica e propõe melhorias nos processos', weight: 2 },
      { category: 'Comunicação', questionText: 'Comunica metas e expectativas com clareza', weight: 2 },
      { category: 'Tomada de Decisão', questionText: 'Toma decisões operacionais com agilidade', weight: 2 },
      { category: 'Resultados', questionText: 'Atinge metas operacionais da área', weight: 3 }
    ]
  },
  {
    name: 'Avaliação 360° - Nível Gerência',
    description: 'Template para gerentes focado em gestão estratégica e desenvolvimento de pessoas',
    templateType: '360',
    hierarchyLevel: 'gerencia',
    questions: [
      { category: 'Liderança Estratégica', questionText: 'Define estratégias claras para a área', weight: 3 },
      { category: 'Liderança Estratégica', questionText: 'Alinha objetivos da área com estratégia da empresa', weight: 3 },
      { category: 'Desenvolvimento de Pessoas', questionText: 'Identifica e desenvolve talentos na equipe', weight: 3 },
      { category: 'Desenvolvimento de Pessoas', questionText: 'Promove sucessão e planos de carreira', weight: 2 },
      { category: 'Gestão de Recursos', questionText: 'Gerencia orçamento de forma eficiente', weight: 2 },
      { category: 'Gestão de Recursos', questionText: 'Otimiza uso de recursos (pessoas, equipamentos, tempo)', weight: 2 },
      { category: 'Visão de Negócio', questionText: 'Demonstra compreensão do negócio e mercado', weight: 2 },
      { category: 'Inovação', questionText: 'Promove inovação e melhoria contínua', weight: 2 },
      { category: 'Resultados', questionText: 'Atinge resultados estratégicos da área', weight: 3 }
    ]
  },
  {
    name: 'Avaliação 360° - Nível Diretoria',
    description: 'Template para diretores focado em visão estratégica e liderança organizacional',
    templateType: '360',
    hierarchyLevel: 'diretoria',
    questions: [
      { category: 'Visão Estratégica', questionText: 'Define direcionamento estratégico de longo prazo', weight: 4 },
      { category: 'Visão Estratégica', questionText: 'Antecipa tendências e prepara organização para o futuro', weight: 3 },
      { category: 'Liderança Organizacional', questionText: 'Inspira e mobiliza líderes e equipes', weight: 3 },
      { category: 'Liderança Organizacional', questionText: 'Promove cultura organizacional alinhada aos valores', weight: 3 },
      { category: 'Gestão de Stakeholders', questionText: 'Gerencia relacionamento com stakeholders estratégicos', weight: 3 },
      { category: 'Gestão de Stakeholders', questionText: 'Representa empresa em fóruns e negociações importantes', weight: 2 },
      { category: 'Tomada de Decisão Estratégica', questionText: 'Toma decisões complexas considerando múltiplas variáveis', weight: 3 },
      { category: 'Desenvolvimento Organizacional', questionText: 'Desenvolve pipeline de liderança', weight: 3 },
      { category: 'Resultados Corporativos', questionText: 'Entrega resultados corporativos e financeiros', weight: 4 }
    ]
  }
];

async function main() {
  console.log('🔄 Conectando ao banco de dados...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log('📝 Criando templates Leadership Pipeline...\n');

  try {
    for (const template of leadershipTemplates) {
      console.log(`\n📋 Criando template: ${template.name}`);
      
      // Inserir template
      const [templateResult] = await connection.execute(
        `INSERT INTO evaluationTemplates 
         (name, description, templateType, hierarchyLevel, isActive, isDefault, createdBy, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, true, true, 1, NOW(), NOW())`,
        [template.name, template.description, template.templateType, template.hierarchyLevel]
      );
      
      const templateId = templateResult.insertId;
      console.log(`   ✅ Template criado com ID: ${templateId}`);
      
      // Inserir perguntas
      console.log(`   📝 Inserindo ${template.questions.length} perguntas...`);
      let displayOrder = 1;
      
      for (const question of template.questions) {
        await connection.execute(
          `INSERT INTO templateQuestions 
           (templateId, category, questionText, questionType, weight, displayOrder, isRequired, createdAt) 
           VALUES (?, ?, ?, 'scale_1_5', ?, ?, true, NOW())`,
          [templateId, question.category, question.questionText, question.weight, displayOrder++]
        );
      }
      
      console.log(`   ✅ ${template.questions.length} perguntas inseridas`);
    }

    console.log('\n\n✅ Templates Leadership Pipeline criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - ${leadershipTemplates.length} templates criados`);
    console.log(`   - ${leadershipTemplates.reduce((sum, t) => sum + t.questions.length, 0)} perguntas inseridas`);
    
  } catch (error) {
    console.error('\n❌ Erro ao criar templates:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
