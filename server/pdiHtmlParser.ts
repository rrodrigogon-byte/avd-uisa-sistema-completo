/**
 * Parser de HTML para PDI (Plano de Desenvolvimento Individual)
 * Extrai dados estruturados de arquivos HTML de PDI
 */

import { JSDOM } from 'jsdom';

export interface ParsedPDI {
  // Perfil do colaborador
  employeeName: string;
  position: string;
  developmentFocus: string;
  sponsorName: string;
  
  // KPIs
  kpis: {
    currentPosition: string;
    reframing: string;
    newPosition: string;
    planDuration: string;
  };
  
  // Gaps de competências
  competencyGaps: Array<{
    title: string;
    description: string;
  }>;
  
  // Dados do gráfico de competências
  competencyChart: {
    labels: string[];
    currentProfile: number[];
    targetProfile: number[];
  };
  
  // Trilha de remuneração
  compensationTrack: Array<{
    level: string;
    timeline: string;
    trigger: string;
    projectedSalary: string;
    positionInRange: string;
  }>;
  
  // Plano de ação 70-20-10
  actionPlan: {
    onTheJob: string[]; // 70%
    social: string[]; // 20%
    formal: string[]; // 10%
  };
  
  // Pacto de responsabilidades
  responsibilityPact: {
    employee: string[];
    leadership: string[];
    dho: string[];
  };
  
  // Metadados
  htmlContent: string; // HTML original completo
}

/**
 * Extrai texto de um elemento HTML
 */
function extractText(element: Element | null): string {
  return element?.textContent?.trim() || '';
}

/**
 * Extrai lista de itens de um elemento
 */
function extractListItems(element: Element | null): string[] {
  if (!element) return [];
  const items = element.querySelectorAll('li');
  return Array.from(items).map(li => extractText(li)).filter(text => text.length > 0);
}

/**
 * Parse do HTML do PDI
 */
export function parsePDIHtml(htmlContent: string): ParsedPDI {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  // Extrair nome do colaborador
  const employeeName = extractText(document.querySelector('h1 + p')) || 
                        extractText(document.querySelector('h2.text-2xl'));
  
  // Extrair cargo
  const positionElement = document.querySelector('p.text-uisa-orange');
  const position = extractText(positionElement);
  
  // Extrair foco de desenvolvimento
  const focusElement = Array.from(document.querySelectorAll('p.text-sm'))
    .find(p => p.textContent?.includes('Foco do Desenvolvimento:'));
  const developmentFocus = focusElement?.textContent?.replace('Foco do Desenvolvimento:', '').trim() || '';
  
  // Extrair sponsor
  const sponsorElement = Array.from(document.querySelectorAll('p.text-sm'))
    .find(p => p.textContent?.includes('Diretor Sponsor:'));
  const sponsorName = sponsorElement?.textContent?.replace('Diretor Sponsor:', '').trim() || '';
  
  // Extrair KPIs
  const kpiCards = document.querySelectorAll('.kpi-card');
  const kpis = {
    currentPosition: '',
    reframing: '',
    newPosition: '',
    planDuration: ''
  };
  
  kpiCards.forEach((card, index) => {
    const value = extractText(card.querySelector('p.font-bold:not(.text-gray-500)'));
    switch(index) {
      case 0: kpis.currentPosition = value; break;
      case 1: kpis.reframing = value; break;
      case 2: kpis.newPosition = value; break;
      case 3: kpis.planDuration = value; break;
    }
  });
  
  // Extrair gaps de competências
  const competencyGaps: Array<{title: string; description: string}> = [];
  const gapsSection = Array.from(document.querySelectorAll('h3'))
    .find(h3 => h3.textContent?.includes('Análise de Gaps') || h3.textContent?.includes('Desenvolvimento de Competências'));
  
  if (gapsSection) {
    const gapsList = gapsSection.parentElement?.querySelector('ul');
    const gapItems = gapsList?.querySelectorAll('li') || [];
    
    gapItems.forEach(li => {
      const text = extractText(li);
      const parts = text.split(':');
      if (parts.length >= 2) {
        competencyGaps.push({
          title: parts[0].trim(),
          description: parts.slice(1).join(':').trim()
        });
      } else {
        competencyGaps.push({
          title: text.substring(0, 50),
          description: text
        });
      }
    });
  }
  
  // Extrair dados do gráfico de competências (do script)
  const scripts = document.querySelectorAll('script');
  let competencyChart = {
    labels: [] as string[],
    currentProfile: [] as number[],
    targetProfile: [] as number[]
  };
  
  scripts.forEach(script => {
    const scriptContent = script.textContent || '';
    
    // Procurar por labels
    const labelsMatch = scriptContent.match(/labels:\s*\[(.*?)\]/s);
    if (labelsMatch) {
      const labelsStr = labelsMatch[1];
      competencyChart.labels = labelsStr
        .split(',')
        .map(s => s.trim().replace(/['"]/g, ''))
        .filter(s => s.length > 0);
    }
    
    // Procurar por datasets
    const datasetsMatch = scriptContent.match(/datasets:\s*\[(.*?)\]/s);
    if (datasetsMatch) {
      const datasetsStr = datasetsMatch[1];
      
      // Extrair dados do perfil alvo (primeiro dataset)
      const targetMatch = datasetsStr.match(/data:\s*\[([\d,\s]+)\]/);
      if (targetMatch) {
        competencyChart.targetProfile = targetMatch[1]
          .split(',')
          .map(s => parseFloat(s.trim()))
          .filter(n => !isNaN(n));
      }
      
      // Extrair dados do perfil atual (segundo dataset)
      const dataMatches = datasetsStr.matchAll(/data:\s*\[([\d,\s]+)\]/g);
      const allMatches = Array.from(dataMatches);
      if (allMatches.length >= 2) {
        competencyChart.currentProfile = allMatches[1][1]
          .split(',')
          .map(s => parseFloat(s.trim()))
          .filter(n => !isNaN(n));
      }
    }
  });
  
  // Extrair trilha de remuneração
  const compensationTrack: Array<{
    level: string;
    timeline: string;
    trigger: string;
    projectedSalary: string;
    positionInRange: string;
  }> = [];
  
  const compensationTable = Array.from(document.querySelectorAll('table'))
    .find(table => {
      const headers = table.querySelectorAll('th');
      return Array.from(headers).some(th => 
        th.textContent?.includes('Nível') || 
        th.textContent?.includes('Prazo') ||
        th.textContent?.includes('Movimento')
      );
    });
  
  if (compensationTable) {
    const rows = compensationTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        compensationTrack.push({
          level: extractText(cells[0]),
          timeline: extractText(cells[1]),
          trigger: extractText(cells[2]),
          projectedSalary: extractText(cells[3]),
          positionInRange: cells.length >= 5 ? extractText(cells[4]) : ''
        });
      }
    });
  }
  
  // Extrair plano de ação 70-20-10
  const actionPlan = {
    onTheJob: [] as string[],
    social: [] as string[],
    formal: [] as string[]
  };
  
  const actionSection = Array.from(document.querySelectorAll('h3'))
    .find(h3 => h3.textContent?.includes('Plano de Ação'));
  
  if (actionSection) {
    const actionContainer = actionSection.nextElementSibling;
    
    // 70% - On-the-Job
    const onTheJobElement = Array.from(actionContainer?.querySelectorAll('p.font-bold') || [])
      .find(p => p.textContent?.includes('70%'));
    if (onTheJobElement) {
      const list = onTheJobElement.nextElementSibling;
      actionPlan.onTheJob = extractListItems(list);
    }
    
    // 20% - Social
    const socialElement = Array.from(actionContainer?.querySelectorAll('p.font-bold') || [])
      .find(p => p.textContent?.includes('20%'));
    if (socialElement) {
      const list = socialElement.nextElementSibling;
      actionPlan.social = extractListItems(list);
    }
    
    // 10% - Formal
    const formalElement = Array.from(actionContainer?.querySelectorAll('p.font-bold') || [])
      .find(p => p.textContent?.includes('10%'));
    if (formalElement) {
      const list = formalElement.nextElementSibling;
      actionPlan.formal = extractListItems(list);
    }
  }
  
  // Extrair pacto de responsabilidades
  const responsibilityPact = {
    employee: [] as string[],
    leadership: [] as string[],
    dho: [] as string[]
  };
  
  const pactSection = Array.from(document.querySelectorAll('h3'))
    .find(h3 => h3.textContent?.includes('Pacto'));
  
  if (pactSection) {
    const pactContainer = pactSection.nextElementSibling;
    
    // Responsabilidades do colaborador
    const employeeElement = Array.from(pactContainer?.querySelectorAll('p.font-bold') || [])
      .find(p => p.textContent?.includes('Protagonista') || p.textContent?.toLowerCase().includes(employeeName.toLowerCase().split(' ')[0]));
    if (employeeElement) {
      const list = employeeElement.nextElementSibling;
      responsibilityPact.employee = extractListItems(list);
    }
    
    // Responsabilidades da liderança
    const leadershipElement = Array.from(pactContainer?.querySelectorAll('p.font-bold') || [])
      .find(p => p.textContent?.includes('Liderança') || p.textContent?.includes('Mentor'));
    if (leadershipElement) {
      const list = leadershipElement.nextElementSibling;
      responsibilityPact.leadership = extractListItems(list);
    }
    
    // Responsabilidades do DHO
    const dhoElement = Array.from(pactContainer?.querySelectorAll('p.font-bold') || [])
      .find(p => p.textContent?.includes('DHO') || p.textContent?.includes('Guardião'));
    if (dhoElement) {
      const list = dhoElement.nextElementSibling;
      responsibilityPact.dho = extractListItems(list);
    }
  }
  
  return {
    employeeName,
    position,
    developmentFocus,
    sponsorName,
    kpis,
    competencyGaps,
    competencyChart,
    compensationTrack,
    actionPlan,
    responsibilityPact,
    htmlContent
  };
}
