# Plano Completo de Implementação - Organograma Hierárquico Interativo

## 📋 Visão Geral

Implementar um organograma hierárquico interativo completo que reflita a estrutura organizacional real da UISA, com funcionalidades de movimentação drag-and-drop, visualização multinível e gestão completa de hierarquia.

---

## 🏢 Estrutura Organizacional UISA

```
Conselho de Administração
    └── CEO: Mazuca
        ├── Diretor Financeiro
        ├── Diretor de Operações
        ├── Diretor de RH
        ├── Diretor Comercial
        └── Diretor de TI
            ├── Gerentes
            │   ├── Coordenadores
            │   │   ├── Supervisores
            │   │   │   └── Colaboradores
```

**Níveis Hierárquicos:**
1. Conselho de Administração (Nível 0)
2. CEO (Nível 1)
3. Diretores (Nível 2)
4. Gerentes (Nível 3)
5. Coordenadores (Nível 4)
6. Supervisores (Nível 5)
7. Colaboradores (Nível 6+)

---

## 🎯 Fase 1: Estrutura de Dados e Backend

### 1.1 Schema de Banco de Dados

**Tabelas Necessárias:**

```typescript
// employees - JÁ EXISTE, precisa validar campos
- id: int (PK)
- employeeCode: varchar (chapa)
- name: varchar
- email: varchar
- managerId: int (FK para employees.id) ⭐ CAMPO CRÍTICO
- departmentId: int (FK)
- positionId: int (FK)
- hierarchyLevel: int (0-10) ⭐ NOVO CAMPO
- photoUrl: varchar
- active: boolean

// orgChartStructure - JÁ EXISTE
- id: int (PK)
- nodeType: enum('department', 'position', 'employee')
- departmentId: int (FK)
- positionId: int (FK)
- employeeId: int (FK) ⭐ ADICIONAR
- parentId: int (FK para orgChartStructure.id)
- level: int
- orderIndex: int
- displayName: varchar
- color: varchar
- icon: varchar
- positionX: float
- positionY: float
- active: boolean

// managerChangeHistory - JÁ EXISTE
- id: int (PK)
- employeeId: int (FK)
- previousManagerId: int (FK)
- newManagerId: int (FK)
- changeType: enum
- reason: text
- changedBy: int (FK para users.id)
- createdAt: timestamp

// employeeMovements - JÁ EXISTE
- id: int (PK)
- employeeId: int (FK)
- previousDepartmentId: int (FK)
- newDepartmentId: int (FK)
- previousPositionId: int (FK)
- newPositionId: int (FK)
- previousManagerId: int (FK)
- newManagerId: int (FK)
- movementType: enum
- reason: text
- effectiveDate: date
- createdBy: int (FK)
```

### 1.2 Procedures tRPC Backend

**orgChartRouter.ts - Procedures Necessárias:**

```typescript
// ✅ JÁ EXISTE: getOrgChart
// ✅ JÁ EXISTE: updateManager

// 🆕 CRIAR:
1. getFullHierarchy() - Retorna árvore completa com todos os níveis
2. getEmployeeChain(employeeId) - Retorna cadeia hierárquica até o topo
3. getSubordinates(employeeId, depth?) - Retorna subordinados diretos/indiretos
4. moveEmployeeInHierarchy(employeeId, newManagerId, reason) - Move na hierarquia
5. bulkMoveEmployees(employeeIds[], newManagerId) - Move múltiplos
6. validateHierarchyMove(employeeId, newManagerId) - Valida antes de mover
7. getHierarchyStats() - Estatísticas da hierarquia
8. searchInHierarchy(query) - Busca por nome/cargo/departamento
9. exportHierarchy(format: 'json' | 'csv' | 'pdf') - Exportar organograma
10. getOrganizationalLevels() - Retorna níveis hierárquicos configurados
```

### 1.3 Validações de Negócio

**Regras Críticas:**
- ✅ Não permitir ciclos na hierarquia (A → B → C → A)
- ✅ Não permitir funcionário ser gestor de si mesmo
- ✅ Validar que novo gestor existe e está ativo
- ✅ Registrar todas as mudanças no histórico
- ✅ Notificar gestores sobre mudanças em suas equipes
- ✅ Validar níveis hierárquicos (CEO não pode ter gestor, exceto Conselho)

---

## 🎨 Fase 2: Interface Interativa do Organograma

### 2.1 Componentes React

**Estrutura de Componentes:**

```
OrganogramaInterativo/
├── OrganogramaContainer.tsx (container principal)
├── OrganogramaTree.tsx (visualização em árvore)
├── OrganogramaCard.tsx (card de funcionário)
├── OrganogramaDragLayer.tsx (layer de drag-and-drop)
├── OrganogramaFilters.tsx (filtros e busca)
├── OrganogramaToolbar.tsx (toolbar com ações)
├── OrganogramaLegend.tsx (legenda de cores por nível)
├── OrganogramaMinimap.tsx (minimap para navegação)
└── OrganogramaExport.tsx (exportação)
```

### 2.2 Funcionalidades Interativas

**Drag-and-Drop:**
- ✅ Arrastar funcionário para novo gestor
- ✅ Validação visual antes de soltar (verde = válido, vermelho = inválido)
- ✅ Confirmação antes de aplicar mudança
- ✅ Feedback visual durante arraste
- ✅ Desfazer última ação

**Visualização:**
- ✅ Zoom in/out (scroll do mouse)
- ✅ Pan (arrastar fundo)
- ✅ Colapsar/expandir níveis
- ✅ Destacar caminho hierárquico ao hover
- ✅ Cores diferentes por nível hierárquico
- ✅ Ícones por tipo de cargo
- ✅ Fotos dos funcionários

**Filtros e Busca:**
- ✅ Busca por nome, cargo, departamento
- ✅ Filtro por departamento
- ✅ Filtro por nível hierárquico
- ✅ Filtro por status (ativo/inativo)
- ✅ Destacar resultados da busca

**Ações:**
- ✅ Ver detalhes do funcionário (modal)
- ✅ Editar informações básicas
- ✅ Mover para outro gestor
- ✅ Ver histórico de movimentações
- ✅ Ver subordinados diretos/indiretos
- ✅ Exportar organograma (PNG, PDF, JSON)

### 2.3 Layout e Design

**Cores por Nível Hierárquico:**
```typescript
const LEVEL_COLORS = {
  0: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-900' }, // Conselho
  1: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900' },       // CEO
  2: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-900' },    // Diretores
  3: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-900' }, // Gerentes
  4: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900' }, // Coordenadores
  5: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-900' },          // Supervisores
  6: { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-900' },       // Colaboradores
};
```

**Layout Responsivo:**
- Desktop: Visualização horizontal com árvore expandida
- Tablet: Visualização vertical com scroll
- Mobile: Lista hierárquica com indentação

---

## 🔧 Fase 3: Correções de Descrições de Cargo

### 3.1 Problemas Identificados

**Sistema Atual:**
- ❌ Rota `/descricao-cargos/:id` retorna 404
- ❌ Confusão entre `/descricao-cargos` e `/descricao-cargos-uisa`
- ❌ Componentes duplicados ou inconsistentes
- ❌ Falta de integração com organograma

### 3.2 Correções Necessárias

**Rotas (App.tsx):**
```typescript
// ✅ CORRIGIDO: Adicionar rota faltante
<Route path="/descricao-cargos/:id" component={DetalhesDescricaoCargo} />

// Estrutura final:
<Route path="/descricao-cargos/importar" component={ImportadorDescricoesCargo} />
<Route path="/descricao-cargos/aprovar-superior" component={AprovarDescricaoSuperior} />
<Route path="/descricao-cargos/aprovar-rh" component={AprovarDescricaoRH} />
<Route path="/descricao-cargos/:id" component={DetalhesDescricaoCargo} />
<Route path="/descricao-cargos" component={DescricaoCargos} />
<Route path="/descricao-cargos-uisa" component={DescricaoCargosUISA} />
<Route path="/descricao-cargos-uisa/criar" component={CriarDescricaoCargo} />
<Route path="/descricao-cargos-uisa/:id" component={DetalhesDescricaoCargo} />
```

**Componentes:**
- ✅ Unificar `DetalhesDescricaoCargo` para ambas as rotas
- ✅ Adicionar breadcrumbs consistentes
- ✅ Integrar com organograma (mostrar posição na hierarquia)
- ✅ Adicionar link para visualizar funcionários no cargo
- ✅ Melhorar fluxo de aprovação

**Backend:**
- ✅ Validar que procedures `jobDescriptions.*` existem
- ✅ Adicionar procedure para listar funcionários por cargo
- ✅ Adicionar procedure para vincular cargo ao organograma

---

## 📊 Fase 4: Funcionalidades Avançadas

### 4.1 Dashboard do Organograma

**Métricas e KPIs:**
- Total de funcionários por nível
- Span of control (média de subordinados por gestor)
- Profundidade da hierarquia
- Departamentos com mais funcionários
- Cargos mais comuns
- Taxa de movimentação (últimos 30/60/90 dias)

**Visualizações:**
- Gráfico de distribuição por nível
- Gráfico de distribuição por departamento
- Timeline de movimentações
- Mapa de calor de crescimento de equipes

### 4.2 Relatórios

**Tipos de Relatórios:**
1. **Relatório de Estrutura Organizacional**
   - Hierarquia completa em formato de árvore
   - Exportação em PDF/Excel

2. **Relatório de Movimentações**
   - Histórico de mudanças de gestor
   - Promoções, transferências, reorganizações
   - Filtros por período, departamento, tipo

3. **Relatório de Span of Control**
   - Gestores com muitos subordinados diretos
   - Recomendações de redistribuição

4. **Relatório de Sucessão**
   - Identificar posições críticas
   - Mapear sucessores potenciais

### 4.3 Notificações

**Eventos que Geram Notificações:**
- Mudança de gestor (notificar funcionário, gestor anterior, novo gestor)
- Novo subordinado (notificar gestor)
- Movimentação em massa (notificar RH e diretores)
- Aprovação de descrição de cargo (notificar solicitante)

---

## 🧪 Fase 5: Testes

### 5.1 Testes Unitários (Vitest)

**Backend:**
```typescript
// orgChartRouter.test.ts
describe('Organograma - Backend', () => {
  test('Deve retornar hierarquia completa', async () => {});
  test('Deve validar ciclo na hierarquia', async () => {});
  test('Deve mover funcionário corretamente', async () => {});
  test('Deve registrar histórico de mudanças', async () => {});
  test('Deve calcular níveis hierárquicos', async () => {});
});
```

**Frontend:**
```typescript
// OrganogramaInterativo.test.tsx
describe('Organograma - Frontend', () => {
  test('Deve renderizar árvore hierárquica', () => {});
  test('Deve permitir drag-and-drop', () => {});
  test('Deve validar movimentação inválida', () => {});
  test('Deve filtrar por departamento', () => {});
  test('Deve buscar por nome', () => {});
});
```

### 5.2 Testes de Integração

**Fluxos Completos:**
1. Criar funcionário → Atribuir gestor → Visualizar no organograma
2. Mover funcionário → Validar histórico → Verificar notificações
3. Buscar funcionário → Destacar no organograma → Ver detalhes
4. Exportar organograma → Validar arquivo gerado

### 5.3 Testes Manuais

**Checklist:**
- [ ] Organograma carrega corretamente com dados reais
- [ ] Drag-and-drop funciona em todos os navegadores
- [ ] Validações impedem movimentações inválidas
- [ ] Histórico registra todas as mudanças
- [ ] Notificações são enviadas corretamente
- [ ] Exportação gera arquivos corretos
- [ ] Performance com 1000+ funcionários
- [ ] Responsividade em mobile/tablet

---

## 📅 Cronograma de Implementação

### Sprint 1 (Dias 1-3): Backend e Estrutura
- ✅ Validar schema do banco de dados
- ✅ Criar/atualizar procedures tRPC
- ✅ Implementar validações de negócio
- ✅ Criar testes unitários backend

### Sprint 2 (Dias 4-6): Interface Básica
- ✅ Criar componentes base do organograma
- ✅ Implementar visualização em árvore
- ✅ Adicionar cores por nível
- ✅ Implementar busca e filtros

### Sprint 3 (Dias 7-9): Interatividade
- ✅ Implementar drag-and-drop
- ✅ Adicionar validações visuais
- ✅ Implementar zoom e pan
- ✅ Adicionar minimap

### Sprint 4 (Dias 10-12): Funcionalidades Avançadas
- ✅ Dashboard de métricas
- ✅ Relatórios e exportação
- ✅ Sistema de notificações
- ✅ Histórico de movimentações

### Sprint 5 (Dias 13-14): Correções e Testes
- ✅ Corrigir descrições de cargo
- ✅ Testes de integração
- ✅ Ajustes de UX
- ✅ Documentação

---

## 🚀 Entregáveis Finais

### Funcionalidades Implementadas
1. ✅ Organograma hierárquico interativo completo
2. ✅ Drag-and-drop com validações
3. ✅ Sistema de busca e filtros avançados
4. ✅ Dashboard com métricas e KPIs
5. ✅ Relatórios de estrutura e movimentações
6. ✅ Exportação em múltiplos formatos
7. ✅ Sistema de notificações
8. ✅ Histórico completo de mudanças
9. ✅ Integração com descrições de cargo
10. ✅ Testes automatizados completos

### Documentação
1. ✅ Manual de uso do organograma
2. ✅ Guia de administração
3. ✅ Documentação técnica da API
4. ✅ Guia de troubleshooting

---

## 📝 Notas de Implementação

### Prioridades
1. **CRÍTICO**: Validação de ciclos na hierarquia
2. **CRÍTICO**: Histórico de todas as mudanças
3. **ALTO**: Performance com grandes volumes
4. **ALTO**: Experiência de drag-and-drop fluida
5. **MÉDIO**: Exportação e relatórios
6. **BAIXO**: Animações e transições

### Considerações Técnicas
- Usar React DnD para drag-and-drop
- Usar D3.js ou ReactFlow para visualização de árvore
- Implementar virtualização para grandes hierarquias
- Cache de queries frequentes
- Debounce em buscas e filtros
- Lazy loading de níveis profundos

### Riscos e Mitigações
- **Risco**: Performance com muitos funcionários
  - **Mitigação**: Virtualização, lazy loading, cache
- **Risco**: Complexidade de validação de ciclos
  - **Mitigação**: Algoritmo de detecção de ciclos eficiente
- **Risco**: Conflitos em movimentações simultâneas
  - **Mitigação**: Locks otimistas, validação no backend

---

## ✅ Checklist de Conclusão

### Backend
- [ ] Schema validado e atualizado
- [ ] 10 procedures tRPC implementadas
- [ ] Validações de negócio completas
- [ ] Testes unitários (>80% cobertura)

### Frontend
- [ ] 9 componentes criados
- [ ] Drag-and-drop funcional
- [ ] Busca e filtros implementados
- [ ] Dashboard de métricas
- [ ] Exportação funcionando

### Integrações
- [ ] Descrições de cargo corrigidas
- [ ] Notificações integradas
- [ ] Histórico registrado
- [ ] Relatórios gerados

### Qualidade
- [ ] Testes automatizados passando
- [ ] Performance validada
- [ ] Responsividade testada
- [ ] Documentação completa

---

**Status**: 🚧 Pronto para Implementação
**Última Atualização**: 25/12/2025
