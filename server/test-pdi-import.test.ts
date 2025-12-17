import { describe, it, expect } from 'vitest';
import { PDIImportParser } from './server/services/pdiImportService';
import * as XLSX from 'xlsx';

describe('PDI Import Service', () => {
  it('should parse Excel file correctly', async () => {
    // Criar um arquivo Excel de teste
    const testData = [
      {
        nome_colaborador: 'Rodrigo Ribeiro goncalves',
        email: 'rrodrigogoni@gmail.com',
        ciclo: '2025',
        data_inicio: '01/01/2025',
        data_fim: '31/12/2025',
        competencia: 'Liderança',
        acao_desenvolvimento: 'Participar de workshop de liderança',
        categoria: '10_curso',
        data_inicio_acao: '01/02/2025',
        data_fim_acao: '28/02/2025',
        status: 'pendente'
      }
    ];

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(testData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDI');

    // Converter para buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Parse do arquivo
    const result = await PDIImportParser.parseFile(buffer, 'xlsx');

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].nome_colaborador).toBe('Rodrigo Ribeiro goncalves');
    expect(result[0].competencia).toBe('Liderança');
  });

  it('should validate data correctly', async () => {
    const testData = [
      {
        nome_colaborador: 'Rodrigo Ribeiro goncalves',
        email: 'rrodrigogoni@gmail.com',
        ciclo: '2025',
        data_inicio: '01/01/2025',
        data_fim: '31/12/2025',
        competencia: 'Liderança',
        acao_desenvolvimento: 'Participar de workshop de liderança',
        categoria: '10_curso' as const,
        data_inicio_acao: '01/02/2025',
        data_fim_acao: '28/02/2025',
        status: 'pendente' as const
      }
    ];

    const errors = await PDIImportParser.validateData(testData);

    // Pode ter erros de colaborador/ciclo não encontrado, mas não deve ter erros de validação de campos
    const fieldErrors = errors.filter(e => 
      e.field !== 'colaborador' && 
      e.field !== 'ciclo' && 
      e.field !== 'competencia'
    );
    
    expect(fieldErrors.length).toBe(0);
  });

  it('should parse text/HTML files intelligently', async () => {
    const htmlContent = `
      <html>
        <body>
          <p>Nome: Rodrigo Ribeiro goncalves</p>
          <p>Email: rrodrigogoni@gmail.com</p>
          <p>Cargo: Diretor DHO</p>
          <p>Competência: Liderança</p>
          <p>70%: Liderar projetos estratégicos</p>
          <p>20%: Mentoria com CEO</p>
          <p>10%: Curso de gestão avançada</p>
        </body>
      </html>
    `;

    const buffer = Buffer.from(htmlContent, 'utf-8');
    const result = await PDIImportParser.parseTextOrHtml(buffer, 'html');

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].nome_colaborador).toContain('Rodrigo');
  });
});
