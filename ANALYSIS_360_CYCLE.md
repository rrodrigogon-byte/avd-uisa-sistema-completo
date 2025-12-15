# Análise: Fluxo de Criação de Ciclo 360° Enhanced

## Objetivo
Implementar um fluxo de criação de ciclo de Avaliação 360° em 4 etapas sequenciais:
1. **Dados do Ciclo** - Informações básicas
2. **Configuração de Pesos** - Definir pesos das dimensões
3. **Competências** - Selecionar competências a avaliar
4. **Participantes** - Adicionar participantes

## Estrutura Atual do Banco de Dados

### Tabelas Principais

#### `evaluationCycles`
- `id`: Identificador único
- `name`: Nome do ciclo
- `year`: Ano
- `type`: "anual", "semestral", "trimestral"
- `startDate`, `endDate`: Período do ciclo
- `status`: "planejado", "ativo", "concluido", "cancelado"
- `selfEvaluationDeadline`, `managerEvaluationDeadline`, `consensusDeadline`: Prazos das etapas
- `description`: Descrição

#### `performanceEvaluations`
- `id`: Identificador único
- `cycleId`: Referência ao ciclo
- `employeeId`: Colaborador sendo avaliado
- `type`: "360", "180", "90"
- `workflowStatus`: "pending_self", "pending_manager", "pending_consensus", "completed"
- `selfScore`, `managerScore`, `finalScore`: Notas
- Campos de conclusão: `selfCompletedAt`, `managerCompletedAt`, `consensusCompletedAt`

#### `competencies`
- `id`: Identificador único
- `code`: Código único
- `name`: Nome da competência
- `category`: "tecnica", "comportamental", "lideranca"
- `description`: Descrição

#### `positionCompetencies`
- `positionId`: Cargo
- `competencyId`: Competência
- `requiredLevel`: Nível exigido (1-5)
- `weight`: Peso da competência

#### `evaluationQuestions`
- `id`: Identificador único
- `code`: Código único
- `question`: Texto da pergunta
- `category`: Categoria
- `type`: "escala", "texto", "multipla_escolha"
- `weight`: Peso da pergunta

## Fluxo Proposto

### Etapa 1: Dados do Ciclo
**Entrada:**
- Nome do ciclo
- Ano
- Tipo (anual, semestral, trimestral)
- Data de início
- Data de fim
- Descrição (opcional)

**Saída:**
- Ciclo criado com status "planejado"
- ID do ciclo para próximas etapas

**Endpoint:** `POST /api/trpc/evaluation360.createCycleStep1`

### Etapa 2: Configuração de Pesos
**Entrada:**
- ID do ciclo
- Pesos para dimensões de avaliação:
  - Autoavaliação (self): 0-100%
  - Avaliação do Gestor (manager): 0-100%
  - Avaliação de Pares (peers): 0-100%
  - Avaliação de Subordinados (subordinates): 0-100%
- Prazos para cada etapa:
  - Prazo autoavaliação
  - Prazo avaliação gestor
  - Prazo consenso

**Saída:**
- Pesos salvos
- Prazos atualizados no ciclo

**Endpoint:** `POST /api/trpc/evaluation360.updateCycleWeights`

### Etapa 3: Competências
**Entrada:**
- ID do ciclo
- Lista de competências a avaliar:
  - ID da competência
  - Peso da competência no ciclo
  - Nível mínimo esperado

**Saída:**
- Competências vinculadas ao ciclo

**Endpoint:** `POST /api/trpc/evaluation360.addCycleCompetencies`

### Etapa 4: Participantes
**Entrada:**
- ID do ciclo
- Lista de participantes:
  - ID do colaborador
  - Tipo de participação (avaliado, avaliador, ambos)
  - Gestor direto
  - Pares (opcional)
  - Subordinados (opcional)

**Saída:**
- Participantes adicionados
- Avaliações criadas para cada participante
- Ciclo atualizado para status "ativo"

**Endpoint:** `POST /api/trpc/evaluation360.addCycleParticipants`

## Novas Tabelas Necessárias

### `evaluation360CycleWeights`
```sql
CREATE TABLE evaluation360CycleWeights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycleId INT NOT NULL,
  selfWeight INT DEFAULT 25,
  managerWeight INT DEFAULT 25,
  peersWeight INT DEFAULT 25,
  subordinatesWeight INT DEFAULT 25,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `evaluation360CycleCompetencies`
```sql
CREATE TABLE evaluation360CycleCompetencies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycleId INT NOT NULL,
  competencyId INT NOT NULL,
  weight INT DEFAULT 1,
  minLevel INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `evaluation360CycleParticipants`
```sql
CREATE TABLE evaluation360CycleParticipants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycleId INT NOT NULL,
  employeeId INT NOT NULL,
  participationType ENUM('evaluated', 'evaluator', 'both') DEFAULT 'evaluated',
  managerId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Fluxo de Dados

```
Etapa 1: Criar Ciclo
    ↓
Etapa 2: Configurar Pesos
    ↓
Etapa 3: Adicionar Competências
    ↓
Etapa 4: Adicionar Participantes
    ↓
Ciclo Ativo → Fluxo Existente (Self → Manager → Consensus)
```

## Endpoints a Implementar

1. `evaluation360.createCycleStep1` - Criar ciclo (Etapa 1)
2. `evaluation360.updateCycleWeights` - Atualizar pesos (Etapa 2)
3. `evaluation360.addCycleCompetencies` - Adicionar competências (Etapa 3)
4. `evaluation360.addCycleParticipants` - Adicionar participantes (Etapa 4)
5. `evaluation360.getCycleData` - Buscar dados do ciclo em criação
6. `evaluation360.completeCycleCreation` - Finalizar criação e ativar ciclo

## UI Components Necessários

1. **CycleCreationWizard** - Componente principal com 4 abas
2. **CycleDataForm** - Formulário da Etapa 1
3. **WeightsConfiguration** - Configuração de pesos (Etapa 2)
4. **CompetenciesSelector** - Seletor de competências (Etapa 3)
5. **ParticipantsManager** - Gerenciador de participantes (Etapa 4)
6. **CyclePreview** - Visualização do ciclo antes de confirmar

## Validações

- Soma de pesos deve ser 100%
- Todas as datas devem ser válidas
- Pelo menos uma competência deve ser selecionada
- Pelo menos um participante deve ser adicionado
- Datas de prazo devem estar dentro do período do ciclo
