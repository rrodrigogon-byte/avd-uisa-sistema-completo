# Testes E2E - Sistema AVD UISA

Este diretório contém os testes End-to-End (E2E) do sistema AVD UISA, implementados com **Playwright**.

## 📋 Índice

- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Executando os Testes](#executando-os-testes)
- [Estrutura dos Testes](#estrutura-dos-testes)
- [Boas Práticas](#boas-práticas)
- [Debugging](#debugging)
- [CI/CD](#cicd)

## 🔧 Requisitos

- Node.js 18+
- pnpm
- Navegadores instalados pelo Playwright

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Instalar navegadores do Playwright
pnpm exec playwright install
```

## 🚀 Executando os Testes

### Modo Desenvolvimento (com UI)

```bash
# Executar todos os testes com interface gráfica
pnpm test:e2e:ui

# Executar testes específicos
pnpm exec playwright test auth.spec.ts --ui
```

### Modo Headless (CI)

```bash
# Executar todos os testes
pnpm test:e2e

# Executar testes específicos
pnpm exec playwright test employees.spec.ts

# Executar em browser específico
pnpm exec playwright test --project=chromium
```

### Modo Debug

```bash
# Executar com inspector
pnpm exec playwright test --debug

# Executar teste específico com debug
pnpm exec playwright test auth.spec.ts --debug
```

### Gerar Relatório

```bash
# Gerar e abrir relatório HTML
pnpm exec playwright show-report
```

## 📁 Estrutura dos Testes

```
e2e/
├── auth.spec.ts           # Testes de autenticação
├── navigation.spec.ts     # Testes de navegação
├── employees.spec.ts      # Testes de gestão de colaboradores
├── goals.spec.ts          # Testes de metas (TODO)
├── evaluations.spec.ts    # Testes de avaliações (TODO)
├── succession.spec.ts     # Testes de sucessão (TODO)
├── reports.spec.ts        # Testes de relatórios (TODO)
└── README.md              # Esta documentação
```

## ✅ Boas Práticas

### 1. Seletores

**Preferir seletores semânticos:**

```typescript
// ✅ Bom - Usa role e nome
await page.getByRole('button', { name: /salvar/i });

// ✅ Bom - Usa label
await page.getByLabel(/nome/i);

// ❌ Evitar - Seletor frágil
await page.locator('.btn-primary');
```

### 2. Esperas (Waits)

**Usar esperas inteligentes:**

```typescript
// ✅ Bom - Espera automática
await expect(page.getByText('Sucesso')).toBeVisible();

// ❌ Evitar - Timeout fixo
await page.waitForTimeout(3000);
```

### 3. Isolamento

**Cada teste deve ser independente:**

```typescript
test.beforeEach(async ({ page }) => {
  // Setup para cada teste
  await page.goto('/dashboard');
});

test.afterEach(async ({ page }) => {
  // Cleanup após cada teste
  await page.close();
});
```

### 4. Dados de Teste

**Usar dados únicos:**

```typescript
// ✅ Bom - Email único
const email = `teste-${Date.now()}@example.com`;

// ❌ Evitar - Dados fixos
const email = 'teste@example.com';
```

### 5. Assertions

**Ser específico nas verificações:**

```typescript
// ✅ Bom - Verifica texto específico
await expect(page.getByText('Colaborador criado com sucesso')).toBeVisible();

// ❌ Evitar - Verificação genérica
await expect(page.locator('.toast')).toBeVisible();
```

## 🐛 Debugging

### 1. Modo UI

O modo UI permite visualizar e debugar testes interativamente:

```bash
pnpm exec playwright test --ui
```

### 2. Traces

Traces capturam screenshots, DOM e network:

```bash
# Executar com trace
pnpm exec playwright test --trace on

# Visualizar trace
pnpm exec playwright show-trace trace.zip
```

### 3. Screenshots

Screenshots são capturados automaticamente em falhas, mas você pode forçar:

```typescript
await page.screenshot({ path: 'debug.png' });
```

### 4. Console Logs

Capturar logs do browser:

```typescript
page.on('console', msg => console.log('Browser log:', msg.text()));
```

## 🔄 CI/CD

### Variáveis de Ambiente

```bash
# URL base para testes
E2E_BASE_URL=https://staging.example.com

# Modo CI
CI=true
```

### GitHub Actions (Exemplo)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps
      
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          E2E_BASE_URL: ${{ secrets.STAGING_URL }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 📊 Cobertura de Testes

### Módulos Cobertos

- ✅ Autenticação (auth.spec.ts)
- ✅ Navegação (navigation.spec.ts)
- ✅ Gestão de Colaboradores (employees.spec.ts)
- ⏳ Metas (goals.spec.ts) - TODO
- ⏳ Avaliações (evaluations.spec.ts) - TODO
- ⏳ Sucessão (succession.spec.ts) - TODO
- ⏳ Relatórios (reports.spec.ts) - TODO

### Próximos Passos

1. Implementar testes para módulos pendentes
2. Adicionar testes de performance
3. Configurar testes de acessibilidade
4. Integrar com pipeline de CI/CD

## 🔗 Recursos

- [Documentação Playwright](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
