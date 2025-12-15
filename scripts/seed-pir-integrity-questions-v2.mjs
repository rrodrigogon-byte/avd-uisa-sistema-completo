/**
 * Script para adicionar NOVAS questões ao banco de dados do PIR Integridade
 * Baseado nas 6 dimensões: IP, ID, IC, ES, FL, AU
 * Execução: node scripts/seed-pir-integrity-questions-v2.mjs
 */

import mysql from 'mysql2/promise';

// Novas questões para as 6 dimensões do PIR Integridade
const NEW_QUESTIONS = [
  // ============ INTEGRIDADE PESSOAL (IP) ============
  {
    dimensionCode: 'IP',
    questionType: 'scenario',
    title: 'Conflito de Valores no Trabalho',
    scenario: 'Você descobre que um colega próximo está cometendo pequenas irregularidades que beneficiam a equipe, mas violam as políticas da empresa. Ninguém mais percebeu.',
    question: 'Como você reagiria nesta situação?',
    options: [
      { value: 'A', label: 'Ignoro, pois beneficia a equipe', score: 20, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Converso reservadamente com o colega sobre os riscos', score: 60, moralLevel: 'conventional' },
      { value: 'C', label: 'Reporto imediatamente à gestão', score: 80, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Avalio o impacto e busco orientação de compliance', score: 100, moralLevel: 'post_conventional' },
    ],
    difficulty: 'medium',
  },
  {
    dimensionCode: 'IP',
    questionType: 'scenario',
    title: 'Pressão por Resultados',
    scenario: 'Seu gestor pede que você "ajuste" alguns números em um relatório para apresentar resultados melhores aos diretores. Ele garante que ninguém vai verificar.',
    question: 'Qual seria sua resposta?',
    options: [
      { value: 'A', label: 'Faço o ajuste para manter bom relacionamento com o gestor', score: 10, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Faço o ajuste, mas documento a solicitação', score: 30, moralLevel: 'pre_conventional' },
      { value: 'C', label: 'Recuso educadamente e apresento os números reais', score: 80, moralLevel: 'conventional' },
      { value: 'D', label: 'Recuso e escalo a situação para o canal de ética', score: 100, moralLevel: 'post_conventional' },
    ],
    difficulty: 'hard',
  },
  {
    dimensionCode: 'IP',
    questionType: 'scale',
    title: 'Consistência de Valores',
    question: 'Com que frequência você age de acordo com seus valores pessoais, mesmo quando isso pode trazer consequências negativas?',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['Raramente', 'Às vezes', 'Frequentemente', 'Quase sempre', 'Sempre'],
    difficulty: 'easy',
  },
  {
    dimensionCode: 'IP',
    questionType: 'multiple_choice',
    title: 'Definição de Integridade',
    question: 'O que melhor define integridade pessoal para você?',
    options: [
      { value: 'A', label: 'Seguir as regras para evitar punições', score: 20, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Fazer o que é esperado pela sociedade', score: 50, moralLevel: 'conventional' },
      { value: 'C', label: 'Agir conforme princípios universais de justiça', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Buscar o melhor resultado para si mesmo', score: 10, moralLevel: 'pre_conventional' },
    ],
    difficulty: 'easy',
  },

  // ============ INTEGRIDADE DECISÓRIA (ID) ============
  {
    dimensionCode: 'ID',
    questionType: 'scenario',
    title: 'Decisão sob Pressão de Tempo',
    scenario: 'Você precisa tomar uma decisão urgente sobre um contrato. Há uma cláusula que pode ser interpretada de forma favorável à empresa, mas potencialmente prejudicial ao fornecedor.',
    question: 'Como você procede?',
    options: [
      { value: 'A', label: 'Aproveito a interpretação favorável, é negócio', score: 20, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Consulto o jurídico para validar a interpretação', score: 60, moralLevel: 'conventional' },
      { value: 'C', label: 'Busco uma interpretação justa para ambas as partes', score: 90, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Solicito prazo adicional para análise ética completa', score: 100, moralLevel: 'post_conventional' },
    ],
    difficulty: 'hard',
  },
  {
    dimensionCode: 'ID',
    questionType: 'scenario',
    title: 'Conflito de Interesses',
    scenario: 'Você está avaliando propostas de fornecedores e descobre que um deles é empresa de um familiar. A proposta dele é tecnicamente adequada, mas não é a melhor.',
    question: 'Qual decisão você tomaria?',
    options: [
      { value: 'A', label: 'Escolho o familiar, afinal a proposta é adequada', score: 10, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Declaro o conflito e me abstenho da decisão', score: 100, moralLevel: 'post_conventional' },
      { value: 'C', label: 'Escolho a melhor proposta sem mencionar o conflito', score: 40, moralLevel: 'conventional' },
      { value: 'D', label: 'Peço que o familiar melhore a proposta', score: 20, moralLevel: 'pre_conventional' },
    ],
    difficulty: 'medium',
  },
  {
    dimensionCode: 'ID',
    questionType: 'scale',
    title: 'Análise de Consequências',
    question: 'Antes de tomar decisões importantes, com que frequência você considera o impacto em todas as partes envolvidas?',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
    difficulty: 'easy',
  },
  {
    dimensionCode: 'ID',
    questionType: 'multiple_choice',
    title: 'Critério de Decisão',
    question: 'Qual critério você considera mais importante ao tomar decisões profissionais?',
    options: [
      { value: 'A', label: 'O que traz mais benefício pessoal', score: 10, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'O que é aceito pela maioria', score: 40, moralLevel: 'conventional' },
      { value: 'C', label: 'O que está de acordo com as regras', score: 60, moralLevel: 'conventional' },
      { value: 'D', label: 'O que é justo e ético para todos', score: 100, moralLevel: 'post_conventional' },
    ],
    difficulty: 'easy',
  },

  // ============ INTEGRIDADE COMPORTAMENTAL (IC) ============
  {
    dimensionCode: 'IC',
    questionType: 'scenario',
    title: 'Promessa Difícil de Cumprir',
    scenario: 'Você prometeu entregar um projeto em uma data específica, mas percebe que não conseguirá cumprir o prazo sem comprometer a qualidade.',
    question: 'O que você faz?',
    options: [
      { value: 'A', label: 'Entrego no prazo, mesmo com qualidade inferior', score: 30, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Comunico o atraso apenas quando for inevitável', score: 40, moralLevel: 'conventional' },
      { value: 'C', label: 'Comunico proativamente e proponho alternativas', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Culpo fatores externos pelo atraso', score: 10, moralLevel: 'pre_conventional' },
    ],
    difficulty: 'medium',
  },
  {
    dimensionCode: 'IC',
    questionType: 'scenario',
    title: 'Coerência Pública vs Privada',
    scenario: 'Em uma reunião, você defendeu publicamente uma política da empresa. Em particular, um colega pergunta sua opinião real sobre a mesma política.',
    question: 'Como você responde?',
    options: [
      { value: 'A', label: 'Mantenho a mesma posição pública', score: 80, moralLevel: 'conventional' },
      { value: 'B', label: 'Compartilho minha opinião real, diferente da pública', score: 30, moralLevel: 'pre_conventional' },
      { value: 'C', label: 'Explico os pontos positivos e negativos honestamente', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Evito responder para não me comprometer', score: 20, moralLevel: 'pre_conventional' },
    ],
    difficulty: 'hard',
  },
  {
    dimensionCode: 'IC',
    questionType: 'scale',
    title: 'Alinhamento Discurso-Ação',
    question: 'Com que frequência suas ações estão alinhadas com o que você diz e promete?',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['Raramente', 'Às vezes', 'Frequentemente', 'Quase sempre', 'Sempre'],
    difficulty: 'easy',
  },
  {
    dimensionCode: 'IC',
    questionType: 'multiple_choice',
    title: 'Responsabilidade por Erros',
    question: 'Quando comete um erro no trabalho, qual é sua primeira reação?',
    options: [
      { value: 'A', label: 'Tento esconder ou minimizar', score: 10, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Assumo apenas se for descoberto', score: 30, moralLevel: 'pre_conventional' },
      { value: 'C', label: 'Comunico ao gestor e proponho correção', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Busco alguém para dividir a responsabilidade', score: 20, moralLevel: 'pre_conventional' },
    ],
    difficulty: 'medium',
  },

  // ============ ESTABILIDADE (ES) ============
  {
    dimensionCode: 'ES',
    questionType: 'scenario',
    title: 'Pressão Emocional',
    scenario: 'Você está passando por um momento pessoal difícil e um colega faz uma crítica injusta ao seu trabalho na frente da equipe.',
    question: 'Como você reage?',
    options: [
      { value: 'A', label: 'Respondo de forma agressiva no momento', score: 10, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Fico em silêncio, mas guardo ressentimento', score: 30, moralLevel: 'pre_conventional' },
      { value: 'C', label: 'Respondo calmamente e proponho conversar depois', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Saio da reunião para me acalmar', score: 60, moralLevel: 'conventional' },
    ],
    difficulty: 'hard',
  },
  {
    dimensionCode: 'ES',
    questionType: 'scenario',
    title: 'Mudança de Cenário',
    scenario: 'A empresa anuncia uma reestruturação que afetará sua área. Há rumores de demissões e mudanças de cargo.',
    question: 'Como você lida com a incerteza?',
    options: [
      { value: 'A', label: 'Entro em pânico e começo a procurar outro emprego', score: 20, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Fico ansioso, mas continuo trabalhando normalmente', score: 50, moralLevel: 'conventional' },
      { value: 'C', label: 'Mantenho foco no trabalho e busco informações oficiais', score: 90, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Aproveito para demonstrar valor e contribuir mais', score: 100, moralLevel: 'post_conventional' },
    ],
    difficulty: 'medium',
  },
  {
    dimensionCode: 'ES',
    questionType: 'scale',
    title: 'Consistência Emocional',
    question: 'Com que frequência você consegue manter a calma e o profissionalismo em situações de estresse?',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['Raramente', 'Às vezes', 'Frequentemente', 'Quase sempre', 'Sempre'],
    difficulty: 'easy',
  },
  {
    dimensionCode: 'ES',
    questionType: 'multiple_choice',
    title: 'Reação a Feedback Negativo',
    question: 'Quando recebe um feedback negativo, qual é sua reação típica?',
    options: [
      { value: 'A', label: 'Fico na defensiva e justifico minhas ações', score: 20, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Aceito externamente, mas discordo internamente', score: 40, moralLevel: 'conventional' },
      { value: 'C', label: 'Ouço atentamente e reflito sobre os pontos levantados', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Ignoro se não concordo com a avaliação', score: 10, moralLevel: 'pre_conventional' },
    ],
    difficulty: 'easy',
  },

  // ============ FLEXIBILIDADE (FL) ============
  {
    dimensionCode: 'FL',
    questionType: 'scenario',
    title: 'Adaptação de Métodos',
    scenario: 'A empresa implementa um novo sistema que muda completamente sua forma de trabalhar. Muitos colegas estão resistindo à mudança.',
    question: 'Qual é sua postura?',
    options: [
      { value: 'A', label: 'Resisto junto com os colegas', score: 10, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Aceito, mas reclamo das dificuldades', score: 30, moralLevel: 'pre_conventional' },
      { value: 'C', label: 'Adapto-me e ajudo colegas na transição', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Aceito passivamente sem questionar', score: 50, moralLevel: 'conventional' },
    ],
    difficulty: 'medium',
  },
  {
    dimensionCode: 'FL',
    questionType: 'scenario',
    title: 'Conflito de Abordagens',
    scenario: 'Você tem uma forma de trabalhar que sempre funcionou, mas um novo colega sugere uma abordagem completamente diferente que parece promissora.',
    question: 'Como você reage?',
    options: [
      { value: 'A', label: 'Defendo minha abordagem, pois já está comprovada', score: 30, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Aceito testar a nova abordagem em paralelo', score: 80, moralLevel: 'conventional' },
      { value: 'C', label: 'Analiso objetivamente ambas e escolho a melhor', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Deixo o gestor decidir qual usar', score: 40, moralLevel: 'conventional' },
    ],
    difficulty: 'medium',
  },
  {
    dimensionCode: 'FL',
    questionType: 'scale',
    title: 'Abertura a Mudanças',
    question: 'Com que frequência você está aberto a mudar sua opinião quando apresentado a novos argumentos ou evidências?',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
    difficulty: 'easy',
  },
  {
    dimensionCode: 'FL',
    questionType: 'multiple_choice',
    title: 'Equilíbrio Princípios vs Adaptação',
    question: 'Como você equilibra manter seus princípios com a necessidade de se adaptar?',
    options: [
      { value: 'A', label: 'Meus princípios são inegociáveis em qualquer situação', score: 40, moralLevel: 'conventional' },
      { value: 'B', label: 'Adapto meus princípios conforme a situação exige', score: 20, moralLevel: 'pre_conventional' },
      { value: 'C', label: 'Mantenho princípios essenciais, mas flexibilizo métodos', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Sigo o que a maioria faz', score: 30, moralLevel: 'pre_conventional' },
    ],
    difficulty: 'hard',
  },

  // ============ AUTONOMIA (AU) ============
  {
    dimensionCode: 'AU',
    questionType: 'scenario',
    title: 'Decisão Independente',
    scenario: 'Você identifica um problema que precisa de solução urgente, mas seu gestor está indisponível. Você tem conhecimento para resolver, mas não é sua responsabilidade formal.',
    question: 'O que você faz?',
    options: [
      { value: 'A', label: 'Espero o gestor retornar para decidir', score: 30, moralLevel: 'conventional' },
      { value: 'B', label: 'Resolvo o problema e informo depois', score: 80, moralLevel: 'post_conventional' },
      { value: 'C', label: 'Documento o problema e aguardo instruções', score: 50, moralLevel: 'conventional' },
      { value: 'D', label: 'Passo o problema para outro colega', score: 20, moralLevel: 'pre_conventional' },
    ],
    difficulty: 'medium',
  },
  {
    dimensionCode: 'AU',
    questionType: 'scenario',
    title: 'Pressão do Grupo',
    scenario: 'Toda a equipe concorda com uma decisão que você acredita estar errada. O gestor pede sua opinião.',
    question: 'Como você se posiciona?',
    options: [
      { value: 'A', label: 'Concordo com a maioria para evitar conflito', score: 20, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Expresso minha discordância de forma respeitosa', score: 100, moralLevel: 'post_conventional' },
      { value: 'C', label: 'Fico em silêncio, mas documento minha posição', score: 40, moralLevel: 'conventional' },
      { value: 'D', label: 'Concordo na reunião, mas converso depois com o gestor', score: 50, moralLevel: 'conventional' },
    ],
    difficulty: 'hard',
  },
  {
    dimensionCode: 'AU',
    questionType: 'scale',
    title: 'Iniciativa Própria',
    question: 'Com que frequência você toma iniciativa para resolver problemas sem esperar que alguém peça?',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
    difficulty: 'easy',
  },
  {
    dimensionCode: 'AU',
    questionType: 'multiple_choice',
    title: 'Fonte de Motivação',
    question: 'O que mais motiva você a fazer um bom trabalho?',
    options: [
      { value: 'A', label: 'Reconhecimento e recompensas', score: 30, moralLevel: 'pre_conventional' },
      { value: 'B', label: 'Evitar críticas e punições', score: 10, moralLevel: 'pre_conventional' },
      { value: 'C', label: 'Satisfação pessoal de fazer bem feito', score: 100, moralLevel: 'post_conventional' },
      { value: 'D', label: 'Atender às expectativas dos outros', score: 50, moralLevel: 'conventional' },
    ],
    difficulty: 'easy',
  },
];

async function seedQuestions() {
  let connection;
  
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL não configurada');
      process.exit(1);
    }
    
    connection = await mysql.createConnection(databaseUrl);
    console.log('✅ Conectado ao banco de dados');

    // Buscar dimensões existentes
    const [dimensions] = await connection.execute(
      'SELECT id, code FROM pirIntegrityDimensions'
    );
    
    const dimensionMap = {};
    for (const dim of dimensions) {
      dimensionMap[dim.code] = dim.id;
    }
    
    console.log('📊 Dimensões encontradas:', Object.keys(dimensionMap).join(', '));

    // Verificar se as dimensões existem, senão criar
    const requiredDimensions = ['IP', 'ID', 'IC', 'ES', 'FL', 'AU'];
    const dimensionInfo = {
      IP: { name: 'Integridade Pessoal', description: 'Avalia a consistência entre valores pessoais e comportamentos' },
      ID: { name: 'Integridade Decisória', description: 'Avalia a qualidade ética das decisões tomadas' },
      IC: { name: 'Integridade Comportamental', description: 'Avalia a coerência entre discurso e ação' },
      ES: { name: 'Estabilidade', description: 'Avalia a consistência emocional e comportamental ao longo do tempo' },
      FL: { name: 'Flexibilidade', description: 'Avalia a capacidade de adaptação mantendo princípios éticos' },
      AU: { name: 'Autonomia', description: 'Avalia a capacidade de agir de forma independente e ética' },
    };

    let displayOrder = 1;
    for (const code of requiredDimensions) {
      if (!dimensionMap[code]) {
        console.log(`  Criando dimensão ${code}...`);
        const [result] = await connection.execute(
          `INSERT INTO pirIntegrityDimensions (code, name, description, weight, displayOrder, active) 
           VALUES (?, ?, ?, 100, ?, true)`,
          [code, dimensionInfo[code].name, dimensionInfo[code].description, displayOrder]
        );
        dimensionMap[code] = result.insertId;
        console.log(`  ✅ Dimensão ${code} criada com ID ${result.insertId}`);
      }
      displayOrder++;
    }

    // Inserir questões
    let questionsInserted = 0;
    let questionsSkipped = 0;
    let currentDisplayOrder = 200; // Começar após questões existentes

    for (const question of NEW_QUESTIONS) {
      const dimensionId = dimensionMap[question.dimensionCode];
      
      if (!dimensionId) {
        console.warn(`⚠️ Dimensão ${question.dimensionCode} não encontrada, pulando: ${question.title}`);
        questionsSkipped++;
        continue;
      }

      // Verificar se questão já existe (pelo título)
      const [existing] = await connection.execute(
        'SELECT id FROM pirIntegrityQuestions WHERE title = ? AND dimensionId = ?',
        [question.title, dimensionId]
      );

      if (existing.length > 0) {
        console.log(`  ⏭️ Questão já existe: ${question.title}`);
        questionsSkipped++;
        continue;
      }

      const optionsJson = question.options ? JSON.stringify(question.options) : null;
      const scaleLabelsJson = question.scaleLabels ? JSON.stringify(question.scaleLabels) : null;

      // Adicionar scoringCriteria para questões de escala
      let scoringCriteria = null;
      if (question.questionType === 'scale') {
        scoringCriteria = JSON.stringify({
          scaleMin: question.scaleMin || 1,
          scaleMax: question.scaleMax || 5,
          scaleLabels: question.scaleLabels || [],
        });
      }

      await connection.execute(
        `INSERT INTO pirIntegrityQuestions 
         (dimensionId, questionType, title, scenario, question, options, requiresJustification, difficulty, displayOrder, active, scoringCriteria)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?)`,
        [
          dimensionId,
          question.questionType,
          question.title,
          question.scenario || null,
          question.question,
          optionsJson,
          false,
          question.difficulty,
          currentDisplayOrder++,
          scoringCriteria,
        ]
      );

      questionsInserted++;
      console.log(`  ✅ Inserida: ${question.title} (${question.dimensionCode})`);
    }

    console.log(`\n🎉 Seed concluído!`);
    console.log(`   - ${questionsInserted} questões inseridas`);
    console.log(`   - ${questionsSkipped} questões puladas (já existiam)`);

    // Mostrar estatísticas finais
    const [stats] = await connection.execute(`
      SELECT d.code, d.name, COUNT(q.id) as total
      FROM pirIntegrityDimensions d
      LEFT JOIN pirIntegrityQuestions q ON d.id = q.dimensionId AND q.active = true
      GROUP BY d.id, d.code, d.name
      ORDER BY d.displayOrder
    `);

    console.log('\n📊 Questões por dimensão:');
    for (const row of stats) {
      console.log(`   ${row.code} (${row.name}): ${row.total} questões`);
    }

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔒 Conexão fechada');
    }
  }
}

// Executar
seedQuestions();
