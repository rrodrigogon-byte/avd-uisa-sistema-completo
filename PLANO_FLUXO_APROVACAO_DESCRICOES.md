# Plano de Ação - Fluxo de Aprovação de Descrições de Cargos e Mapeamento de Atividades

## Análise do Estado Atual

### Descrições de Cargos UISA Implementadas
- **Total de Descrições**: 480 descrições de cargos cadastradas
- **Status Atual**: Todas em status "draft" (rascunho)
- **Estrutura Completa**: Cada descrição contém:
  - Responsabilidades por categoria
  - Conhecimentos técnicos com níveis de proficiência
  - Competências e habilidades
  - Informações de CBO, divisão e superior imediato

### Estrutura de Aprovação Existente
O sistema já possui duas estruturas de aprovação parcialmente implementadas:

1. **jobDescriptionApprovals** (4 níveis):
   - Nível 1: Líder Imediato
   - Nível 2: Alexsandra Oliveira (RH C&S)
   - Nível 3: André (Gerente RH)
   - Nível 4: Rodrigo (Diretor)

2. **jobDescriptionWorkflow** (4 níveis):
   - Nível 1: Especialista C&S
   - Nível 2: Líder Direto
   - Nível 3: Gerente RH
   - Nível 4: Diretor GAI

### Sistema de Atividades Existente
- **employeeActivities**: Atividades manuais registradas pelo funcionário
- **activityLogs**: Logs automáticos de atividades no sistema

---

## Novo Fluxo de Aprovação Proposto

### Hierarquia de Aprovação (5 Níveis)

| Ordem | Aprovador | Descrição | Ação |
|-------|-----------|-----------|------|
| 1 | Líder Imediato | Superior direto do ocupante do cargo | Primeira validação |
| 2 | Especialista de Cargos e Salários | Alexsandra Oliveira | Análise técnica |
| 3 | Gerente de RH | André | Validação de RH |
| 4 | Diretor de Gente, Administração e Inovação | Rodrigo | Aprovação final |
| 5 | (Opcional) Revisão | Retorno para ajustes | Se necessário |

### Fluxo de Estados

```
DRAFT → PENDING_LEADER → PENDING_CS_SPECIALIST → PENDING_HR_MANAGER → PENDING_GAI_DIRECTOR → APPROVED
                ↓                    ↓                    ↓                    ↓
           RETURNED             RETURNED             RETURNED             RETURNED
                ↓                    ↓                    ↓                    ↓
              DRAFT              DRAFT                DRAFT                DRAFT
```

---

## Sistema de Mapeamento de Atividades

### Componentes do Sistema

#### 1. Coleta Manual de Atividades
- Interface para o usuário registrar suas rotinas diárias
- Categorização por tipo de atividade
- Vinculação com responsabilidades da descrição de cargo
- Registro de tempo gasto

#### 2. Coleta Automática de Dados (Desktop/Laptop)
- **Aplicativos utilizados**: Tempo em cada software
- **Navegação web**: Sites e sistemas acessados
- **Documentos**: Arquivos abertos e editados
- **Comunicação**: E-mails, reuniões, chamadas

#### 3. Confronto com Descrição de Cargo
- Comparação entre atividades realizadas vs. responsabilidades do cargo
- Identificação de gaps (atividades não previstas)
- Identificação de responsabilidades não executadas
- Relatório de aderência ao cargo

---

## Modelo de Dados Proposto

### Novas Tabelas

#### 1. jobDescriptionApprovalFlow
```sql
CREATE TABLE jobDescriptionApprovalFlow (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jobDescriptionId INT NOT NULL,
  
  -- Configuração do fluxo
  version INT DEFAULT 1,
  status ENUM('draft', 'pending_leader', 'pending_cs_specialist', 
              'pending_hr_manager', 'pending_gai_director', 
              'approved', 'rejected', 'returned') DEFAULT 'draft',
  
  -- Aprovadores designados
  leaderId INT NOT NULL,
  leaderName VARCHAR(255),
  csSpecialistId INT NOT NULL,
  csSpecialistName VARCHAR(255),
  hrManagerId INT NOT NULL,
  hrManagerName VARCHAR(255),
  gaiDirectorId INT NOT NULL,
  gaiDirectorName VARCHAR(255),
  
  -- Status de cada nível
  leaderStatus ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending',
  leaderComments TEXT,
  leaderDecidedAt DATETIME,
  
  csSpecialistStatus ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending',
  csSpecialistComments TEXT,
  csSpecialistDecidedAt DATETIME,
  
  hrManagerStatus ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending',
  hrManagerComments TEXT,
  hrManagerDecidedAt DATETIME,
  
  gaiDirectorStatus ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending',
  gaiDirectorComments TEXT,
  gaiDirectorDecidedAt DATETIME,
  
  -- Metadados
  submittedAt DATETIME,
  completedAt DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. activityRoutines (Rotinas do Usuário)
```sql
CREATE TABLE activityRoutines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  jobDescriptionId INT,
  responsibilityId INT,
  
  -- Informações da rotina
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency ENUM('diaria', 'semanal', 'quinzenal', 'mensal', 'eventual') NOT NULL,
  estimatedMinutes INT,
  
  -- Categoria
  category ENUM('processo', 'analise', 'planejamento', 'comunicacao', 
                'reuniao', 'relatorio', 'suporte', 'outros') NOT NULL,
  
  -- Vinculação com descrição de cargo
  isLinkedToJobDescription BOOLEAN DEFAULT FALSE,
  matchPercentage INT DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. desktopActivityLogs (Coleta Automática)
```sql
CREATE TABLE desktopActivityLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  
  -- Tipo de atividade
  activityType ENUM('application', 'website', 'document', 'meeting', 
                    'email', 'idle', 'other') NOT NULL,
  
  -- Detalhes
  applicationName VARCHAR(255),
  windowTitle VARCHAR(500),
  url VARCHAR(1000),
  documentPath VARCHAR(500),
  
  -- Tempo
  startTime DATETIME NOT NULL,
  endTime DATETIME,
  durationSeconds INT,
  
  -- Categorização automática
  autoCategory VARCHAR(100),
  matchedResponsibilityId INT,
  
  -- Metadados do dispositivo
  deviceId VARCHAR(100),
  deviceType ENUM('desktop', 'laptop', 'mobile') DEFAULT 'desktop',
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. activityJobDescriptionMatch (Confronto)
```sql
CREATE TABLE activityJobDescriptionMatch (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  jobDescriptionId INT NOT NULL,
  
  -- Período de análise
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  
  -- Métricas de aderência
  totalActivitiesLogged INT DEFAULT 0,
  activitiesMatchedToJob INT DEFAULT 0,
  activitiesNotInJob INT DEFAULT 0,
  responsibilitiesNotExecuted INT DEFAULT 0,
  
  -- Percentuais
  adherencePercentage DECIMAL(5,2) DEFAULT 0,
  coveragePercentage DECIMAL(5,2) DEFAULT 0,
  
  -- Detalhes em JSON
  matchDetails JSON,
  gapsIdentified JSON,
  suggestedAdjustments JSON,
  
  -- Status
  status ENUM('processing', 'completed', 'reviewed') DEFAULT 'processing',
  reviewedBy INT,
  reviewedAt DATETIME,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Funcionalidades a Implementar

### Backend (tRPC Routers)

#### 1. jobDescriptionApprovalFlowRouter
- `create` - Criar novo fluxo de aprovação
- `submit` - Submeter para aprovação
- `approve` - Aprovar em nível específico
- `reject` - Rejeitar com comentários
- `return` - Devolver para ajustes
- `getByJobDescription` - Buscar fluxo por descrição
- `getPendingByApprover` - Listar pendentes por aprovador
- `getApprovalStats` - Estatísticas de aprovações

#### 2. activityRoutinesRouter
- `create` - Criar nova rotina
- `update` - Atualizar rotina
- `delete` - Excluir rotina
- `list` - Listar rotinas do funcionário
- `linkToJobDescription` - Vincular à descrição de cargo
- `getMatchAnalysis` - Análise de correspondência

#### 3. desktopActivityRouter
- `logActivity` - Registrar atividade automática
- `getActivitySummary` - Resumo de atividades
- `getActivityByPeriod` - Atividades por período
- `categorizeActivity` - Categorizar atividade

#### 4. activityMatchRouter
- `generateReport` - Gerar relatório de confronto
- `getMatchAnalysis` - Análise de aderência
- `identifyGaps` - Identificar gaps
- `suggestAdjustments` - Sugerir ajustes na descrição

### Frontend (Páginas)

#### 1. Dashboard de Aprovações de Descrições
- Visão geral de todas as descrições pendentes
- Filtros por status, departamento, aprovador
- Ações em lote
- Timeline de aprovações

#### 2. Tela de Aprovação Individual
- Visualização completa da descrição
- Histórico de alterações
- Comentários anteriores
- Botões de aprovar/rejeitar/devolver

#### 3. Mapeamento de Rotinas do Usuário
- Formulário para adicionar rotinas
- Vinculação com responsabilidades do cargo
- Visualização de frequência e tempo
- Comparativo com descrição de cargo

#### 4. Dashboard de Coleta Automática
- Resumo de atividades coletadas
- Gráficos de distribuição de tempo
- Categorização automática
- Alertas de atividades não mapeadas

#### 5. Relatório de Confronto
- Comparativo atividades vs. descrição
- Indicadores de aderência
- Gaps identificados
- Sugestões de ajustes

---

## Cronograma de Implementação

### Fase 1: Schema e Migrations (1-2 dias)
- [ ] Criar novas tabelas no schema
- [ ] Executar migrations
- [ ] Validar estrutura

### Fase 2: Backend - Fluxo de Aprovação (2-3 dias)
- [ ] Implementar router de aprovação
- [ ] Criar helpers de workflow
- [ ] Implementar notificações
- [ ] Testes unitários

### Fase 3: Backend - Mapeamento de Atividades (2-3 dias)
- [ ] Implementar router de rotinas
- [ ] Criar sistema de coleta
- [ ] Implementar confronto
- [ ] Testes unitários

### Fase 4: Frontend - Aprovações (2-3 dias)
- [ ] Dashboard de aprovações
- [ ] Tela de aprovação individual
- [ ] Integração com backend

### Fase 5: Frontend - Mapeamento (2-3 dias)
- [ ] Tela de mapeamento de rotinas
- [ ] Dashboard de coleta
- [ ] Relatório de confronto

### Fase 6: Testes e Ajustes (1-2 dias)
- [ ] Testes de integração
- [ ] Ajustes de UX
- [ ] Documentação

---

## Considerações Técnicas

### Coleta Automática de Desktop
Para a coleta automática de dados do desktop/laptop, será necessário:

1. **Agente Desktop**: Aplicativo instalado no computador do usuário
   - Monitoramento de aplicativos ativos
   - Captura de títulos de janelas
   - Detecção de tempo ocioso

2. **API de Integração**: Endpoint para receber dados do agente
   - Autenticação segura
   - Rate limiting
   - Validação de dados

3. **Privacidade e Consentimento**:
   - Política de privacidade clara
   - Consentimento do usuário
   - Opção de pausar/desativar coleta

### Alternativa Inicial (Sem Agente)
Enquanto o agente desktop não estiver disponível, o sistema pode:
- Usar registro manual de atividades
- Integrar com calendário (reuniões)
- Integrar com e-mail (comunicações)
- Usar dados de login no sistema

---

## Próximos Passos Imediatos

1. **Atualizar todo.md** com as novas funcionalidades
2. **Criar schema** das novas tabelas
3. **Executar migrations**
4. **Implementar backend** do fluxo de aprovação
5. **Criar interfaces** de aprovação
6. **Implementar mapeamento** de atividades
7. **Desenvolver confronto** com descrição de cargo
8. **Testes e documentação**

---

*Documento criado em: 16/12/2025*
*Versão: 1.0*
