#!/usr/bin/env node
/**
 * Parser de Descrições de Cargos UISA
 * Processa 481 arquivos .docx e extrai dados estruturados
 */

import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = '/home/ubuntu/upload/DESCRI├З├ХES';
const OUTPUT_FILE = path.join(__dirname, '../data/uisa-job-descriptions.json');

async function parseDocx(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message);
    return null;
  }
}

function extractStructuredData(text, filename) {
  const data = {
    filename,
    title: '',
    department: '',
    level: '',
    responsibilities: [],
    requirements: [],
    competencies: [],
    rawText: text,
  };

  // Extrair título do arquivo (ex: "ANALISTA DE RH.docx" -> "ANALISTA DE RH")
  data.title = filename.replace(/\.docx$/i, '').trim();

  // Padrões de extração
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // Identificar seções
  let currentSection = '';
  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes('responsabilidades') || lowerLine.includes('atribuições')) {
      currentSection = 'responsibilities';
    } else if (lowerLine.includes('requisitos') || lowerLine.includes('formação')) {
      currentSection = 'requirements';
    } else if (lowerLine.includes('competências') || lowerLine.includes('habilidades')) {
      currentSection = 'competencies';
    } else if (lowerLine.includes('departamento') || lowerLine.includes('área')) {
      // Extrair departamento
      const match = line.match(/(?:departamento|área)[:\s]+(.+)/i);
      if (match) data.department = match[1].trim();
    } else if (lowerLine.includes('nível') || lowerLine.includes('cargo')) {
      // Extrair nível
      const match = line.match(/(?:nível|cargo)[:\s]+(.+)/i);
      if (match) data.level = match[1].trim();
    } else {
      // Adicionar à seção atual
      if (currentSection === 'responsibilities' && line.length > 10) {
        data.responsibilities.push(line);
      } else if (currentSection === 'requirements' && line.length > 10) {
        data.requirements.push(line);
      } else if (currentSection === 'competencies' && line.length > 10) {
        data.competencies.push(line);
      }
    }
  }

  // Inferir departamento e nível do título se não encontrado
  if (!data.department) {
    if (data.title.includes('RH') || data.title.includes('RECURSOS HUMANOS')) {
      data.department = 'Recursos Humanos';
    } else if (data.title.includes('TI') || data.title.includes('TECNOLOGIA')) {
      data.department = 'Tecnologia da Informação';
    } else if (data.title.includes('FINANC') || data.title.includes('CONTAB')) {
      data.department = 'Financeiro';
    } else if (data.title.includes('COMERCIAL') || data.title.includes('VENDAS')) {
      data.department = 'Comercial';
    } else if (data.title.includes('OPERAC')) {
      data.department = 'Operações';
    } else {
      data.department = 'Geral';
    }
  }

  if (!data.level) {
    if (data.title.includes('DIRETOR') || data.title.includes('GERENTE')) {
      data.level = 'Liderança';
    } else if (data.title.includes('COORDENADOR') || data.title.includes('SUPERVISOR')) {
      data.level = 'Coordenação';
    } else if (data.title.includes('ANALISTA') || data.title.includes('ESPECIALISTA')) {
      data.level = 'Técnico';
    } else if (data.title.includes('ASSISTENTE') || data.title.includes('AUXILIAR')) {
      data.level = 'Operacional';
    } else {
      data.level = 'Não especificado';
    }
  }

  return data;
}

async function main() {
  console.log('🚀 Iniciando parser de descrições de cargos UISA...\n');

  try {
    // Verificar se diretório existe
    await fs.access(SOURCE_DIR);
  } catch (error) {
    console.error(`❌ Diretório ${SOURCE_DIR} não encontrado.`);
    process.exit(1);
  }

  // Listar todos os arquivos .docx
  const files = await fs.readdir(SOURCE_DIR);
  const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));

  console.log(`📄 Encontrados ${docxFiles.length} arquivos .docx\n`);

  const results = [];
  let processed = 0;
  let errors = 0;

  for (const file of docxFiles) {
    const filePath = path.join(SOURCE_DIR, file);
    console.log(`[${processed + 1}/${docxFiles.length}] Processando: ${file}`);

    const text = await parseDocx(filePath);
    if (text) {
      const data = extractStructuredData(text, file);
      results.push(data);
      processed++;
    } else {
      errors++;
    }
  }

  // Salvar resultados
  const outputDir = path.dirname(OUTPUT_FILE);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n✅ Processamento concluído!`);
  console.log(`   - Processados: ${processed}`);
  console.log(`   - Erros: ${errors}`);
  console.log(`   - Arquivo gerado: ${OUTPUT_FILE}`);

  // Estatísticas
  const stats = {
    total: results.length,
    byDepartment: {},
    byLevel: {},
  };

  results.forEach(r => {
    stats.byDepartment[r.department] = (stats.byDepartment[r.department] || 0) + 1;
    stats.byLevel[r.level] = (stats.byLevel[r.level] || 0) + 1;
  });

  console.log(`\n📊 Estatísticas:`);
  console.log(`   Departamentos:`, stats.byDepartment);
  console.log(`   Níveis:`, stats.byLevel);
}

main().catch(console.error);
