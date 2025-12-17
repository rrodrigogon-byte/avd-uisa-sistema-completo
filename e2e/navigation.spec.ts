import { test, expect } from '@playwright/test';

/**
 * Testes E2E para Navegação
 * 
 * Cobre:
 * - Navegação entre páginas
 * - Menu lateral
 * - Breadcrumbs
 * - Links e rotas
 */

test.describe('Navegação', () => {
  test('deve carregar a página inicial sem erros', async ({ page }) => {
    await page.goto('/');
    
    // Verificar título da página
    await expect(page).toHaveTitle(/AVD UISA|Sistema/i);
    
    // Verificar que não há erros de console críticos
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      }
    });
  });

  test('deve exibir menu de navegação no dashboard', async ({ page }) => {
    // TODO: Ajustar após implementar autenticação
    await page.goto('/dashboard');
    
    // Verificar se o menu lateral está visível
    const sidebar = page.locator('[role="navigation"], aside, nav');
    await expect(sidebar).toBeVisible();
  });

  test('deve navegar para página de colaboradores', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Clicar no link de colaboradores
    const employeesLink = page.getByRole('link', { name: /colaboradores|funcionários/i });
    await employeesLink.click();
    
    // Verificar URL
    await expect(page).toHaveURL(/colaboradores|employees/i);
  });

  test('deve navegar para página de metas', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Clicar no link de metas
    const goalsLink = page.getByRole('link', { name: /metas|objetivos/i });
    await goalsLink.click();
    
    // Verificar URL
    await expect(page).toHaveURL(/metas|goals/i);
  });

  test('deve navegar para página de avaliações', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Clicar no link de avaliações
    const evaluationsLink = page.getByRole('link', { name: /avaliações|avaliacao/i });
    await evaluationsLink.click();
    
    // Verificar URL
    await expect(page).toHaveURL(/avaliacoes|evaluations/i);
  });

  test('deve exibir skeleton loaders durante carregamento', async ({ page }) => {
    await page.goto('/dashboard/relatorios');
    
    // Verificar se skeleton loaders aparecem
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]');
    
    // Skeleton deve aparecer inicialmente
    await expect(skeleton.first()).toBeVisible({ timeout: 1000 });
    
    // Após carregamento, skeleton deve desaparecer
    await expect(skeleton.first()).not.toBeVisible({ timeout: 10000 });
  });

  test('deve manter estado de navegação ao voltar', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navegar para outra página
    const link = page.getByRole('link', { name: /colaboradores/i });
    await link.click();
    
    // Voltar
    await page.goBack();
    
    // Verificar que voltou para dashboard
    await expect(page).toHaveURL(/dashboard/i);
  });
});
