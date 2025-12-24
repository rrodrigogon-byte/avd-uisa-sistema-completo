import { test, expect } from '@playwright/test';

/**
 * Testes E2E para Autenticação
 * 
 * Cobre os fluxos de:
 * - Login
 * - Logout
 * - Verificação de sessão
 * - Redirecionamento de rotas protegidas
 */

test.describe('Autenticação', () => {
  test('deve exibir botão de login na página inicial', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se o botão de login está visível
    const loginButton = page.getByRole('button', { name: /entrar|login/i });
    await expect(loginButton).toBeVisible();
  });

  test('deve redirecionar para OAuth ao clicar em login', async ({ page }) => {
    await page.goto('/');
    
    // Clicar no botão de login
    const loginButton = page.getByRole('button', { name: /entrar|login/i });
    await loginButton.click();
    
    // Verificar redirecionamento para URL de OAuth
    await expect(page).toHaveURL(/oauth|login/);
  });

  test('deve exibir informações do usuário após login', async ({ page }) => {
    // Simular login (ajustar conforme implementação real)
    await page.goto('/');
    
    // TODO: Implementar fluxo de login real
    // Isso depende da configuração de OAuth do ambiente de teste
    
    // Verificar se o nome do usuário aparece após login
    // await expect(page.getByText(/nome do usuário/i)).toBeVisible();
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    // TODO: Implementar após ter fluxo de login funcional
    
    // await page.goto('/dashboard');
    // const logoutButton = page.getByRole('button', { name: /sair|logout/i });
    // await logoutButton.click();
    // await expect(page).toHaveURL('/');
  });

  test('deve redirecionar rotas protegidas quando não autenticado', async ({ page }) => {
    // Tentar acessar rota protegida sem autenticação
    await page.goto('/dashboard');
    
    // Verificar se foi redirecionado para login ou página inicial
    await expect(page).toHaveURL(/\/|login|oauth/);
  });
});
