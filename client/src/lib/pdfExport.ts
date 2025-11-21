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
