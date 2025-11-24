import mammoth from "mammoth";

/**
 * Interface para dados extraídos de um arquivo .docx de descrição de cargo
 */
export interface ParsedJobDescription {
  // Informações Básicas
  cargo?: string;
  departamento?: string;
  cbo?: string;
  divisao?: string;
  reporteA?: string;
  dataRevisao?: string;
  
  // Objetivo Principal
  objetivoPrincipal?: string;
  
  // Responsabilidades (por categoria)
  responsabilidades?: {
    processo?: string[];
    analiseKPI?: string[];
    planejamento?: string[];
    budget?: string[];
    resultados?: string[];
  };
  
  // Conhecimento Técnico
  conhecimentos?: Array<{
    conhecimento: string;
    nivel: "basico" | "intermediario" | "avancado" | "obrigatorio";
  }>;
  
  // Treinamento Obrigatório
  treinamentos?: string[];
  
  // Competências/Habilidades
  competencias?: string[];
  
  // Qualificação Desejada
  qualificacao?: {
    formacao?: string;
    experiencia?: string;
  };
  
  // e-Social
  eSocial?: {
    pcmso?: string;
    ppra?: string;
  };
  
  // Metadados
  fileName?: string;
  parseErrors?: string[];
}

/**
 * Extrai texto de um arquivo .docx usando mammoth
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Erro ao extrair texto do .docx: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extrai HTML de um arquivo .docx usando mammoth (preserva formatação)
 */
export async function extractHtmlFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.convertToHtml({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Erro ao extrair HTML do .docx: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parser principal: extrai dados estruturados de um arquivo .docx de descrição de cargo
 */
export async function parseJobDescriptionDocx(buffer: Buffer, fileName: string): Promise<ParsedJobDescription> {
  const errors: string[] = [];
  const parsed: ParsedJobDescription = {
    fileName,
    parseErrors: errors,
  };
  
  try {
    // Extrair texto bruto
    const text = await extractTextFromDocx(buffer);
    
    // Dividir em linhas para análise
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // 1. Extrair Informações Básicas
    parsed.cargo = extractField(lines, /^cargo[:\s]+(.+)/i);
    parsed.departamento = extractField(lines, /^depart[ao]mento[:\s]+(.+)/i);
    parsed.cbo = extractField(lines, /^cbo[:\s]+(.+)/i);
    parsed.divisao = extractField(lines, /^divis[ãa]o[:\s]+(.+)/i);
    parsed.reporteA = extractField(lines, /^reporte\s+a[:\s]+(.+)/i);
    parsed.dataRevisao = extractField(lines, /^data\s+de\s+revis[ãa]o[:\s]+(.+)/i);
    
    // 2. Extrair Objetivo Principal
    const objetivoIdx = findSectionIndex(lines, /objetivo\s+principal/i);
    if (objetivoIdx !== -1) {
      parsed.objetivoPrincipal = extractSectionContent(lines, objetivoIdx);
    }
    
    // 3. Extrair Responsabilidades
    const respIdx = findSectionIndex(lines, /responsabilidades/i);
    if (respIdx !== -1) {
      parsed.responsabilidades = {
        processo: extractListItems(lines, respIdx, /processo/i),
        analiseKPI: extractListItems(lines, respIdx, /an[aá]lise\s+de\s+kpi/i),
        planejamento: extractListItems(lines, respIdx, /planejamento/i),
        budget: extractListItems(lines, respIdx, /budget|or[çc]amento/i),
        resultados: extractListItems(lines, respIdx, /resultados/i),
      };
    }
    
    // 4. Extrair Conhecimentos Técnicos
    const conhecIdx = findSectionIndex(lines, /conhecimento\s+t[eé]cnico/i);
    if (conhecIdx !== -1) {
      parsed.conhecimentos = extractKnowledgeItems(lines, conhecIdx);
    }
    
    // 5. Extrair Treinamentos Obrigatórios
    const treinIdx = findSectionIndex(lines, /treinamento\s+obrigat[óo]rio/i);
    if (treinIdx !== -1) {
      parsed.treinamentos = extractListItems(lines, treinIdx);
    }
    
    // 6. Extrair Competências/Habilidades
    const compIdx = findSectionIndex(lines, /compet[êe]ncias|habilidades/i);
    if (compIdx !== -1) {
      parsed.competencias = extractListItems(lines, compIdx);
    }
    
    // 7. Extrair Qualificação Desejada
    const qualIdx = findSectionIndex(lines, /qualifica[çc][ãa]o\s+desejada/i);
    if (qualIdx !== -1) {
      parsed.qualificacao = {
        formacao: extractField(lines, /forma[çc][ãa]o[:\s]+(.+)/i, qualIdx),
        experiencia: extractField(lines, /experi[êe]ncia[:\s]+(.+)/i, qualIdx),
      };
    }
    
    // 8. Extrair e-Social
    const eSocialIdx = findSectionIndex(lines, /e-social/i);
    if (eSocialIdx !== -1) {
      parsed.eSocial = {
        pcmso: extractField(lines, /pcmso[:\s]+(.+)/i, eSocialIdx),
        ppra: extractField(lines, /ppra[:\s]+(.+)/i, eSocialIdx),
      };
    }
    
  } catch (error) {
    errors.push(`Erro geral no parsing: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return parsed;
}

/**
 * Funções auxiliares de parsing
 */

function extractField(lines: string[], pattern: RegExp, startIdx = 0): string | undefined {
  for (let i = startIdx; i < lines.length; i++) {
    const match = lines[i].match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function findSectionIndex(lines: string[], pattern: RegExp): number {
  return lines.findIndex(line => pattern.test(line));
}

function extractSectionContent(lines: string[], startIdx: number, maxLines = 10): string {
  const content: string[] = [];
  for (let i = startIdx + 1; i < Math.min(startIdx + maxLines, lines.length); i++) {
    // Parar se encontrar outra seção (linhas em maiúsculas ou com padrões de título)
    if (lines[i].match(/^[A-ZÁÉÍÓÚÂÊÔÃÕ\s]+$/) || lines[i].match(/^\d+\./)) {
      break;
    }
    content.push(lines[i]);
  }
  return content.join(' ').trim();
}

function extractListItems(lines: string[], startIdx: number, categoryPattern?: RegExp): string[] {
  const items: string[] = [];
  let inCategory = !categoryPattern; // Se não tem padrão de categoria, aceita tudo
  
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Parar se encontrar outra seção principal
    if (line.match(/^[A-ZÁÉÍÓÚÂÊÔÃÕ\s]{10,}$/)) {
      break;
    }
    
    // Verificar se entrou na categoria desejada
    if (categoryPattern && categoryPattern.test(line)) {
      inCategory = true;
      continue;
    }
    
    // Verificar se saiu da categoria (encontrou outra categoria)
    if (categoryPattern && line.match(/^[A-Z][a-záéíóúâêôãõ\s]+:$/i)) {
      inCategory = false;
      continue;
    }
    
    // Extrair itens de lista (começam com -, •, *, ou números)
    if (inCategory && line.match(/^[-•*\d]+[\.\)]\s+(.+)/)) {
      const match = line.match(/^[-•*\d]+[\.\)]\s+(.+)/);
      if (match && match[1]) {
        items.push(match[1].trim());
      }
    }
  }
  
  return items;
}

function extractKnowledgeItems(lines: string[], startIdx: number): Array<{ conhecimento: string; nivel: "basico" | "intermediario" | "avancado" | "obrigatorio" }> {
  const items: Array<{ conhecimento: string; nivel: "basico" | "intermediario" | "avancado" | "obrigatorio" }> = [];
  
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Parar se encontrar outra seção
    if (line.match(/^[A-ZÁÉÍÓÚÂÊÔÃÕ\s]{10,}$/)) {
      break;
    }
    
    // Tentar extrair conhecimento e nível
    const match = line.match(/^[-•*\d]+[\.\)]\s+(.+?)\s*[-–—]\s*(b[aá]sico|intermedi[aá]rio|avan[çc]ado|obrigat[óo]rio)/i);
    if (match) {
      const conhecimento = match[1].trim();
      let nivel: "basico" | "intermediario" | "avancado" | "obrigatorio" = "basico";
      
      const nivelStr = match[2].toLowerCase();
      if (nivelStr.includes("intermedi")) nivel = "intermediario";
      else if (nivelStr.includes("avan")) nivel = "avancado";
      else if (nivelStr.includes("obrigat")) nivel = "obrigatorio";
      
      items.push({ conhecimento, nivel });
    }
  }
  
  return items;
}

/**
 * Valida se os dados extraídos estão completos
 */
export function validateParsedData(parsed: ParsedJobDescription): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  if (!parsed.cargo) missingFields.push("Cargo");
  if (!parsed.departamento) missingFields.push("Departamento");
  if (!parsed.objetivoPrincipal) missingFields.push("Objetivo Principal");
  if (!parsed.responsabilidades || Object.values(parsed.responsabilidades).every(r => !r || r.length === 0)) {
    missingFields.push("Responsabilidades");
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
