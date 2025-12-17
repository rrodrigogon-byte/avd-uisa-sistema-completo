import mysql from 'mysql2/promise';

/**
 * Script para popular o banco com questões do PIR Integridade
 * Adiciona 25 questões variadas cobrindo diferentes dimensões
 */

const questions = [
  // Integridade Pessoal (dimensionId: 1)
  {
    dimensionId: 1,
    questionType: 'scenario',
    title: 'Honestidade em Relatórios',
    scenario: 'Você descobre um erro em um relatório que já foi enviado ao cliente, mas que favorece sua empresa financeiramente.',
    question: 'O que você faria?',
    options: JSON.stringify([
      { value: 'A', label: 'Não faria nada, pois o erro favorece a empresa', score: 1 },
      { value: 'B', label: 'Corrigiria apenas se alguém percebesse', score: 3 },
      { value: 'C', label: 'Informaria imediatamente e corrigiria o erro', score: 5 }
    ]),
    requiresJustification: true,
    difficulty: 'medium'
  },
  {
    dimensionId: 1,
    questionType: 'multiple_choice',
    title: 'Transparência Financeira',
    question: 'Como você lida com despesas pessoais em viagens de trabalho?',
    options: JSON.stringify([
      { value: 'A', label: 'Incluo algumas despesas pessoais no reembolso', score: 1 },
      { value: 'B', label: 'Separo claramente despesas pessoais e profissionais', score: 5 },
      { value: 'C', label: 'Depende do valor, pequenas despesas eu incluo', score: 2 }
    ]),
    difficulty: 'easy'
  },
  
  // Integridade nas Decisões (dimensionId: 2)
  {
    dimensionId: 2,
    questionType: 'scenario',
    title: 'Conflito de Interesses',
    scenario: 'Você precisa escolher um fornecedor e um dos candidatos é uma empresa de um amigo próximo que ofereceu condições especiais.',
    question: 'Como você procederia?',
    options: JSON.stringify([
      { value: 'A', label: 'Escolheria o amigo pelas condições especiais', score: 2 },
      { value: 'B', label: 'Avaliaria objetivamente todos os fornecedores', score: 5 },
      { value: 'C', label: 'Escolheria o amigo se as condições forem similares', score: 3 }
    ]),
    requiresJustification: true,
    difficulty: 'hard'
  },
  {
    dimensionId: 2,
    questionType: 'multiple_choice',
    title: 'Pressão por Resultados',
    question: 'Seu gestor pede para você aprovar um projeto que não atende todos os requisitos de qualidade, mas está dentro do prazo.',
    options: JSON.stringify([
      { value: 'A', label: 'Aprovaria para cumprir o prazo', score: 2 },
      { value: 'B', label: 'Recusaria e explicaria os riscos', score: 5 },
      { value: 'C', label: 'Aprovaria com ressalvas documentadas', score: 4 }
    ]),
    difficulty: 'medium'
  },

  // Integridade no Comportamento (dimensionId: 3)
  {
    dimensionId: 3,
    questionType: 'scenario',
    title: 'Confidencialidade',
    scenario: 'Um colega de outro departamento pergunta sobre informações confidenciais de um projeto que você está trabalhando.',
    question: 'Como você responderia?',
    options: JSON.stringify([
      { value: 'A', label: 'Compartilharia informações gerais', score: 3 },
      { value: 'B', label: 'Recusaria educadamente e explicaria a confidencialidade', score: 5 },
      { value: 'C', label: 'Compartilharia se confiar no colega', score: 2 }
    ]),
    requiresJustification: true,
    difficulty: 'medium'
  },
  {
    dimensionId: 3,
    questionType: 'multiple_choice',
    title: 'Uso de Recursos da Empresa',
    question: 'Como você vê o uso de recursos da empresa (internet, impressora, materiais) para fins pessoais?',
    options: JSON.stringify([
      { value: 'A', label: 'Aceitável se não atrapalhar o trabalho', score: 2 },
      { value: 'B', label: 'Inaceitável em qualquer circunstância', score: 5 },
      { value: 'C', label: 'Aceitável em pequenas quantidades', score: 3 }
    ]),
    difficulty: 'easy'
  },

  // Estabilidade Emocional (dimensionId: 4)
  {
    dimensionId: 4,
    questionType: 'scale',
    title: 'Controle Emocional',
    question: 'Em situações de alta pressão, consigo manter a calma e tomar decisões racionais.',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: JSON.stringify({
      1: 'Discordo totalmente',
      5: 'Concordo totalmente'
    }),
    difficulty: 'easy'
  },
  {
    dimensionId: 4,
    questionType: 'scenario',
    title: 'Gestão de Conflitos',
    scenario: 'Durante uma reunião importante, um colega critica publicamente seu trabalho de forma injusta.',
    question: 'Como você reagiria?',
    options: JSON.stringify([
      { value: 'A', label: 'Responderia na mesma intensidade', score: 2 },
      { value: 'B', label: 'Manteria a calma e pediria para discutir depois', score: 5 },
      { value: 'C', label: 'Ficaria em silêncio e guardaria ressentimento', score: 1 }
    ]),
    requiresJustification: true,
    difficulty: 'medium'
  },

  // Flexibilidade (dimensionId: 5)
  {
    dimensionId: 5,
    questionType: 'multiple_choice',
    title: 'Adaptação a Mudanças',
    question: 'Como você reage quando processos estabelecidos precisam ser mudados rapidamente?',
    options: JSON.stringify([
      { value: 'A', label: 'Resisto e prefiro manter o que funciona', score: 2 },
      { value: 'B', label: 'Adapto-me rapidamente e ajudo outros', score: 5 },
      { value: 'C', label: 'Aceito mas com dificuldade', score: 3 }
    ]),
    difficulty: 'easy'
  },
  {
    dimensionId: 5,
    questionType: 'scenario',
    title: 'Inovação vs Tradição',
    scenario: 'Sua equipe sempre usou um método tradicional, mas surge uma nova tecnologia que poderia melhorar os resultados.',
    question: 'Qual seria sua abordagem?',
    options: JSON.stringify([
      { value: 'A', label: 'Manteria o método tradicional por segurança', score: 2 },
      { value: 'B', label: 'Testaria a nova tecnologia em pequena escala', score: 5 },
      { value: 'C', label: 'Adotaria imediatamente a nova tecnologia', score: 4 }
    ]),
    requiresJustification: true,
    difficulty: 'medium'
  },

  // Autonomia (dimensionId: 6)
  {
    dimensionId: 6,
    questionType: 'scale',
    title: 'Iniciativa Própria',
    question: 'Costumo tomar iniciativas e resolver problemas sem precisar de supervisão constante.',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: JSON.stringify({
      1: 'Discordo totalmente',
      5: 'Concordo totalmente'
    }),
    difficulty: 'easy'
  },
  {
    dimensionId: 6,
    questionType: 'scenario',
    title: 'Decisão Independente',
    scenario: 'Você identifica um problema crítico fora do seu escopo, mas que precisa de ação imediata e seu gestor está indisponível.',
    question: 'O que você faria?',
    options: JSON.stringify([
      { value: 'A', label: 'Esperaria o gestor retornar', score: 2 },
      { value: 'B', label: 'Tomaria a iniciativa e informaria depois', score: 5 },
      { value: 'C', label: 'Consultaria outros colegas primeiro', score: 4 }
    ]),
    requiresJustification: true,
    difficulty: 'hard'
  },

  // Questões adicionais variadas
  {
    dimensionId: 1,
    questionType: 'scenario',
    title: 'Erro de Cobrança',
    scenario: 'Você nota que foi cobrado a menos em uma compra pessoal.',
    question: 'O que você faria?',
    options: JSON.stringify([
      { value: 'A', label: 'Não diria nada, o erro foi deles', score: 1 },
      { value: 'B', label: 'Avisaria sobre o erro', score: 5 },
      { value: 'C', label: 'Dependeria do valor', score: 2 }
    ]),
    difficulty: 'easy'
  },
  {
    dimensionId: 2,
    questionType: 'multiple_choice',
    title: 'Priorização Ética',
    question: 'Ao tomar decisões de negócio, qual fator você considera mais importante?',
    options: JSON.stringify([
      { value: 'A', label: 'Resultado financeiro', score: 2 },
      { value: 'B', label: 'Equilíbrio entre ética e resultados', score: 5 },
      { value: 'C', label: 'Conformidade com regras', score: 4 }
    ]),
    difficulty: 'medium'
  },
  {
    dimensionId: 3,
    questionType: 'scale',
    title: 'Cumprimento de Compromissos',
    question: 'Sempre cumpro meus compromissos e prazos, mesmo quando é difícil.',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: JSON.stringify({
      1: 'Raramente',
      5: 'Sempre'
    }),
    difficulty: 'easy'
  },
  {
    dimensionId: 4,
    questionType: 'multiple_choice',
    title: 'Feedback Negativo',
    question: 'Como você reage ao receber feedback negativo sobre seu trabalho?',
    options: JSON.stringify([
      { value: 'A', label: 'Fico defensivo e justificativo', score: 2 },
      { value: 'B', label: 'Ouço atentamente e busco melhorar', score: 5 },
      { value: 'C', label: 'Aceito mas me sinto desmotivado', score: 3 }
    ]),
    difficulty: 'medium'
  },
  {
    dimensionId: 5,
    questionType: 'scenario',
    title: 'Mudança de Função',
    scenario: 'Você é convidado para assumir uma nova função que exige habilidades diferentes das suas atuais.',
    question: 'Como você responderia?',
    options: JSON.stringify([
      { value: 'A', label: 'Recusaria por não ter as habilidades', score: 2 },
      { value: 'B', label: 'Aceitaria e me comprometeria a aprender', score: 5 },
      { value: 'C', label: 'Aceitaria mas com receio', score: 3 }
    ]),
    requiresJustification: true,
    difficulty: 'medium'
  },
  {
    dimensionId: 6,
    questionType: 'multiple_choice',
    title: 'Responsabilidade por Erros',
    question: 'Quando algo dá errado em um projeto de equipe, como você age?',
    options: JSON.stringify([
      { value: 'A', label: 'Assumo minha parte da responsabilidade', score: 5 },
      { value: 'B', label: 'Tento identificar quem errou', score: 2 },
      { value: 'C', label: 'Foco em resolver, não em culpar', score: 4 }
    ]),
    difficulty: 'easy'
  },
  {
    dimensionId: 1,
    questionType: 'scale',
    title: 'Honestidade em Situações Difíceis',
    question: 'Mesmo quando a verdade pode me prejudicar, prefiro ser honesto.',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: JSON.stringify({
      1: 'Discordo totalmente',
      5: 'Concordo totalmente'
    }),
    difficulty: 'medium'
  },
  {
    dimensionId: 2,
    questionType: 'scenario',
    title: 'Dilema Ético',
    scenario: 'Você descobre que um colega está violando políticas da empresa, mas ele é seu amigo e pode perder o emprego.',
    question: 'O que você faria?',
    options: JSON.stringify([
      { value: 'A', label: 'Não diria nada para proteger o amigo', score: 1 },
      { value: 'B', label: 'Conversaria com o amigo primeiro', score: 4 },
      { value: 'C', label: 'Reportaria à empresa imediatamente', score: 5 }
    ]),
    requiresJustification: true,
    difficulty: 'hard'
  },
  {
    dimensionId: 3,
    questionType: 'multiple_choice',
    title: 'Pontualidade',
    question: 'Com que frequência você chega no horário para compromissos de trabalho?',
    options: JSON.stringify([
      { value: 'A', label: 'Sempre no horário ou adiantado', score: 5 },
      { value: 'B', label: 'Geralmente no horário', score: 4 },
      { value: 'C', label: 'Frequentemente atrasado', score: 2 }
    ]),
    difficulty: 'easy'
  },
  {
    dimensionId: 4,
    questionType: 'scenario',
    title: 'Estresse e Desempenho',
    scenario: 'Você está sob grande pressão com múltiplos prazos apertados e sua equipe depende de você.',
    question: 'Como você gerenciaria a situação?',
    options: JSON.stringify([
      { value: 'A', label: 'Entraria em pânico e perderia produtividade', score: 2 },
      { value: 'B', label: 'Priorizaria tarefas e manteria a calma', score: 5 },
      { value: 'C', label: 'Pediria ajuda imediatamente', score: 4 }
    ]),
    requiresJustification: true,
    difficulty: 'medium'
  },
  {
    dimensionId: 5,
    questionType: 'scale',
    title: 'Abertura a Novas Ideias',
    question: 'Estou aberto a considerar perspectivas diferentes das minhas.',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: JSON.stringify({
      1: 'Raramente',
      5: 'Sempre'
    }),
    difficulty: 'easy'
  },
  {
    dimensionId: 6,
    questionType: 'scenario',
    title: 'Projeto Sem Diretrizes',
    scenario: 'Você recebe um projeto importante mas com poucas diretrizes e precisa definir a abordagem.',
    question: 'Como você procederia?',
    options: JSON.stringify([
      { value: 'A', label: 'Pediria diretrizes mais claras', score: 3 },
      { value: 'B', label: 'Definiria a abordagem e validaria depois', score: 5 },
      { value: 'C', label: 'Seguiria projetos similares anteriores', score: 4 }
    ]),
    requiresJustification: true,
    difficulty: 'hard'
  },
  {
    dimensionId: 1,
    questionType: 'multiple_choice',
    title: 'Informações Privilegiadas',
    question: 'Você tem acesso a informações privilegiadas que poderiam beneficiar amigos ou familiares. O que você faria?',
    options: JSON.stringify([
      { value: 'A', label: 'Compartilharia com pessoas próximas', score: 1 },
      { value: 'B', label: 'Manteria total confidencialidade', score: 5 },
      { value: 'C', label: 'Daria dicas sutis sem revelar detalhes', score: 2 }
    ]),
    difficulty: 'medium'
  }
];

async function seedQuestions() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada');
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('🌱 Iniciando população de questões do PIR Integridade...\n');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const question of questions) {
      try {
        await connection.query(
          `INSERT INTO pirIntegrityQuestions 
          (dimensionId, questionType, title, scenario, question, options, scaleMin, scaleMax, scaleLabels, requiresJustification, difficulty, displayOrder, active) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            question.dimensionId,
            question.questionType,
            question.title,
            question.scenario || null,
            question.question,
            question.options || null,
            question.scaleMin || null,
            question.scaleMax || null,
            question.scaleLabels || null,
            question.requiresJustification || false,
            question.difficulty,
            insertedCount,
            true
          ]
        );
        insertedCount++;
        console.log(`✓ Questão ${insertedCount}: ${question.title}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          skippedCount++;
        } else {
          console.error(`❌ Erro ao inserir questão "${question.title}":`, error.message);
        }
      }
    }

    console.log(`\n✅ População concluída!`);
    console.log(`   - ${insertedCount} questões inseridas`);
    console.log(`   - ${skippedCount} questões já existentes (puladas)`);

    // Verificar total
    const [result] = await connection.query('SELECT COUNT(*) as total FROM pirIntegrityQuestions WHERE active = 1');
    console.log(`   - Total de questões ativas: ${result[0].total}\n`);

  } catch (error) {
    console.error('❌ Erro ao popular questões:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedQuestions();
