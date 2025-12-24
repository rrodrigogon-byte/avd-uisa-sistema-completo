# PLANO COMPLETO DE IMPLEMENTAÇÃO - SISTEMA AVD UISA

## Data: 13/12/2025
## Objetivo: Corrigir todos os erros, implementar descrições de cargos e importar todos os funcionários

---

## 📋 RESUMO EXECUTIVO

### Escopo Total
1. ✅ **Correção de Erros Críticos** - PIR, autenticação, TypeScript
2. 🆕 **Sistema de Descrições de Cargos** - Implementação completa
3. 🆕 **Importação de Funcionários** - Todos os funcionários ativos
4. ✅ **Implementação PIR Completo** - Passos 2, 3 e 4
5. ✅ **Correção de Reload** - Todas as páginas
6. ✅ **Testes End-to-End** - Garantir 100% funcional

### Tempo Estimado
- **Fase 1-2**: 2-3 horas (correções críticas)
- **Fase 3-6**: 4-5 horas (descrições de cargos)
- **Fase 7**: 1-2 horas (importação funcionários)
- **Fase 8-9**: 3-4 horas (PIR completo + reload)
- **Fase 10**: 2-3 horas (testes)
- **Total**: 12-17 horas

---

## 🔥 FASE 1: RESOLVER CRASH DO TYPESCRIPT E PROBLEMAS CRÍTICOS

### Problema
- TypeScript crashando com exit code 134 (out of memory)
- 864 erros acumulados
- Servidor não inicia corretamente

### Ações
- [ ] 1.1. Aumentar memória do Node.js
  ```bash
  export NODE_OPTIONS="--max-old-space-size=8192"
  ```

- [ ] 1.2. Limpar cache e node_modules
  ```bash
  cd /home/ubuntu/avd-uisa-sistema-completo
  rm -rf node_modules client/.vite .next
  pnpm install
  ```

- [ ] 1.3. Verificar e corrigir erros de TypeScript em lote
  ```bash
  pnpm tsc --noEmit --incremental
  ```

- [ ] 1.4. Reiniciar servidor com memória aumentada
  ```bash
  NODE_OPTIONS="--max-old-space-size=8192" pnpm run dev
  ```

### Critérios de Sucesso
- ✅ Servidor inicia sem erros
- ✅ TypeScript compila sem crashes
- ✅ Número de erros reduzido para < 10

---

## 🔐 FASE 2: CORRIGIR ERRO DE AUTENTICAÇÃO E SALVAMENTO DO PIR PASSO 1

### Problema
- Sistema redireciona para login ao tentar salvar
- Sessão de autenticação sendo perdida
- Dados não são salvos no banco

### Ações Implementadas
- [x] 2.1. Corrigir schema Zod no `saveProcessData`
  - Schema: `z.record(z.string(), z.any()).optional().default({})`
  
- [x] 2.2. Implementar salvamento real nos campos `step1Data`, `step2Data`, etc.

- [x] 2.3. Implementar `getProcessData` para recuperar dados salvos

- [x] 2.4. Adicionar logs de diagnóstico

### Ações Pendentes
- [ ] 2.5. Testar salvamento após resolver crash TypeScript

- [ ] 2.6. Verificar logs do servidor:
  ```
  [AVD] saveProcessData chamado: { userId, processId, step, employeeId }
  ```

- [ ] 2.7. Se logs não aparecem, investigar middleware de autenticação

- [ ] 2.8. Verificar configuração de cookies e CORS

### Critérios de Sucesso
- ✅ Usuário consegue salvar dados do Passo 1
- ✅ Dados são persistidos no banco
- ✅ Navegação para Passo 2 funciona
- ✅ Dados são recuperados ao voltar para Passo 1

---

## 📄 FASE 3: EXTRAIR E ANALISAR ESTRUTURA DAS DESCRIÇÕES DE CARGOS

### Objetivo
Analisar o arquivo `DESCRIÇÕES(2).zip` para entender a estrutura das descrições de cargos

### Ações
- [ ] 3.1. Extrair arquivo ZIP
  ```bash
  cd /home/ubuntu/upload
  unzip "DESCRIÇÕES(2).zip" -d descricoes_cargos
  ```

- [ ] 3.2. Listar e analisar arquivos
  ```bash
  ls -la descricoes_cargos/
  file descricoes_cargos/*
  ```

- [ ] 3.3. Identificar formato dos arquivos (PDF, Word, Excel, etc.)

- [ ] 3.4. Extrair estrutura de uma descrição de cargo exemplo:
  - Título do cargo
  - Departamento
  - Nível hierárquico
  - Missão/Objetivo
  - Responsabilidades
  - Competências técnicas
  - Competências comportamentais
  - Requisitos (formação, experiência)
  - Indicadores de desempenho

- [ ] 3.5. Criar documento de mapeamento de estrutura

### Critérios de Sucesso
- ✅ Estrutura completa das descrições identificada
- ✅ Campos obrigatórios e opcionais definidos
- ✅ Formato de dados padronizado

---

## 🗄️ FASE 4: CRIAR SCHEMA DE BANCO DE DADOS PARA DESCRIÇÕES DE CARGOS

### Objetivo
Criar tabelas no banco de dados para armazenar descrições de cargos

### Schema Proposto

```typescript
// drizzle/schema.ts

export const jobDescriptions = mysqlTable("job_descriptions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações Básicas
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  jobCode: varchar("job_code", { length: 50 }).unique(),
  department: varchar("department", { length: 255 }),
  area: varchar("area", { length: 255 }),
  reportingTo: varchar("reporting_to", { length: 255 }),
  hierarchyLevel: mysqlEnum("hierarchy_level", [
    "operacional",
    "tecnico",
    "supervisao",
    "coordenacao",
    "gerencia",
    "diretoria",
    "presidencia"
  ]),
  
  // Descrição do Cargo
  mission: text("mission"), // Missão/Objetivo do cargo
  summary: text("summary"), // Resumo executivo
  
  // Responsabilidades
  responsibilities: json("responsibilities"), // Array de strings
  mainActivities: json("main_activities"), // Array de objetos { activity, frequency, importance }
  
  // Competências
  technicalCompetencies: json("technical_competencies"), // Array de { name, level, required }
  behavioralCompetencies: json("behavioral_competencies"), // Array de { name, level, required }
  
  // Requisitos
  educationRequired: varchar("education_required", { length: 255 }),
  experienceRequired: varchar("experience_required", { length: 255 }),
  certifications: json("certifications"), // Array de strings
  languages: json("languages"), // Array de { language, level }
  
  // Indicadores de Desempenho
  kpis: json("kpis"), // Array de { name, target, measurement }
  
  // Informações Adicionais
  workConditions: text("work_conditions"),
  benefits: json("benefits"),
  salaryRange: varchar("salary_range", { length: 100 }),
  
  // Controle
  status: mysqlEnum("status", ["ativo", "inativo", "em_revisao"]).default("ativo"),
  version: int("version").default(1),
  approvedBy: int("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // Auditoria
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Histórico de versões
export const jobDescriptionVersions = mysqlTable("job_description_versions", {
  id: int("id").autoincrement().primaryKey(),
  jobDescriptionId: int("job_description_id").notNull(),
  version: int("version").notNull(),
  data: json("data").notNull(), // Snapshot completo da descrição
  changedBy: int("changed_by").notNull(),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relacionamento cargo x funcionário
export const employeeJobDescriptions = mysqlTable("employee_job_descriptions", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull(),
  jobDescriptionId: int("job_description_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Ações
- [ ] 4.1. Adicionar schema no `drizzle/schema.ts`
- [ ] 4.2. Executar migration
  ```bash
  pnpm db:push
  ```
- [ ] 4.3. Verificar tabelas criadas no banco

### Critérios de Sucesso
- ✅ Tabelas criadas no banco de dados
- ✅ Relacionamentos configurados corretamente
- ✅ Índices otimizados

---

## ⚙️ FASE 5: IMPLEMENTAR BACKEND COMPLETO PARA DESCRIÇÕES DE CARGOS

### Objetivo
Criar procedures tRPC para CRUD completo de descrições de cargos

### Procedures a Implementar

```typescript
// server/routers/jobDescriptionsRouter.ts

export const jobDescriptionsRouter = router({
  // Listar todas as descrições
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["ativo", "inativo", "em_revisao"]).optional(),
      department: z.string().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      // Implementar listagem com filtros e paginação
    }),
  
  // Buscar por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // Buscar descrição completa
    }),
  
  // Criar nova descrição
  create: rhProcedure
    .input(z.object({
      jobTitle: z.string(),
      jobCode: z.string().optional(),
      department: z.string().optional(),
      // ... todos os campos
    }))
    .mutation(async ({ ctx, input }) => {
      // Criar nova descrição
      // Criar primeira versão no histórico
    }),
  
  // Atualizar descrição
  update: rhProcedure
    .input(z.object({
      id: z.number(),
      // ... campos a atualizar
    }))
    .mutation(async ({ ctx, input }) => {
      // Atualizar descrição
      // Incrementar versão
      // Salvar no histórico
    }),
  
  // Deletar (soft delete)
  delete: rhProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Marcar como inativo
    }),
  
  // Aprovar descrição
  approve: rhProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Marcar como aprovado
      // Registrar aprovador e data
    }),
  
  // Buscar histórico de versões
  getVersionHistory: protectedProcedure
    .input(z.object({ jobDescriptionId: z.number() }))
    .query(async ({ input }) => {
      // Listar todas as versões
    }),
  
  // Vincular funcionário a cargo
  assignToEmployee: rhProcedure
    .input(z.object({
      employeeId: z.number(),
      jobDescriptionId: z.number(),
      startDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Criar vínculo
    }),
  
  // Importar descrições em lote
  importBatch: rhProcedure
    .input(z.object({
      descriptions: z.array(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Importar múltiplas descrições
    }),
});
```

### Ações
- [ ] 5.1. Criar arquivo `server/routers/jobDescriptionsRouter.ts`
- [ ] 5.2. Implementar todas as procedures
- [ ] 5.3. Adicionar helpers no `server/db.ts`
- [ ] 5.4. Registrar router no `server/routers.ts`
- [ ] 5.5. Criar testes unitários

### Critérios de Sucesso
- ✅ Todas as procedures implementadas
- ✅ CRUD completo funcionando
- ✅ Validações de dados implementadas
- ✅ Testes passando

---

## 🎨 FASE 6: IMPLEMENTAR FRONTEND PARA GESTÃO DE DESCRIÇÕES DE CARGOS

### Objetivo
Criar interface completa para gerenciar descrições de cargos

### Páginas a Criar

#### 6.1. Lista de Descrições de Cargos
**Arquivo**: `client/src/pages/DescricoesCargos.tsx`

**Funcionalidades**:
- Tabela com todas as descrições
- Filtros (departamento, status, busca)
- Paginação
- Botões de ação (ver, editar, deletar)
- Botão "Nova Descrição"
- Exportar para PDF/Excel

#### 6.2. Visualizar Descrição de Cargo
**Arquivo**: `client/src/pages/DescricaoCargoDetalhes.tsx`

**Funcionalidades**:
- Exibir todas as informações da descrição
- Seções organizadas (responsabilidades, competências, requisitos)
- Botão "Editar"
- Botão "Imprimir/Exportar PDF"
- Histórico de versões

#### 6.3. Criar/Editar Descrição de Cargo
**Arquivo**: `client/src/pages/DescricaoCargoForm.tsx`

**Funcionalidades**:
- Formulário completo com todos os campos
- Validações
- Campos dinâmicos (adicionar/remover responsabilidades, competências)
- Preview em tempo real
- Salvar rascunho
- Enviar para aprovação

#### 6.4. Importação em Lote
**Arquivo**: `client/src/pages/ImportarDescricoesCargos.tsx`

**Funcionalidades**:
- Upload de arquivo (Excel, CSV)
- Preview dos dados
- Mapeamento de colunas
- Validação de dados
- Importar em lote

### Ações
- [ ] 6.1. Criar componente de lista
- [ ] 6.2. Criar componente de detalhes
- [ ] 6.3. Criar componente de formulário
- [ ] 6.4. Criar componente de importação
- [ ] 6.5. Adicionar rotas no `App.tsx`
- [ ] 6.6. Adicionar links no menu do dashboard
- [ ] 6.7. Criar componentes reutilizáveis (cards, badges, etc.)

### Critérios de Sucesso
- ✅ Interface intuitiva e responsiva
- ✅ Todas as funcionalidades implementadas
- ✅ Validações funcionando
- ✅ Feedback visual adequado

---

## 👥 FASE 7: IMPORTAR TODOS OS FUNCIONÁRIOS ATIVOS NO SISTEMA

### Objetivo
Importar todos os funcionários ativos (não apenas 100)

### Ações
- [ ] 7.1. Verificar fonte de dados dos funcionários
  - Arquivo Excel/CSV?
  - API externa?
  - Banco de dados legado?

- [ ] 7.2. Criar script de importação
  ```typescript
  // scripts/importar-funcionarios.ts
  ```

- [ ] 7.3. Validar dados antes da importação
  - CPF único
  - Email válido
  - Campos obrigatórios preenchidos

- [ ] 7.4. Executar importação
  ```bash
  pnpm tsx scripts/importar-funcionarios.ts
  ```

- [ ] 7.5. Verificar funcionários importados
  ```sql
  SELECT COUNT(*) FROM employees WHERE status = 'ativo';
  ```

- [ ] 7.6. Vincular funcionários às descrições de cargos

### Critérios de Sucesso
- ✅ Todos os funcionários ativos importados
- ✅ Dados validados e consistentes
- ✅ Vínculos com cargos criados
- ✅ Log de importação gerado

---

## 🧪 FASE 8: IMPLEMENTAR PIR PASSOS 2, 3 E 4 COMPLETOS

### Objetivo
Completar implementação do fluxo PIR com todos os 4 passos

### Passo 2: Identificação de Competências
**Arquivo**: `client/src/pages/avd/Passo2PIR.tsx` (já existe como TestPIR.tsx)

**Ações**:
- [ ] 8.1. Renomear/reorganizar TestPIR.tsx para Passo2PIR.tsx
- [ ] 8.2. Integrar com fluxo sequencial do AVD
- [ ] 8.3. Salvar resultados no processo AVD
- [ ] 8.4. Implementar navegação para Passo 3

### Passo 3: Metas e Indicadores
**Arquivo**: `client/src/pages/avd/Passo3Metas.tsx`

**Funcionalidades**:
- Definir metas SMART baseadas nos resultados do PIR
- Definir indicadores de desempenho
- Prazos e responsáveis
- Salvar e continuar

**Ações**:
- [ ] 8.5. Criar schema no backend para metas
- [ ] 8.6. Criar procedures tRPC
- [ ] 8.7. Implementar frontend
- [ ] 8.8. Integrar com processo AVD

### Passo 4: Revisão e Submissão
**Arquivo**: `client/src/pages/avd/Passo4Revisao.tsx`

**Funcionalidades**:
- Revisar todos os dados dos 3 passos anteriores
- Editar se necessário
- Confirmar e submeter
- Gerar PDF do processo completo

**Ações**:
- [ ] 8.9. Criar componente de revisão
- [ ] 8.10. Implementar geração de PDF
- [ ] 8.11. Implementar submissão final
- [ ] 8.12. Implementar notificações

### Critérios de Sucesso
- ✅ Fluxo completo de 4 passos funcionando
- ✅ Dados salvos em cada passo
- ✅ Navegação sequencial obrigatória
- ✅ PDF gerado corretamente
- ✅ Notificações enviadas

---

## 🔄 FASE 9: CORRIGIR PROBLEMAS DE RELOAD EM TODAS AS PÁGINAS

### Objetivo
Eliminar todos os casos de reload infinito causados por referências instáveis

### Estratégia
1. Identificar queries com objetos/arrays criados em render
2. Estabilizar referências com `useState`, `useMemo` ou `useCallback`
3. Testar cada página individualmente

### Páginas a Corrigir
- [ ] 9.1. DashboardGestor
- [ ] 9.2. DashboardAdminAVD
- [ ] 9.3. ProcessoDetalhes
- [ ] 9.4. Todas as páginas de relatórios
- [ ] 9.5. Todas as páginas de avaliação

### Padrão de Correção
```typescript
// ❌ Errado - cria novo array a cada render
const { data } = trpc.items.getByIds.useQuery({
  ids: [1, 2, 3],
});

// ✅ Correto - referência estável
const ids = useMemo(() => [1, 2, 3], []);
const { data } = trpc.items.getByIds.useQuery({ ids });

// ✅ Alternativa - useState
const [ids] = useState([1, 2, 3]);
const { data } = trpc.items.getByIds.useQuery({ ids });
```

### Critérios de Sucesso
- ✅ Nenhuma página com reload infinito
- ✅ Performance otimizada
- ✅ Queries executadas apenas quando necessário

---

## ✅ FASE 10: TESTAR SISTEMA COMPLETO END-TO-END E CORRIGIR TODOS OS ERROS

### Objetivo
Garantir que todo o sistema está 100% funcional sem erros

### Testes a Realizar

#### 10.1. Testes de Autenticação
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Sessão persiste após reload
- [ ] Redirecionamento correto após login

#### 10.2. Testes do PIR Completo
- [ ] Passo 1: Salvar dados pessoais
- [ ] Passo 2: Responder teste PIR (60 questões)
- [ ] Passo 3: Definir metas
- [ ] Passo 4: Revisar e submeter
- [ ] PDF gerado corretamente
- [ ] Notificações enviadas

#### 10.3. Testes de Descrições de Cargos
- [ ] Criar nova descrição
- [ ] Editar descrição existente
- [ ] Deletar descrição
- [ ] Aprovar descrição
- [ ] Vincular funcionário a cargo
- [ ] Importar descrições em lote
- [ ] Exportar para PDF

#### 10.4. Testes de Funcionários
- [ ] Listar todos os funcionários
- [ ] Buscar funcionário
- [ ] Visualizar perfil completo
- [ ] Editar dados
- [ ] Vincular a cargo

#### 10.5. Testes de Performance
- [ ] Páginas carregam em < 2 segundos
- [ ] Queries otimizadas
- [ ] Sem memory leaks
- [ ] Sem reload infinito

#### 10.6. Testes de Responsividade
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

#### 10.7. Testes de Navegação
- [ ] Todos os links funcionam
- [ ] Breadcrumbs corretos
- [ ] Voltar/avançar do navegador funciona

### Critérios de Sucesso
- ✅ 100% dos testes passando
- ✅ Zero erros no console
- ✅ Zero warnings críticos
- ✅ Performance aceitável

---

## 💾 FASE 11: CRIAR CHECKPOINT FINAL E ENTREGAR RESULTADOS

### Objetivo
Salvar estado final do sistema e entregar ao usuário

### Ações
- [ ] 11.1. Executar todos os testes finais
- [ ] 11.2. Criar checkpoint no sistema
  ```bash
  webdev_save_checkpoint "Sistema completo: PIR, Descrições de Cargos e Funcionários"
  ```
- [ ] 11.3. Gerar documentação final
  - Guia de uso do sistema
  - Documentação técnica
  - Changelog de alterações

- [ ] 11.4. Criar relatório de entrega
  - Funcionalidades implementadas
  - Testes realizados
  - Métricas de performance
  - Próximos passos sugeridos

### Critérios de Sucesso
- ✅ Checkpoint criado
- ✅ Documentação completa
- ✅ Relatório de entrega gerado
- ✅ Sistema 100% funcional

---

## 📊 MÉTRICAS DE SUCESSO FINAL

### Funcionalidades
- ✅ PIR completo (4 passos) - 100% funcional
- ✅ Descrições de Cargos - CRUD completo
- ✅ Funcionários - Todos importados
- ✅ Autenticação - 100% funcional
- ✅ Navegação - Sem erros

### Performance
- ✅ Tempo de carregamento < 2s
- ✅ Zero reload infinito
- ✅ Zero memory leaks
- ✅ TypeScript sem erros

### Qualidade
- ✅ Zero erros no console
- ✅ 100% dos testes passando
- ✅ Código documentado
- ✅ Responsivo em todos os dispositivos

---

## 🚀 PRÓXIMOS PASSOS APÓS ENTREGA

### Melhorias Futuras Sugeridas
1. Dashboard de analytics avançado
2. Relatórios personalizáveis
3. Integração com sistemas externos (RH, folha)
4. App mobile
5. Notificações push
6. Gamificação
7. IA para sugestões de desenvolvimento

---

**FIM DO PLANO**
