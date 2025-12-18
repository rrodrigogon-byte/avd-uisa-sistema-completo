import mysql from 'mysql2/promise';

/**
 * Script para adicionar vídeos a questões PIR existentes
 * Adiciona vídeos educacionais sobre ética e integridade a algumas questões
 */

// URLs de vídeos de exemplo (vídeos educacionais sobre ética e integridade)
const exampleVideos = [
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: 180 // 3 minutos
  },
  {
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    duration: 240 // 4 minutos
  },
  {
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
    duration: 300 // 5 minutos
  },
  {
    url: 'https://www.youtube.com/watch?v=yFE6qQ3ySXE',
    thumbnail: 'https://img.youtube.com/vi/yFE6qQ3ySXE/maxresdefault.jpg',
    duration: 210 // 3.5 minutos
  },
  {
    url: 'https://www.youtube.com/watch?v=3fumBcKC6RE',
    thumbnail: 'https://img.youtube.com/vi/3fumBcKC6RE/maxresdefault.jpg',
    duration: 270 // 4.5 minutos
  }
];

async function addVideosToPIRQuestions() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🎬 Iniciando adição de vídeos às questões PIR...\n');
    
    // 1. Buscar questões PIR existentes que não têm vídeo
    const [questions] = await connection.execute(
      `SELECT id, dimensionId, title 
       FROM pirIntegrityQuestions 
       WHERE videoUrl IS NULL 
       AND active = 1
       ORDER BY dimensionId, displayOrder
       LIMIT 50`
    );
    
    console.log(`✅ Encontradas ${questions.length} questões sem vídeo\n`);
    
    if (questions.length === 0) {
      console.log('ℹ️  Todas as questões já possuem vídeos ou não há questões disponíveis');
      return;
    }
    
    // 2. Adicionar vídeos a 10% das questões (distribuídas entre dimensões)
    const questionsToUpdate = [];
    const dimensionGroups = {};
    
    // Agrupar questões por dimensão
    questions.forEach(q => {
      if (!dimensionGroups[q.dimensionId]) {
        dimensionGroups[q.dimensionId] = [];
      }
      dimensionGroups[q.dimensionId].push(q);
    });
    
    // Selecionar 1-2 questões por dimensão para adicionar vídeo
    let videoIndex = 0;
    for (const [dimensionId, dimQuestions] of Object.entries(dimensionGroups)) {
      const numVideos = Math.min(2, Math.ceil(dimQuestions.length * 0.1));
      
      for (let i = 0; i < numVideos && i < dimQuestions.length; i++) {
        const question = dimQuestions[i];
        const video = exampleVideos[videoIndex % exampleVideos.length];
        
        questionsToUpdate.push({
          id: question.id,
          title: question.title,
          dimensionId: question.dimensionId,
          video
        });
        
        videoIndex++;
      }
    }
    
    console.log(`📹 Adicionando vídeos a ${questionsToUpdate.length} questões...\n`);
    
    // 3. Atualizar questões com vídeos
    for (const item of questionsToUpdate) {
      await connection.execute(
        `UPDATE pirIntegrityQuestions 
         SET videoUrl = ?, 
             videoThumbnailUrl = ?, 
             videoDuration = ?,
             requiresVideoWatch = 1
         WHERE id = ?`,
        [item.video.url, item.video.thumbnail, item.video.duration, item.id]
      );
      
      console.log(`  ✅ Vídeo adicionado à questão #${item.id}: "${item.title}"`);
      console.log(`     📺 ${item.video.url}`);
      console.log(`     ⏱️  Duração: ${Math.floor(item.video.duration / 60)}:${(item.video.duration % 60).toString().padStart(2, '0')}\n`);
    }
    
    console.log(`\n🎉 Processo concluído!`);
    console.log(`📊 Total de questões atualizadas: ${questionsToUpdate.length}`);
    console.log(`📹 Vídeos únicos utilizados: ${Math.min(questionsToUpdate.length, exampleVideos.length)}`);
    
  } catch (error) {
    console.error('❌ Erro ao adicionar vídeos:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar script
addVideosToPIRQuestions()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução:', error);
    process.exit(1);
  });
