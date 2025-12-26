# Análise da Estrutura Atual do Sistema AVD UISA

## Data da Análise
26 de dezembro de 2025

## Resumo Executivo

O sistema AVD UISA já possui uma estrutura robusta de **mais de 50 tabelas** no banco de dados, totalizando **9.562 linhas** no arquivo `schema.ts`. A análise identificou que **muitas funcionalidades já estão implementadas**, mas existem **oportunidades significativas de expansão e aprimoramento**.

---

## 1. Estrutura Organizacional Existente

### 1.1 Tabelas Principais Identificadas

#### ✅ Já Implementado

**Usuários e Autenticação:**
- `users` - Usuários do sistema com roles (admin, rh, gestor, colaborador)
- `adminUsers` - Usuários administrativos
- `passwordResetTokens` - Tokens de recuperação de senha
- `passwordChangeHistory` - Histórico de mudanças de senha

**Estrutura Organizacional:**
- `departments` - Departamentos com hierarquia (parentId) e gestor (managerId)
- `costCenters` - Centros de custo vinculados a departamentos
- `positions` - Cargos com descrição completa, níveis hierárquicos e competências
- `employees` - Funcionários com vinculação a usuário, cargo, departamento e líder

**Competências:**
- `competencies` - Competências organizacionais
- `competencyLevels` - Níveis de proficiência
- `positionCompetencies` - Competências por cargo
- `employeeCompetencies` - Competências dos funcionários

**Avaliação de Desempenho:**
- `evaluationCycles` - Ciclos de avaliação
- `goals` - Metas e objetivos
- `goalUpdates` - Atualizações de progresso de metas
- `performanceEvaluations` - Avaliações de desempenho
- `evaluationQuestions` - Questões de avaliação
- `evaluationResponses` - Respostas das avaliações

**Calibração e 9-Box:**
- `calibrationSessions` - Sessões de calibração
- `calibrationReviews` - Revisões de calibração
- `calibrationMessages` - Mensagens de calibração
- `nineBoxPositions` - Posicionamento na matriz 9-box

**PDI (Plano de Desenvolvimento Individual):**
- `pdiPlans` - Planos de desenvolvimento
- `developmentActions` - Ações de desenvolvimento
- `pdiItems` - Itens do PDI
- `pdiProgress` - Progresso do PDI

**Sucessão:**
- `successionPlans` - Planos de sucessão
- `successionCandidates` - Candidatos a sucessão
- `successionHistory` - Histórico de sucessão

**Testes Psicométricos:**
- `psychometricTests` - Testes psicométricos
- `testQuestions` - Questões dos testes
- `testInvitations` - Convites para testes
- `testResponses` - Respostas dos testes
- `testResults` - Resultados dos testes

**Bônus e Remuneração:**
- `bonusPolicies` - Políticas de bônus por cargo
- `bonusCalculations` - Cálculos de bônus
- `bonusAuditLogs` - Auditoria de bônus
- `bonusApprovalComments` - Comentários de aprovação

**Sistema de Notificações e Auditoria:**
- `notifications` - Notificações do sistema
- `emailMetrics` - Métricas de emails enviados
- `auditLogs` - Logs de auditoria
- `auditAlerts` - Alertas de auditoria
- `alertRules` - Regras de alertas

**Gamificação:**
- `badges` - Badges/conquistas
- `employeeBadges` - Badges dos funcionários
- `feedbacks` - Feedbacks

---

## 2. Análise Detalhada da Tabela `positions` (Cargos)

### 2.1 Campos Existentes

A tabela `positions` já possui uma estrutura **muito completa**:

```typescript
{
  id: int,
  code: varchar(50), // Código único do cargo
  title: varchar(255), // Título do cargo
  description: text, // Descrição geral
  level: enum["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"],
  departmentId: int, // Departamento vinculado
  salaryMin: int, // Salário mínimo
  salaryMax: int, // Salário máximo
  
  // Campos de Descrição Completa (UISA)
  mission: text, // Missão do cargo
  responsibilities: json<string[]>, // Lista de responsabilidades
  technicalCompetencies: json<string[]>, // Competências técnicas
  behavioralCompetencies: json<string[]>, // Competências comportamentais
  requirements: json<{education, experience, certifications}>, // Requisitos
  kpis: json<{name, description, target}[]>, // Indicadores de performance
  
  active: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2.2 Funcionalidades de Cargos Já Disponíveis

✅ **Já Implementado:**
- Cadastro básico de cargos
- Descrição completa com missão, responsabilidades e competências
- Níveis hierárquicos definidos
- Faixas salariais
- KPIs por cargo
- Requisitos (formação, experiência, certificações)

### 2.3 Oportunidades de Melhoria em Cargos

❌ **Ainda Não Implementado:**
- **Versionamento de descrições** - Histórico de alterações na descrição do cargo
- **Fluxo de aprovação** - Workflow para aprovar/rejeitar descrições de cargos
- **Trilhas de carreira** - Progressão entre cargos (de júnior para pleno, etc)
- **Cargos similares/relacionados** - Mapeamento de cargos equivalentes
- **Templates de descrição** - Templates pré-definidos por área
- **Comparação de cargos** - Ferramenta para comparar requisitos entre cargos

---

## 3. Análise Detalhada da Tabela `employees` (Funcionários)

### 3.1 Campos Existentes (Parcial - arquivo muito grande)

```typescript
{
  id: int,
  userId: int, // Vinculação com usuário do sistema
  // ... (precisa ler mais para ver campos completos)
}
```

### 3.2 Funcionalidades Esperadas de Funcionários

**Dados Pessoais:**
- Nome completo, CPF, RG, data de nascimento
- Endereço completo
- Contatos (telefone, email pessoal)
- Foto do funcionário

**Dados Contratuais:**
- Tipo de contrato (CLT, PJ, estágio, etc)
- Data de admissão
- Data de desligamento (se aplicável)
- Carga horária
- Salário atual
- Centro de custo

**Hierarquia:**
- Cargo atual (positionId)
- Departamento (departmentId)
- Líder direto (managerId)
- Líderes funcionais (se houver matriz)

**Histórico:**
- Histórico de cargos
- Histórico de departamentos
- Histórico de líderes
- Histórico salarial

---

## 4. Gestão de Liderança

### 4.1 Estrutura Atual

✅ **Já Implementado:**
- Campo `managerId` em `employees` para líder direto
- Campo `managerId` em `departments` para gestor do departamento
- Role `gestor` em `users` para permissões de liderança

### 4.2 Oportunidades de Melhoria

❌ **Ainda Não Implementado:**
- **Dashboard específico para líderes** - Visão consolidada da equipe
- **Gestão de múltiplos líderes** - Liderança matricial (funcional + administrativa)
- **Span of control** - Análise de amplitude de controle
- **1:1s estruturados** - Agenda e registro de reuniões individuais
- **Avaliação de liderança** - 360° específico para competências de liderança
- **Pipeline de líderes** - Identificação e desenvolvimento de futuros líderes

---

## 5. Hierarquia e Organograma

### 5.1 Estrutura Atual

✅ **Já Implementado:**
- Hierarquia de departamentos (parentId)
- Relacionamento líder-liderado (managerId)
- Estrutura de cargos com níveis

### 5.2 Funcionalidades de Organograma

**Verificar se existe:**
- [ ] Visualização gráfica de organograma
- [ ] Busca no organograma
- [ ] Filtros por departamento
- [ ] Exportação do organograma
- [ ] Organograma por cargo
- [ ] Validação de ciclos hierárquicos

---

## 6. Sistema de Aprovações

### 6.1 Aprovações Existentes

✅ **Já Implementado:**
- Aprovação de políticas de bônus (`bonusPolicies.approvalStatus`)
- Aprovação de cálculos de bônus (`bonusCalculations.status`)

### 6.2 Aprovações Necessárias

❌ **Ainda Não Implementado:**
- Aprovação de descrições de cargos
- Aprovação de promoções
- Aprovação de transferências
- Aprovação de ajustes salariais
- Aprovação de PDIs

---

## 7. Relatórios e Dashboards

### 7.1 Dados Disponíveis para Relatórios

Com a estrutura atual, é possível criar relatórios de:

✅ **Dados Disponíveis:**
- Headcount por departamento
- Distribuição de funcionários por cargo
- Distribuição de funcionários por nível
- Análise de competências organizacionais
- Resultados de avaliações de desempenho
- Status de metas e objetivos
- Posicionamento 9-box
- Planos de sucessão
- Resultados de testes psicométricos
- Cálculos de bônus

### 7.2 Relatórios a Desenvolver

❌ **Ainda Não Implementado:**
- Dashboard executivo de RH
- Relatório de turnover
- Relatório de tempo médio de permanência
- Análise de gap de competências
- Relatório de diversidade
- Análise de custo por cargo
- Projeções de headcount
- ROI de desenvolvimento

---

## 8. Integrações e Automações

### 8.1 Sistema de Notificações

✅ **Já Implementado:**
- Tabela `notifications` para notificações
- Tabela `emailMetrics` para tracking de emails

### 8.2 Workflows Automáticos

❌ **Ainda Não Implementado:**
- Workflow de aprovação de promoção
- Workflow de aprovação de transferência
- Workflow de revisão salarial
- Workflow de atualização de descrição de cargo
- Workflow de offboarding
- Notificações de aniversário de empresa
- Lembretes de 1:1 para líderes

---

## 9. Segurança e Auditoria

### 9.1 Auditoria Existente

✅ **Já Implementado:**
- `auditLogs` - Logs gerais de auditoria
- `bonusAuditLogs` - Auditoria específica de bônus
- `passwordChangeHistory` - Histórico de mudanças de senha
- `auditAlerts` - Alertas de auditoria
- `alertRules` - Regras de alertas

### 9.2 Melhorias de Auditoria

❌ **Ainda Não Implementado:**
- Log de acesso a dados sensíveis de funcionários
- Relatório de auditoria consolidado
- Mascaramento de dados sensíveis
- Controle de exportação de dados
- Rastreabilidade completa de mudanças em cargos

---

## 10. Conclusões e Recomendações

### 10.1 Pontos Fortes do Sistema Atual

1. **Estrutura de dados muito completa** - 50+ tabelas cobrindo todos os aspectos de gestão de pessoas
2. **Descrição de cargos robusta** - Campos detalhados para missão, responsabilidades, competências e KPIs
3. **Sistema de competências implementado** - Competências organizacionais, por cargo e por funcionário
4. **Avaliação de desempenho completa** - Ciclos, metas, avaliações, calibração e 9-box
5. **PDI estruturado** - Planos, ações e acompanhamento de desenvolvimento
6. **Sucessão planejada** - Planos de sucessão e candidatos
7. **Bônus e remuneração** - Políticas, cálculos e aprovações
8. **Auditoria e segurança** - Logs, alertas e histórico

### 10.2 Áreas Prioritárias para Expansão

#### 🔴 PRIORIDADE ALTA (Impacto Imediato)

1. **Dashboard de Líderes**
   - Visão consolidada da equipe
   - Indicadores de desempenho
   - Alertas e pendências
   - Acesso rápido a avaliações e PDIs

2. **Fluxo de Aprovação de Descrições de Cargos**
   - Workflow de criação/edição
   - Notificações para aprovadores
   - Interface de revisão
   - Histórico de versões

3. **Organograma Interativo Completo**
   - Visualização gráfica hierárquica
   - Busca e filtros
   - Exportação (PDF, PNG)
   - Navegação intuitiva

4. **Gestão de Movimentações**
   - Promoções
   - Transferências
   - Mudanças de líder
   - Histórico completo

#### 🟡 PRIORIDADE MÉDIA (Melhoria Significativa)

5. **Trilhas de Carreira**
   - Progressão entre níveis
   - Critérios de promoção
   - Visualização de plano de carreira
   - Simulador de progressão

6. **Dashboard Executivo de RH**
   - Indicadores estratégicos
   - Análise de turnover
   - Custo por cargo
   - Projeções de headcount

7. **Relatórios Avançados**
   - Relatório de diversidade
   - Análise de gap de competências
   - ROI de desenvolvimento
   - Tempo médio de permanência

8. **Workflows Automáticos**
   - Aprovação de promoções
   - Aprovação de transferências
   - Revisão salarial
   - Offboarding

#### 🟢 PRIORIDADE BAIXA (Refinamento)

9. **Onboarding Estruturado**
   - Checklist de integração
   - Atribuição de mentor
   - Plano 30-60-90 dias

10. **1:1s Estruturados**
    - Agenda de reuniões
    - Registro de conversas
    - Acompanhamento de ações

11. **Gestão de Liderança Matricial**
    - Múltiplos líderes
    - Liderança funcional vs administrativa

12. **Importação em Massa**
    - Upload de CSV/Excel
    - Validação de dados
    - Relatório de erros

### 10.3 Estratégia de Implementação Recomendada

**Fase 1 - Fundação (1-2 semanas):**
- Análise completa da tabela `employees` (ler arquivo completo)
- Documentar procedures tRPC existentes
- Mapear interfaces frontend já implementadas
- Identificar gaps entre backend e frontend

**Fase 2 - Liderança (2-3 semanas):**
- Implementar dashboard de líderes
- Criar ferramentas de gestão de equipe
- Desenvolver relatórios de equipe
- Implementar notificações para líderes

**Fase 3 - Cargos (2-3 semanas):**
- Implementar fluxo de aprovação de descrições
- Criar versionamento de descrições
- Desenvolver trilhas de carreira
- Implementar comparação de cargos

**Fase 4 - Organograma (1-2 semanas):**
- Desenvolver visualização interativa
- Implementar busca e filtros
- Adicionar exportação
- Validação de ciclos hierárquicos

**Fase 5 - Movimentações (2-3 semanas):**
- Implementar registro de promoções
- Implementar transferências
- Criar workflows de aprovação
- Desenvolver histórico de movimentações

**Fase 6 - Relatórios (2-3 semanas):**
- Dashboard executivo de RH
- Relatórios de turnover e retenção
- Análise de diversidade
- Relatórios de custo

**Fase 7 - Automações (2-3 semanas):**
- Workflows automáticos
- Notificações inteligentes
- Lembretes e alertas
- Integrações

---

## 11. Próximos Passos Imediatos

### 11.1 Análise Técnica Detalhada

1. **Ler arquivo `schema.ts` completo**
   - Identificar todos os campos de `employees`
   - Verificar relacionamentos (relations)
   - Mapear índices e constraints

2. **Analisar procedures tRPC existentes**
   - Listar todos os routers
   - Documentar procedures por módulo
   - Identificar procedures faltantes

3. **Mapear interfaces frontend**
   - Listar páginas existentes
   - Identificar componentes reutilizáveis
   - Verificar integração com tRPC

### 11.2 Priorização com Usuário

Antes de iniciar a implementação, é **fundamental** validar com o usuário:

1. **Quais funcionalidades são mais urgentes?**
2. **Qual é o fluxo de trabalho atual da UISA?**
3. **Quais são as dores mais críticas dos usuários?**
4. **Existem integrações com outros sistemas?**
5. **Qual é o prazo esperado para entrega?**

---

## 12. Perguntas para o Usuário

Para direcionar melhor a implementação, preciso entender:

### 12.1 Sobre Cargos
- ✅ O sistema já possui descrições de cargos cadastradas?
- ✅ Existe um processo formal de aprovação de descrições?
- ✅ Quem são os aprovadores (RH, Líderes, Diretoria)?
- ✅ Com que frequência as descrições são atualizadas?

### 12.2 Sobre Funcionários
- ✅ Quantos funcionários a UISA possui atualmente?
- ✅ Os dados já estão no sistema ou precisam ser importados?
- ✅ Existe integração com sistema de folha de pagamento?
- ✅ Quais dados são considerados sensíveis?

### 12.3 Sobre Liderança
- ✅ Quantos níveis hierárquicos existem na UISA?
- ✅ Existe liderança matricial (múltiplos líderes)?
- ✅ Os líderes já utilizam o sistema ativamente?
- ✅ Quais são as principais necessidades dos líderes?

### 12.4 Sobre Prioridades
- ✅ Qual funcionalidade traria mais valor imediato?
- ✅ Existe algum processo manual que precisa urgentemente ser automatizado?
- ✅ Qual é o público-alvo principal (RH, Líderes, Funcionários)?
- ✅ Existe alguma deadline ou evento importante (ciclo de avaliação, etc)?

---

## Conclusão

O sistema AVD UISA possui uma **base sólida e muito bem estruturada**. A estratégia recomendada é **expandir incrementalmente** as funcionalidades existentes, priorizando:

1. **Dashboard de Líderes** - Alto impacto, uso diário
2. **Fluxo de Aprovação de Cargos** - Processo crítico de RH
3. **Organograma Interativo** - Visualização essencial
4. **Gestão de Movimentações** - Rastreabilidade e compliance

Com essas 4 funcionalidades implementadas, o sistema estará **significativamente mais completo** e pronto para atender as necessidades diárias de RH, líderes e colaboradores.
