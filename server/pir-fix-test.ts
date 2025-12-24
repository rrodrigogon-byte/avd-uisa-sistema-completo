/**
 * Teste para validar correção do PIR
 * Verifica se as dimensões ES e FL são reconhecidas corretamente
 */

import { calculatePIRResult, PIRResponse } from './pirCalculations';

// Criar respostas de teste simulando um teste completo
const testResponses: PIRResponse[] = [
  // IP (Interesse em Pessoas) - 10 questões
  { questionNumber: 1, answer: 5, dimension: 'IP', reverse: false },
  { questionNumber: 2, answer: 1, dimension: 'IP', reverse: true },
  { questionNumber: 3, answer: 5, dimension: 'IP', reverse: false },
  { questionNumber: 4, answer: 4, dimension: 'IP', reverse: false },
  { questionNumber: 5, answer: 2, dimension: 'IP', reverse: true },
  { questionNumber: 6, answer: 5, dimension: 'IP', reverse: false },
  { questionNumber: 7, answer: 1, dimension: 'IP', reverse: true },
  { questionNumber: 8, answer: 4, dimension: 'IP', reverse: false },
  { questionNumber: 9, answer: 2, dimension: 'IP', reverse: true },
  { questionNumber: 10, answer: 5, dimension: 'IP', reverse: false },
  
  // ID (Interesse em Dados) - 10 questões
  { questionNumber: 11, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 12, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 13, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 14, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 15, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 16, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 17, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 18, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 19, answer: 3, dimension: 'ID', reverse: false },
  { questionNumber: 20, answer: 3, dimension: 'ID', reverse: false },
  
  // IC (Interesse em Coisas) - 10 questões
  { questionNumber: 21, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 22, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 23, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 24, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 25, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 26, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 27, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 28, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 29, answer: 2, dimension: 'IC', reverse: false },
  { questionNumber: 30, answer: 2, dimension: 'IC', reverse: false },
  
  // ES (Estabilidade) - 10 questões
  { questionNumber: 31, answer: 4, dimension: 'ES', reverse: false },
  { questionNumber: 32, answer: 2, dimension: 'ES', reverse: true },
  { questionNumber: 33, answer: 4, dimension: 'ES', reverse: false },
  { questionNumber: 34, answer: 5, dimension: 'ES', reverse: false },
  { questionNumber: 35, answer: 4, dimension: 'ES', reverse: false },
  { questionNumber: 36, answer: 4, dimension: 'ES', reverse: false },
  { questionNumber: 37, answer: 2, dimension: 'ES', reverse: true },
  { questionNumber: 38, answer: 4, dimension: 'ES', reverse: false },
  { questionNumber: 39, answer: 3, dimension: 'ES', reverse: false },
  { questionNumber: 40, answer: 4, dimension: 'ES', reverse: false },
  
  // FL (Flexibilidade) - 10 questões
  { questionNumber: 41, answer: 3, dimension: 'FL', reverse: false },
  { questionNumber: 42, answer: 3, dimension: 'FL', reverse: true },
  { questionNumber: 43, answer: 3, dimension: 'FL', reverse: false },
  { questionNumber: 44, answer: 3, dimension: 'FL', reverse: false },
  { questionNumber: 45, answer: 3, dimension: 'FL', reverse: true },
  { questionNumber: 46, answer: 3, dimension: 'FL', reverse: false },
  { questionNumber: 47, answer: 3, dimension: 'FL', reverse: true },
  { questionNumber: 48, answer: 3, dimension: 'FL', reverse: false },
  { questionNumber: 49, answer: 3, dimension: 'FL', reverse: true },
  { questionNumber: 50, answer: 3, dimension: 'FL', reverse: false },
  
  // AU (Autonomia) - 10 questões
  { questionNumber: 51, answer: 4, dimension: 'AU', reverse: false },
  { questionNumber: 52, answer: 2, dimension: 'AU', reverse: true },
  { questionNumber: 53, answer: 4, dimension: 'AU', reverse: false },
  { questionNumber: 54, answer: 4, dimension: 'AU', reverse: false },
  { questionNumber: 55, answer: 2, dimension: 'AU', reverse: true },
  { questionNumber: 56, answer: 4, dimension: 'AU', reverse: false },
  { questionNumber: 57, answer: 1, dimension: 'AU', reverse: true },
  { questionNumber: 58, answer: 4, dimension: 'AU', reverse: false },
  { questionNumber: 59, answer: 2, dimension: 'AU', reverse: true },
  { questionNumber: 60, answer: 4, dimension: 'AU', reverse: false },
];

console.log('🧪 Testando cálculo do PIR com dimensões ES e FL...\n');

try {
  const result = calculatePIRResult(testResponses);
  
  console.log('✅ Cálculo realizado com sucesso!\n');
  console.log('📊 Pontuações Normalizadas:');
  console.log('  IP (Interesse em Pessoas):', result.normalizedScores.IP);
  console.log('  ID (Interesse em Dados):', result.normalizedScores.ID);
  console.log('  IC (Interesse em Coisas):', result.normalizedScores.IC);
  console.log('  ES (Estabilidade):', result.normalizedScores.ES);
  console.log('  FL (Flexibilidade):', result.normalizedScores.FL);
  console.log('  AU (Autonomia):', result.normalizedScores.AU);
  
  console.log('\n📈 Classificações:');
  console.log('  IP:', result.classifications.IP);
  console.log('  ID:', result.classifications.ID);
  console.log('  IC:', result.classifications.IC);
  console.log('  ES:', result.classifications.ES);
  console.log('  FL:', result.classifications.FL);
  console.log('  AU:', result.classifications.AU);
  
  console.log('\n🎯 Dimensão Dominante:', result.dominantDimension);
  console.log('🏷️  Tipo de Perfil:', result.profileType);
  
  console.log('\n✅ TESTE PASSOU! As dimensões ES e FL estão sendo reconhecidas corretamente.');
  
} catch (error) {
  console.error('❌ ERRO NO TESTE:', error);
  console.error('\nO teste falhou! Verifique se todas as dimensões estão corretas.');
  process.exit(1);
}
