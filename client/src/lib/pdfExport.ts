/**
 * Utilitário de Exportação PDF
 * Funções para gerar PDFs de relatórios do sistema
 */

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  content: string; // HTML content
  filename?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Exporta conteúdo HTML para PDF usando print do navegador
 */
export async function exportToPDF(options: PDFExportOptions) {
  const {
    title,
    subtitle,
    content,
    filename = 'relatorio.pdf',
    orientation = 'portrait',
  } = options;

  // Criar janela temporária para impressão
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Não foi possível abrir janela de impressão. Verifique se pop-ups estão bloqueados.');
  }

  // HTML completo do documento
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: 2cm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1f2937;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #f97316;
        }
        
        .header h1 {
          font-size: 24pt;
          color: #1f2937;
          margin-bottom: 8px;
          font-weight: 700;
        }
        
        .header .subtitle {
          font-size: 12pt;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .header .date {
          font-size: 10pt;
          color: #9ca3af;
        }
        
        .content {
          margin-top: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          page-break-inside: avoid;
        }
        
        th, td {
          padding: 12px;
          text-align: left;
          border: 1px solid #e5e7eb;
        }
        
        th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 9pt;
          font-weight: 600;
        }
        
        .badge-success {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .badge-warning {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .badge-danger {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .badge-info {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .section {
          margin: 30px 0;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 16pt;
          font-weight: 700;
          color: #f97316;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #fed7aa;
        }
        
        .card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 15px 0;
          page-break-inside: avoid;
        }
        
        .card-title {
          font-size: 14pt;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 15px 0;
        }
        
        .info-item {
          padding: 10px;
          background: white;
          border-radius: 6px;
        }
        
        .info-label {
          font-size: 9pt;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 12pt;
          color: #1f2937;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 9pt;
          color: #9ca3af;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        <div class="date">Gerado em: ${new Date().toLocaleString('pt-BR', {
          dateStyle: 'long',
          timeStyle: 'short',
        })}</div>
      </div>
      
      <div class="content">
        ${content}
      </div>
      
      <div class="footer">
        <p>Sistema AVD UISA - Avaliação de Desempenho</p>
        <p>Documento gerado automaticamente - ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Aguardar carregamento e abrir diálogo de impressão
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      
      // Fechar janela após impressão (opcional)
      setTimeout(() => {
        printWindow.close();
      }, 100);
    }, 250);
  };
}

/**
 * Gera HTML de tabela a partir de dados
 */
export function generateTableHTML(headers: string[], rows: string[][]): string {
  return `
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            ${row.map(cell => `<td>${cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Gera HTML de card informativo
 */
export function generateCardHTML(title: string, content: string): string {
  return `
    <div class="card">
      <div class="card-title">${title}</div>
      <div>${content}</div>
    </div>
  `;
}

/**
 * Gera HTML de grid de informações
 */
export function generateInfoGridHTML(items: Array<{ label: string; value: string }>): string {
  return `
    <div class="info-grid">
      ${items.map(item => `
        <div class="info-item">
          <div class="info-label">${item.label}</div>
          <div class="info-value">${item.value}</div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Gera badge HTML
 */
export function generateBadgeHTML(text: string, variant: 'success' | 'warning' | 'danger' | 'info' = 'info'): string {
  return `<span class="badge badge-${variant}">${text}</span>`;
}

/**
 * Gera seção HTML
 */
export function generateSectionHTML(title: string, content: string): string {
  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      ${content}
    </div>
  `;
}


/**
 * Exporta PDI Inteligente para PDF
 */
export async function exportPDIPDF(pdi: any) {
  const content = `
    ${generateSectionHTML('Informações do PDI', `
      ${generateInfoGridHTML([
        { label: 'Colaborador', value: pdi.employeeName || 'N/A' },
        { label: 'Posição Alvo', value: pdi.targetPositionName || 'N/A' },
        { label: 'Duração', value: `${pdi.duration || 0} meses` },
        { label: 'Progresso Geral', value: `${pdi.overallProgress || 0}%` },
        { label: 'Status', value: generateBadgeHTML(
          pdi.status === 'draft' ? 'Rascunho' :
          pdi.status === 'submitted' ? 'Submetido' :
          pdi.status === 'approved' ? 'Aprovado' :
          pdi.status === 'in_progress' ? 'Em Andamento' :
          pdi.status === 'completed' ? 'Concluído' : 'Cancelado',
          pdi.status === 'approved' || pdi.status === 'completed' ? 'success' :
          pdi.status === 'in_progress' ? 'info' :
          pdi.status === 'cancelled' ? 'danger' : 'warning'
        ) },
        { label: 'Criado em', value: new Date(pdi.createdAt).toLocaleDateString('pt-BR') }
      ])}
    `)}
    
    ${pdi.objectives ? generateSectionHTML('Objetivos', `
      <div class="card">
        <p>${pdi.objectives}</p>
      </div>
    `) : ''}
    
    ${pdi.actions && pdi.actions.length > 0 ? generateSectionHTML('Plano de Ação 70-20-10', `
      ${generateTableHTML(
        ['Ação', 'Tipo', 'Prazo', 'Status', 'Progresso'],
        pdi.actions.map((action: any) => [
          action.actionDescription || '',
          action.actionType === 'experiential' ? '70% Experiência' :
          action.actionType === 'mentoring' ? '20% Mentoria' :
          action.actionType === 'formal' ? '10% Formal' : 'Outro',
          action.deadline ? new Date(action.deadline).toLocaleDateString('pt-BR') : 'N/A',
          action.status === 'not_started' ? 'Não Iniciado' :
          action.status === 'in_progress' ? 'Em Andamento' :
          action.status === 'completed' ? 'Concluído' : 'Cancelado',
          `${action.progress || 0}%`
        ])
      )}
    `) : ''}
    
    ${pdi.keyAreas && pdi.keyAreas.length > 0 ? generateSectionHTML('Áreas-Chave de Desenvolvimento', `
      <ul style="list-style: disc; padding-left: 30px;">
        ${pdi.keyAreas.map((area: string) => `<li style="margin: 8px 0;">${area}</li>`).join('')}
      </ul>
    `) : ''}
    
    ${pdi.competencyGaps && pdi.competencyGaps.length > 0 ? generateSectionHTML('Gaps de Competências', `
      ${generateTableHTML(
        ['Competência', 'Nível Atual', 'Nível Alvo', 'Gap', 'Prioridade'],
        pdi.competencyGaps.map((gap: any) => [
          gap.competencyName || '',
          `${gap.currentLevel || 0}`,
          `${gap.targetLevel || 0}`,
          `${(gap.targetLevel || 0) - (gap.currentLevel || 0)}`,
          gap.priority === 'high' ? generateBadgeHTML('Alta', 'danger') :
          gap.priority === 'medium' ? generateBadgeHTML('Média', 'warning') :
          generateBadgeHTML('Baixa', 'info')
        ])
      )}
    `) : ''}
  `;

  await exportToPDF({
    title: 'Plano de Desenvolvimento Individual (PDI)',
    subtitle: `${pdi.employeeName || 'Colaborador'} - ${pdi.targetPositionName || 'Posição Alvo'}`,
    content,
    filename: `PDI_${pdi.employeeName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation: 'portrait'
  });
}


/**
 * Exporta Meta SMART para PDF
 */
export async function exportMetaSMARTPDF(meta: any) {
  const smartValidation = meta.smartValidation ? JSON.parse(meta.smartValidation) : {};
  
  const content = `
    ${generateSectionHTML('Informações da Meta', `
      ${generateInfoGridHTML([
        { label: 'Título', value: meta.title || 'N/A' },
        { label: 'Colaborador', value: meta.employeeName || 'N/A' },
        { label: 'Categoria', value: 
          meta.category === 'financial' ? 'Financeira' :
          meta.category === 'behavioral' ? 'Comportamental' :
          meta.category === 'corporate' ? 'Corporativa' :
          meta.category === 'development' ? 'Desenvolvimento' : 'Outra'
        },
        { label: 'Tipo', value: meta.type === 'individual' ? 'Individual' : 'Equipe' },
        { label: 'Progresso', value: `${meta.currentValue || 0} / ${meta.targetValue || 0} ${meta.unit || ''}` },
        { label: 'Percentual', value: `${meta.progress || 0}%` },
        { label: 'Status', value: generateBadgeHTML(
          meta.status === 'draft' ? 'Rascunho' :
          meta.status === 'active' ? 'Ativa' :
          meta.status === 'completed' ? 'Concluída' :
          meta.status === 'cancelled' ? 'Cancelada' : 'Vencida',
          meta.status === 'completed' ? 'success' :
          meta.status === 'active' ? 'info' :
          meta.status === 'overdue' ? 'danger' : 'warning'
        ) },
        { label: 'Prazo', value: meta.deadline ? new Date(meta.deadline).toLocaleDateString('pt-BR') : 'N/A' }
      ])}
    `)}
    
    ${meta.description ? generateSectionHTML('Descrição', `
      <div class="card">
        <p>${meta.description}</p>
      </div>
    `) : ''}
    
    ${generateSectionHTML('Validação SMART', `
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Específica (S)</div>
          <div class="info-value">${smartValidation.specific ? '✓ Sim' : '✗ Não'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Mensurável (M)</div>
          <div class="info-value">${smartValidation.measurable ? '✓ Sim' : '✗ Não'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Atingível (A)</div>
          <div class="info-value">${smartValidation.achievable ? '✓ Sim' : '✗ Não'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Relevante (R)</div>
          <div class="info-value">${smartValidation.relevant ? '✓ Sim' : '✗ Não'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Temporal (T)</div>
          <div class="info-value">${smartValidation.timeBound ? '✓ Sim' : '✗ Não'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Score SMART</div>
          <div class="info-value">${smartValidation.score || 0}%</div>
        </div>
      </div>
    `)}
    
    ${meta.milestones && meta.milestones.length > 0 ? generateSectionHTML('Marcos Intermediários', `
      ${generateTableHTML(
        ['Marco', 'Prazo', 'Status', 'Progresso'],
        meta.milestones.map((milestone: any) => [
          milestone.title || '',
          milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('pt-BR') : 'N/A',
          milestone.status === 'not_started' ? 'Não Iniciado' :
          milestone.status === 'in_progress' ? 'Em Andamento' :
          milestone.status === 'completed' ? 'Concluído' : 'Vencido',
          `${milestone.progress || 0}%`
        ])
      )}
    `) : ''}
    
    ${meta.bonusEligible ? generateSectionHTML('Informações de Bônus', `
      ${generateInfoGridHTML([
        { label: 'Elegível para Bônus', value: 'Sim' },
        { label: 'Tipo de Bônus', value: meta.bonusType === 'percentage' ? 'Percentual' : 'Fixo' },
        { label: 'Valor', value: meta.bonusType === 'percentage' ? `${meta.bonusPercentage || 0}%` : `R$ ${(meta.bonusAmount || 0) / 100}` }
      ])}
    `) : ''}
  `;

  await exportToPDF({
    title: 'Meta SMART',
    subtitle: `${meta.title || 'Meta'} - ${meta.employeeName || 'Colaborador'}`,
    content,
    filename: `Meta_SMART_${meta.title?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation: 'portrait'
  });
}


/**
 * Exporta Avaliação 360° para PDF
 */
export async function export360PDF(avaliacao: any) {
  // Calcular médias por categoria
  const categorias = avaliacao.respostas?.reduce((acc: any, resp: any) => {
    if (!acc[resp.categoria]) {
      acc[resp.categoria] = { total: 0, count: 0 };
    }
    acc[resp.categoria].total += resp.nota || 0;
    acc[resp.categoria].count += 1;
    return acc;
  }, {}) || {};

  const categoriasHTML = Object.entries(categorias).map(([cat, data]: [string, any]) => {
    const media = data.count > 0 ? (data.total / data.count).toFixed(1) : '0.0';
    return `
      <div class="info-item">
        <div class="info-label">${cat}</div>
        <div class="info-value">${media} / 5.0</div>
      </div>
    `;
  }).join('');

  const content = `
    ${generateSectionHTML('Informações da Avaliação', `
      ${generateInfoGridHTML([
        { label: 'Colaborador', value: avaliacao.employeeName || 'N/A' },
        { label: 'Ciclo', value: avaliacao.cycleName || 'N/A' },
        { label: 'Tipo', value: avaliacao.type === '360' ? '360°' : 'Outro' },
        { label: 'Status', value: generateBadgeHTML(
          avaliacao.status === 'draft' ? 'Rascunho' :
          avaliacao.status === 'in_progress' ? 'Em Andamento' :
          avaliacao.status === 'completed' ? 'Concluída' : 'Cancelada',
          avaliacao.status === 'completed' ? 'success' :
          avaliacao.status === 'in_progress' ? 'info' : 'warning'
        ) },
        { label: 'Média Geral', value: `${avaliacao.mediaGeral?.toFixed(1) || '0.0'} / 5.0` },
        { label: 'Criada em', value: new Date(avaliacao.createdAt).toLocaleDateString('pt-BR') }
      ])}
    `)}
    
    ${categoriasHTML ? generateSectionHTML('Médias por Categoria', `
      <div class="info-grid">
        ${categoriasHTML}
      </div>
    `) : ''}
    
    ${avaliacao.respostas && avaliacao.respostas.length > 0 ? generateSectionHTML('Avaliações Detalhadas', `
      ${generateTableHTML(
        ['Categoria', 'Pergunta', 'Nota', 'Avaliador'],
        avaliacao.respostas.map((resp: any) => [
          resp.categoria || '',
          resp.pergunta || '',
          `${resp.nota || 0} / 5`,
          resp.avaliadorNome || 'Anônimo'
        ])
      )}
    `) : ''}
    
    ${avaliacao.comentarios && avaliacao.comentarios.length > 0 ? generateSectionHTML('Comentários', `
      ${avaliacao.comentarios.map((com: any) => `
        <div class="card">
          <div class="card-title">${com.avaliadorNome || 'Anônimo'}</div>
          <p><strong>Pontos Fortes:</strong> ${com.pontosFortes || 'N/A'}</p>
          <p><strong>Pontos de Melhoria:</strong> ${com.pontosMelhoria || 'N/A'}</p>
          ${com.comentarioGeral ? `<p><strong>Comentário:</strong> ${com.comentarioGeral}</p>` : ''}
        </div>
      `).join('')}
    `) : ''}
    
    ${avaliacao.planoAcao ? generateSectionHTML('Plano de Ação', `
      <div class="card">
        <p>${avaliacao.planoAcao}</p>
      </div>
    `) : ''}
  `;

  await exportToPDF({
    title: 'Avaliação 360°',
    subtitle: `${avaliacao.employeeName || 'Colaborador'} - ${avaliacao.cycleName || 'Ciclo'}`,
    content,
    filename: `Avaliacao_360_${avaliacao.employeeName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation: 'portrait'
  });
}
