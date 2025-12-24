/**
 * Utilitários para formatação monetária em Real Brasileiro (R$)
 */

/**
 * Formata um número como moeda brasileira (R$)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como R$ 1.234,56
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'R$ 0,00';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

/**
 * Remove formatação de moeda e retorna número
 * @param formatted - String formatada como R$ 1.234,56
 * @returns Número decimal
 */
export function parseCurrency(formatted: string): number {
  if (!formatted) return 0;

  // Remove R$, espaços, pontos (separador de milhar) e substitui vírgula por ponto
  const cleaned = formatted
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

/**
 * Formata input de moeda enquanto o usuário digita
 * @param value - Valor atual do input
 * @returns Valor formatado
 */
export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');

  if (!numbers) return '';

  // Converte para centavos
  const cents = parseInt(numbers, 10);

  // Formata como moeda
  return formatCurrency(cents / 100);
}
