import mysql from 'mysql2/promise';

/**
 * Script para popular templates de metas por competência
 * Cria templates pré-definidos para cada nível de gap (crítico, alto, médio, baixo)
 */

// Templates de metas por nível de gap
const templatesByGapLevel = {
  critico: {
    timeframe: '1-2 meses',
    priority: 'alta',
    templates: [
      {
        title: 'Desenvolvimento Intensivo em {competency}',
        description: 'Programa acelerado de desenvolvimento focado em eliminar gap crítico na competência de {competency}. Inclui treinamento intensivo, mentoria dedicada e aplicação prática imediata.',
        suggestedActions: [
          'Participar de treinamento intensivo (mínimo 40 horas)',
          'Trabalhar com mentor especializado (sessões semanais)',
          'Aplicar conhecimentos em projeto real com supervisão',
          'Realizar auto-avaliações semanais de progresso',
          'Apresentar resultados ao final do período'
        ],
        suggestedResources: [
          'Curso intensivo presencial ou online',
          'Mentoria individual com especialista',
          'Material de referência e estudos de caso',
          'Ferramentas e softwares necessários',
          'Tempo dedicado para prática (mínimo 2h/dia)'
        ],
        successCriteria: [
          'Demonstrar competência em situações reais',
          'Aprovação em avaliação prática',
          'Feedback positivo de mentor e supervisor',
          'Melhoria de pelo menos 50% na próxima avaliação',
          'Capacidade de treinar outros na competência'
        ]
      }
    ]
  },
  alto: {
    timeframe: '2-3 meses',
    priority: 'alta',
    templates: [
      {
        title: 'Programa Estruturado de {competency}',
        description: 'Desenvolvimento estruturado para reduzir gap alto em {competency} através de combinação de teoria, prática e acompanhamento regular.',
        suggestedActions: [
          'Completar curso ou certificação relevante',
          'Participar de workshops práticos',
          'Trabalhar em projetos que exijam a competência',
          'Buscar feedback regular de supervisor',
          'Estudar casos de sucesso e melhores práticas'
        ],
        suggestedResources: [
          'Curso online ou presencial (20-30 horas)',
          'Livros e artigos especializados',
          'Comunidades de prática',
          'Ferramentas e templates',
          'Tempo semanal dedicado (5-8 horas)'
        ],
        successCriteria: [
          'Conclusão de curso ou certificação',
          'Aplicação bem-sucedida em 2-3 projetos',
          'Feedback positivo de stakeholders',
          'Melhoria de 40% na próxima avaliação',
          'Autonomia crescente na competência'
        ]
      }
    ]
  },
  medio: {
    timeframe: '3-4 meses',
    priority: 'media',
    templates: [
      {
        title: 'Aprimoramento Contínuo em {competency}',
        description: 'Desenvolvimento gradual para fechar gap médio em {competency}, focando em refinamento e expansão de conhecimentos existentes.',
        suggestedActions: [
          'Participar de treinamentos específicos',
          'Buscar oportunidades de aplicação prática',
          'Estudar materiais complementares',
          'Trocar experiências com pares',
          'Documentar aprendizados e progressos'
        ],
        suggestedResources: [
          'Cursos online e webinars',
          'Artigos e publicações do setor',
          'Grupos de estudo ou comunidades',
          'Projetos de aplicação prática',
          'Tempo semanal dedicado (3-5 horas)'
        ],
        successCriteria: [
          'Aplicação consistente da competência',
          'Feedback positivo em avaliações',
          'Melhoria de 30% na próxima avaliação',
          'Confiança aumentada na execução',
          'Capacidade de orientar colegas'
        ]
      }
    ]
  },
  baixo: {
    timeframe: '4-6 meses',
    priority: 'baixa',
    templates: [
      {
        title: 'Refinamento e Excelência em {competency}',
        description: 'Desenvolvimento focado em alcançar excelência em {competency}, transformando competência boa em excepcional.',
        suggestedActions: [
          'Buscar certificações avançadas',
          'Participar de conferências e eventos',
          'Liderar projetos desafiadores',
          'Mentorar outros profissionais',
          'Contribuir com inovações na área'
        ],
        suggestedResources: [
          'Certificações avançadas',
          'Conferências e eventos do setor',
          'Networking com especialistas',
          'Projetos de liderança',
          'Tempo para inovação e pesquisa'
        ],
        successCriteria: [
          'Reconhecimento como referência',
          'Certificações avançadas obtidas',
          'Liderança em projetos complexos',
          'Melhoria de 20% na próxima avaliação',
          'Contribuições significativas para a equipe'
        ]
      }
    ]
  }
};

async function seedGoalTemplates() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🎯 Iniciando seed de templates de metas...\n');
    
    // 1. Buscar competências existentes
    const [competencies] = await connection.execute(
      'SELECT id, name, description FROM competencies WHERE active = 1'
    );
    
    console.log(`✅ Encontradas ${competencies.length} competências ativas\n`);
    
    if (competencies.length === 0) {
      console.log('⚠️  Nenhuma competência encontrada. Execute o seed de competências primeiro.');
      return;
    }
    
    let totalInserted = 0;
    
    // 2. Para cada competência, criar templates para cada nível de gap
    for (const competency of competencies) {
      console.log(`📝 Criando templates para: ${competency.name}`);
      
      for (const [gapLevel, config] of Object.entries(templatesByGapLevel)) {
        for (const template of config.templates) {
          // Substituir placeholder {competency} pelo nome da competência
          const title = template.title.replace('{competency}', competency.name);
          const description = template.description.replace(/{competency}/g, competency.name);
          
          await connection.execute(
            `INSERT INTO goalTemplates 
             (categoryId, name, description, targetType, suggestedDurationMonths, difficultyLevel, active, createdBy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              competency.id, // categoryId (usando competency.id como categoria)
              title, // name
              description, // description
              'tecnica', // targetType (padrão)
              gapLevel === 'critico' ? 2 : gapLevel === 'alto' ? 3 : gapLevel === 'medio' ? 4 : 6, // suggestedDurationMonths
              gapLevel === 'critico' || gapLevel === 'alto' ? 'avancado' : gapLevel === 'medio' ? 'intermediario' : 'basico', // difficultyLevel
              true, // active
              1 // createdBy (admin padrão)
            ]
          );
          
          totalInserted++;
        }
      }
      
      console.log(`  ✅ 4 templates criados (crítico, alto, médio, baixo)`);
    }
    
    console.log(`\n🎉 Seed concluído!`);
    console.log(`📊 Total de templates criados: ${totalInserted}`);
    console.log(`📈 Distribuição: ${competencies.length} competências × 4 níveis de gap`);
    
    // 3. Verificar resultado
    const [result] = await connection.execute(
      'SELECT COUNT(*) as total FROM goalTemplates'
    );
    console.log(`✅ Templates no banco: ${result[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar seed
seedGoalTemplates()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução:', error);
    process.exit(1);
  });
