/**
 * Parser para arquivos PDI em múltiplos formatos (.txt, .html, .pdf)
 * Extrai informações estruturadas de Planos de Desenvolvimento Individual
 */

import * as cheerio from 'cheerio';

export interface ParsedPDI {
  employeeName: string;
  position: string;
  department?: string;
  sponsor?: string;
  focus?: string;
  durationMonths?: number;
  
  // KPIs e métricas
  technicalExcellence?: string;
  leadership?: string;
  immediateIncentive?: string;
  planDuration?: string;
  
  // Competências
  competencies?: Array<{
    name: string;
    description: string;
  }>;
  
  // Trilha de remuneração
  salaryPath?: Array<{
    level: string;
    deadline: string;
    trigger: string;
    projectedSalary: string;
    positionInRange: string;
  }>;
  
  // Plano de ação (70-20-10)
  actionPlan?: {
    practice70?: string[];
    social20?: string[];
    formal10?: string[];
  };
  
  // Pacto de responsabilidades
  responsibilities?: {
    employee?: string[];
    leadership?: string[];
    hr?: string[];
  };
  
  // Gaps de competências
  competencyGaps?: Array<{
    type: string;
    currentLevel: string;
    targetLevel: string;
    description: string;
  }>;
  
  // Riscos
  risks?: Array<{
    type: string;
    description: string;
    mitigation: string;
  }>;
  
  // Dados brutos para referência
  rawContent: string;
}

/**
 * Parser para arquivos HTML de PDI
 */
export function parseHTMLPDI(htmlContent: string): ParsedPDI {
  const $ = cheerio.load(htmlContent);
  
  const result: ParsedPDI = {
    employeeName: '',
    position: '',
    rawContent: htmlContent
  };
  
  // Extrair nome do funcionário
  const nameElement = $('h2.text-2xl.font-bold.text-uisa-blue, .text-xl.text-gray-600, h1 + p.text-xl');
  if (nameElement.length > 0) {
    result.employeeName = nameElement.first().text().trim();
  }
  
  // Extrair cargo
  const positionElement = $('p.text-md.text-uisa-orange.font-semibold, .text-uisa-orange');
  if (positionElement.length > 0) {
    result.position = positionElement.first().text().trim();
  }
  
  // Extrair foco do desenvolvimento
  const focusElement = $('p:contains("Foco do Desenvolvimento:")');
  if (focusElement.length > 0) {
    const focusText = focusElement.text();
    const match = focusText.match(/Foco do Desenvolvimento:\s*(.+?)(?:\n|$)/);
    if (match) {
      result.focus = match[1].trim();
    }
  }
  
  // Extrair sponsor/diretor
  const sponsorElement = $('p:contains("Diretor Sponsor:"), p:contains("Sponsor:")');
  if (sponsorElement.length > 0) {
    const sponsorText = sponsorElement.text();
    const match = sponsorText.match(/(?:Diretor )?Sponsor:\s*(.+?)(?:\n|$)/);
    if (match) {
      result.sponsor = match[1].trim();
    }
  }
  
  // Extrair KPIs
  const kpiCards = $('.kpi-card');
  kpiCards.each((i, elem) => {
    const label = $(elem).find('p.text-sm').text().trim();
    const value = $(elem).find('p.text-lg, p.text-xl').text().trim();
    
    if (label.includes('Excelência Técnica') || label.includes('Técnica')) {
      result.technicalExcellence = value;
    } else if (label.includes('Liderança')) {
      result.leadership = value;
    } else if (label.includes('Incentivo')) {
      result.immediateIncentive = value;
    } else if (label.includes('Plano') || label.includes('Performance')) {
      result.planDuration = value;
      const monthsMatch = value.match(/(\d+)\s*meses?/i);
      if (monthsMatch) {
        result.durationMonths = parseInt(monthsMatch[1]);
      }
    }
  });
  
  // Extrair competências-chave
  result.competencies = [];
  const competencyList = $('ul li:has(strong)');
  competencyList.each((i, elem) => {
    const text = $(elem).text().trim();
    const parts = text.split(':');
    if (parts.length >= 2) {
      result.competencies!.push({
        name: parts[0].replace(/\*\*/g, '').trim(),
        description: parts.slice(1).join(':').trim()
      });
    }
  });
  
  // Extrair trilha de remuneração
  result.salaryPath = [];
  const salaryRows = $('table tbody tr');
  salaryRows.each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 5) {
      result.salaryPath!.push({
        level: $(cells[0]).text().trim(),
        deadline: $(cells[1]).text().trim(),
        trigger: $(cells[2]).text().trim(),
        projectedSalary: $(cells[3]).text().trim(),
        positionInRange: $(cells[4]).text().trim()
      });
    }
  });
  
  // Extrair plano de ação 70-20-10
  result.actionPlan = {
    practice70: [],
    social20: [],
    formal10: []
  };
  
  $('p:contains("70%"), p:contains("70 %")').next('ul').find('li').each((i, elem) => {
    result.actionPlan!.practice70!.push($(elem).text().trim());
  });
  
  $('p:contains("20%"), p:contains("20 %")').next('ul').find('li').each((i, elem) => {
    result.actionPlan!.social20!.push($(elem).text().trim());
  });
  
  $('p:contains("10%"), p:contains("10 %")').next('ul').find('li').each((i, elem) => {
    result.actionPlan!.formal10!.push($(elem).text().trim());
  });
  
  // Extrair responsabilidades
  result.responsibilities = {
    employee: [],
    leadership: [],
    hr: []
  };
  
  $('p:contains("Responsabilidades")').each((i, elem) => {
    const text = $(elem).text();
    const nextList = $(elem).next('ul');
    
    if (text.includes('Protagonista') || text.includes('Fernando') || text.includes('Wilson')) {
      nextList.find('li').each((j, li) => {
        result.responsibilities!.employee!.push($(li).text().trim());
      });
    } else if (text.includes('Liderança') || text.includes('Sponsor')) {
      nextList.find('li').each((j, li) => {
        result.responsibilities!.leadership!.push($(li).text().trim());
      });
    } else if (text.includes('DHO') || text.includes('Guardião') || text.includes('DGC')) {
      nextList.find('li').each((j, li) => {
        result.responsibilities!.hr!.push($(li).text().trim());
      });
    }
  });
  
  return result;
}

/**
 * Parser para arquivos TXT de PDI
 * Nota: Arquivos .txt fornecidos são na verdade HTML, então usamos o mesmo parser
 */
export function parseTXTPDI(txtContent: string): ParsedPDI {
  // Verificar se o conteúdo é HTML (arquivos .txt fornecidos são HTML)
  if (txtContent.trim().startsWith('<!DOCTYPE') || txtContent.trim().startsWith('<html')) {
    return parseHTMLPDI(txtContent);
  }
  
  // Se for texto puro, fazer parsing básico
  const result: ParsedPDI = {
    employeeName: '',
    position: '',
    rawContent: txtContent
  };
  
  const lines = txtContent.split('\n');
  
  // Tentar extrair informações básicas de texto puro
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Nome (geralmente nas primeiras linhas)
    if (line.includes('Nome:')) {
      result.employeeName = line.replace(/Nome:\s*/i, '').trim();
    }
    
    // Cargo
    if (line.includes('Cargo:') || line.includes('Posição:')) {
      result.position = line.replace(/(?:Cargo|Posição):\s*/i, '').trim();
    }
    
    // Sponsor
    if (line.includes('Sponsor:') || line.includes('Diretor:')) {
      result.sponsor = line.replace(/(?:Diretor\s)?Sponsor:\s*/i, '').trim();
    }
    
    // Foco
    if (line.includes('Foco:') || line.includes('Desenvolvimento:')) {
      result.focus = line.replace(/(?:Foco|Desenvolvimento):\s*/i, '').trim();
    }
  }
  
  return result;
}

/**
 * Parser para arquivos PDF de PDI
 * Nota: Requer extração de texto do PDF primeiro
 */
export function parsePDFPDI(pdfText: string): ParsedPDI {
  // Similar ao parser de TXT, mas com tratamento específico para PDF
  return parseTXTPDI(pdfText);
}

/**
 * Parser principal que detecta o formato e chama o parser apropriado
 */
export function parsePDI(content: string, fileType: 'html' | 'txt' | 'pdf'): ParsedPDI {
  switch (fileType) {
    case 'html':
      return parseHTMLPDI(content);
    case 'txt':
      return parseTXTPDI(content);
    case 'pdf':
      return parsePDFPDI(content);
    default:
      throw new Error(`Formato de arquivo não suportado: ${fileType}`);
  }
}
