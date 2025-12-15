# Funcionalidades Avançadas - Sistema AVD UISA

## Resumo das Implementações (13/12/2025)

Este documento descreve as funcionalidades avançadas implementadas no Sistema AVD UISA, focadas em melhorar a análise e exportação de dados de avaliações PIR.

---

## 1. População de Dados de Teste PIR

### Descrição
Sistema completo de seed para popular o banco de dados com avaliações PIR realistas para testes e demonstrações.

### Arquivos Criados
- `scripts/seed-pir-questions.ts` - Popula 60 questões PIR (10 por dimensão)
- `scripts/seed-pir-data.ts` - Cria 6 perfis de funcionários com avaliações completas

### Perfis de Teste Criados
1. **João Silva** - Desenvolvedor Senior (Tecnologia)
   - Score Geral: 73 | IP: 85, ID: 70, IC: 60, ES: 75, FL: 80, AU: 65

2. **Maria Santos** - Gerente de RH
   - Score Geral: 83 | IP: 90, ID: 85, IC: 95, ES: 80, FL: 70, AU: 75

3. **Pedro Costa** - Analista Financeiro
   - Score Geral: 62 | IP: 50, ID: 60, IC: 55, ES: 90, FL: 45, AU: 70

4. **Ana Oliveira** - Coordenadora de Marketing
   - Score Geral: 82 | IP: 95, ID: 75, IC: 85, ES: 65, FL: 90, AU: 80

5. **Carlos Ferreira** - Supervisor de Operações
   - Score Geral: 72 | IP: 60, ID: 85, IC: 70, ES: 85, FL: 55, AU: 75

6. **Juliana Alves** - Executiva de Vendas
   - Score Geral: 82 | IP: 92, ID: 80, IC: 88, ES: 70, FL: 85, AU: 78

### Como Executar
```bash
# 1. Popular questões PIR (executar apenas uma vez)
pnpm tsx scripts/seed-pir-questions.ts

# 2. Popular dados de avaliações
pnpm tsx scripts/seed-pir-data.ts
```

### Benefícios
- ✅ Dados realistas para testes
- ✅ Diferentes perfis comportamentais
- ✅ Validação de dashboards e relatórios
- ✅ Demonstrações para stakeholders

---

## 2. Comparação Temporal de PIR

### Descrição
Funcionalidade completa para visualizar e analisar a evolução dos resultados PIR ao longo do tempo.

### Arquivos Criados
- `server/pirRouter.ts` - Endpoints tRPC para comparação temporal
- `client/src/pages/PIRComparacao.tsx` - Interface de comparação

### Funcionalidades

#### 2.1 Seleção de Dados
- Filtro por funcionário
- Filtro por período (3 meses, 6 meses, 1 ano, todos)
- Busca automática de funcionários com avaliações

#### 2.2 Visualizações

**Gráfico de Evolução Temporal (Linha)**
- Mostra evolução de todas as 6 dimensões ao longo do tempo
- Cores distintas por dimensão
- Eixo X: Datas das avaliações
- Eixo Y: Scores (0-100)

**Gráfico Radar (Comparação)**
- Compara primeira vs última avaliação
- Visualização clara da evolução do perfil
- Sobreposição de duas camadas

#### 2.3 Análise de Tendências
- Cards individuais por dimensão
- Indicadores visuais (↑ crescimento, ↓ declínio, — estável)
- Cálculo de variação absoluta e percentual
- Identificação automática de dimensões em crescimento/declínio

#### 2.4 Insights Automáticos
- Análise estatística (média, desvio padrão)
- Identificação de tendências gerais
- Alertas para alta variabilidade
- Resumo do período analisado

### Endpoints tRPC
```typescript
// Buscar funcionários com avaliações
trpc.pir.getEmployeesWithAssessments.useQuery()

// Buscar histórico de um funcionário
trpc.pir.getAssessmentHistory.useQuery({ 
  employeeId: number, 
  period: '3months' | '6months' | '1year' | 'all' 
})

// Comparar duas avaliações específicas
trpc.pir.compareAssessments.useQuery({
  employeeId: number,
  assessment1Id: number,
  assessment2Id: number
})

// Gerar insights automáticos
trpc.pir.generateInsights.useQuery({ employeeId: number })
```

### Rota de Acesso
```
/pir/comparacao
```

### Benefícios
- ✅ Acompanhamento de evolução individual
- ✅ Identificação de padrões de desenvolvimento
- ✅ Validação de efetividade de PDIs
- ✅ Tomada de decisão baseada em dados históricos

---

## 3. Exportação Avançada de Relatórios

### Descrição
Sistema completo de exportação de dados PIR em formatos Excel e CSV com formatação profissional.

### Arquivos Criados
- `server/pirExportRouter.ts` - Endpoints de exportação
- `client/src/pages/PIRExportacao.tsx` - Interface de exportação

### Funcionalidades

#### 3.1 Tipos de Relatório

**Relatório Individual**
- Exportação detalhada de uma avaliação específica
- Formato: Excel (.xlsx)
- Conteúdo:
  - Aba "Resumo": Dados do funcionário e scores
  - Aba "Respostas": Todas as questões e respostas detalhadas

**Relatório Consolidado**
- Exportação de múltiplas avaliações
- Formatos: Excel (.xlsx) ou CSV (.csv)
- Filtros disponíveis:
  - Data início/fim
  - Departamento
  - Funcionários específicos

#### 3.2 Formatação Profissional (Excel)
- ✅ Cabeçalhos estilizados (azul com texto branco)
- ✅ Colunas com largura automática
- ✅ Formatação de datas em pt-BR
- ✅ Estatísticas automáticas (média, máximo, mínimo)
- ✅ Múltiplas abas organizadas

#### 3.3 Estatísticas Incluídas
- Média geral de scores
- Score máximo e mínimo
- Total de avaliações
- Distribuição por departamento
- Análise de tendências

### Endpoints tRPC
```typescript
// Exportar relatório individual em Excel
trpc.pirExport.exportIndividualExcel.useMutation({ 
  assessmentId: number 
})

// Exportar relatório consolidado em Excel
trpc.pirExport.exportConsolidatedExcel.useMutation({
  employeeIds?: number[],
  startDate?: string,
  endDate?: string,
  department?: string
})

// Exportar para CSV
trpc.pirExport.exportCSV.useMutation({
  employeeIds?: number[],
  startDate?: string,
  endDate?: string
})
```

### Rota de Acesso
```
/pir/exportacao
```

### Armazenamento
- Arquivos gerados são armazenados no S3
- URLs públicas geradas automaticamente
- Download direto via browser

### Benefícios
- ✅ Relatórios prontos para apresentação
- ✅ Integração com outros sistemas (CSV)
- ✅ Análise offline em Excel
- ✅ Compartilhamento fácil com stakeholders
- ✅ Backup de dados históricos

---

## Tecnologias Utilizadas

### Backend
- **tRPC** - Type-safe API
- **Drizzle ORM** - Database queries
- **ExcelJS** - Geração de arquivos Excel
- **MySQL** - Banco de dados

### Frontend
- **React 19** - Interface de usuário
- **Recharts** - Gráficos interativos
- **shadcn/ui** - Componentes UI
- **TanStack Query** - Data fetching

### Infraestrutura
- **S3** - Armazenamento de arquivos
- **TypeScript** - Type safety
- **Vite** - Build tool

---

## Próximos Passos Sugeridos

### Melhorias Futuras
1. **Gráficos Avançados**
   - Adicionar gráficos de dispersão
   - Implementar heatmaps de evolução
   - Criar visualizações 3D

2. **Análise Preditiva**
   - Machine learning para prever tendências
   - Alertas automáticos de desvios
   - Recomendações personalizadas

3. **Integração**
   - API REST para sistemas externos
   - Webhooks para notificações
   - Sincronização com HRIS

4. **Relatórios Customizados**
   - Template builder visual
   - Agendamento de exportações
   - Envio automático por email

---

## Suporte e Documentação

### Scripts Disponíveis
```bash
# Popular questões PIR
pnpm tsx scripts/seed-pir-questions.ts

# Popular dados de teste
pnpm tsx scripts/seed-pir-data.ts

# Executar servidor de desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

### Rotas do Sistema
- `/pir/dashboard` - Dashboard principal PIR
- `/pir/comparacao` - Comparação temporal
- `/pir/exportacao` - Exportação de relatórios
- `/pir/relatorio/:employeeId` - Relatório individual

### Contato
Para dúvidas ou suporte, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento.

---

**Versão:** 1.0.0  
**Data:** 13/12/2025  
**Autor:** Sistema AVD UISA - Equipe de Desenvolvimento
