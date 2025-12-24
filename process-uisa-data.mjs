import XLSX from 'xlsx';
import fs from 'fs';

// Processar arquivo de seções/departamentos
const secoesFile = '/home/ubuntu/upload/Cópiaderelaçãodeseções.xlsx';
const funcionariosFile = '/home/ubuntu/upload/funcionarios.xlsx';

console.log('📊 Processando dados UISA...\n');

// Ler seções
try {
  const workbookSecoes = XLSX.readFile(secoesFile);
  const sheetNameSecoes = workbookSecoes.SheetNames[0];
  const worksheetSecoes = workbookSecoes.Sheets[sheetNameSecoes];
  const secoesData = XLSX.utils.sheet_to_json(worksheetSecoes);
  
  console.log(`✅ Seções encontradas: ${secoesData.length}`);
  console.log('Primeiras 5 seções:');
  secoesData.slice(0, 5).forEach((s, i) => {
    console.log(`${i+1}. ${JSON.stringify(s)}`);
  });
  
  // Salvar JSON
  fs.writeFileSync('/tmp/uisa-secoes.json', JSON.stringify(secoesData, null, 2));
  console.log('\n✅ Arquivo salvo: /tmp/uisa-secoes.json\n');
} catch (err) {
  console.error('❌ Erro ao processar seções:', err.message);
}

// Ler funcionários
try {
  const workbookFunc = XLSX.readFile(funcionariosFile);
  const sheetNameFunc = workbookFunc.SheetNames[0];
  const worksheetFunc = workbookFunc.Sheets[sheetNameFunc];
  const funcData = XLSX.utils.sheet_to_json(worksheetFunc);
  
  console.log(`✅ Funcionários encontrados: ${funcData.length}`);
  console.log('Primeiros 5 funcionários:');
  funcData.slice(0, 5).forEach((f, i) => {
    console.log(`${i+1}. ${JSON.stringify(f)}`);
  });
  
  // Salvar JSON
  fs.writeFileSync('/tmp/uisa-funcionarios.json', JSON.stringify(funcData, null, 2));
  console.log('\n✅ Arquivo salvo: /tmp/uisa-funcionarios.json\n');
  
  // Estatísticas
  console.log('\n📈 Estatísticas:');
  console.log(`Total de funcionários: ${funcData.length}`);
  
  // Agrupar por departamento se houver campo
  const keys = Object.keys(funcData[0] || {});
  console.log(`Colunas encontradas: ${keys.join(', ')}`);
  
} catch (err) {
  console.error('❌ Erro ao processar funcionários:', err.message);
}
