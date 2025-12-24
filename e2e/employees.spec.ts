import { test, expect } from '@playwright/test';

/**
 * Testes E2E para Gestão de Colaboradores
 * 
 * Cobre:
 * - Listagem de colaboradores
 * - Criação de colaborador
 * - Edição de colaborador
 * - Busca e filtros
 * - Importação
 */

test.describe('Gestão de Colaboradores', () => {
  test('deve exibir listagem de colaboradores', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Verificar título da página
    await expect(page.getByRole('heading', { name: /colaboradores/i })).toBeVisible();
    
    // Verificar se a tabela ou grid está visível
    const table = page.locator('table, [role="grid"]');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('deve abrir modal de criação de colaborador', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Clicar no botão de adicionar
    const addButton = page.getByRole('button', { name: /adicionar|novo|criar/i });
    await addButton.click();
    
    // Verificar se o modal abriu
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Verificar campos do formulário
    await expect(page.getByLabel(/nome/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('deve validar campos obrigatórios ao criar colaborador', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Abrir modal
    const addButton = page.getByRole('button', { name: /adicionar|novo|criar/i });
    await addButton.click();
    
    // Tentar salvar sem preencher
    const saveButton = page.getByRole('button', { name: /salvar|criar/i });
    await saveButton.click();
    
    // Verificar mensagens de validação
    const errorMessages = page.locator('[class*="error"], [role="alert"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 2000 });
  });

  test('deve criar novo colaborador com sucesso', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Abrir modal
    const addButton = page.getByRole('button', { name: /adicionar|novo|criar/i });
    await addButton.click();
    
    // Preencher formulário
    await page.getByLabel(/nome/i).fill('João Silva Teste E2E');
    await page.getByLabel(/email/i).fill(`teste-e2e-${Date.now()}@example.com`);
    await page.getByLabel(/cargo/i).fill('Analista');
    
    // Salvar
    const saveButton = page.getByRole('button', { name: /salvar|criar/i });
    await saveButton.click();
    
    // Verificar toast de sucesso
    await expect(page.getByText(/sucesso|criado/i)).toBeVisible({ timeout: 5000 });
    
    // Verificar que o modal fechou
    const modal = page.locator('[role="dialog"]');
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('deve buscar colaborador por nome', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Localizar campo de busca
    const searchInput = page.getByPlaceholder(/buscar|pesquisar/i);
    await searchInput.fill('João');
    
    // Aguardar resultados
    await page.waitForTimeout(1000);
    
    // Verificar que os resultados foram filtrados
    const rows = page.locator('table tbody tr, [role="row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve filtrar colaboradores por departamento', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Abrir filtro de departamento
    const departmentFilter = page.getByRole('combobox', { name: /departamento/i });
    await departmentFilter.click();
    
    // Selecionar um departamento
    const option = page.getByRole('option').first();
    await option.click();
    
    // Aguardar atualização
    await page.waitForTimeout(1000);
    
    // Verificar que a listagem foi atualizada
    const rows = page.locator('table tbody tr, [role="row"]');
    await expect(rows.first()).toBeVisible();
  });

  test('deve exportar listagem de colaboradores', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Clicar no botão de exportar
    const exportButton = page.getByRole('button', { name: /exportar|download/i });
    
    // Configurar listener para download
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    
    // Verificar que o download iniciou
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx|\.csv|\.pdf/);
  });

  test('deve editar colaborador existente', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Clicar no botão de editar da primeira linha
    const editButton = page.getByRole('button', { name: /editar/i }).first();
    await editButton.click();
    
    // Verificar que o modal abriu com dados preenchidos
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Verificar que os campos estão preenchidos
    const nameInput = page.getByLabel(/nome/i);
    await expect(nameInput).not.toBeEmpty();
  });

  test('deve exibir detalhes do colaborador', async ({ page }) => {
    await page.goto('/dashboard/colaboradores');
    
    // Clicar na primeira linha
    const firstRow = page.locator('table tbody tr, [role="row"]').first();
    await firstRow.click();
    
    // Verificar que navegou para página de detalhes ou abriu modal
    await expect(page).toHaveURL(/colaboradores\/\d+|colaboradores.*id=/);
  });
});
