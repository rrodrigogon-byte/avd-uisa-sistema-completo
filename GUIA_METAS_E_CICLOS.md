# Guia Completo: Metas Corporativas, Individuais e Dashboard de Ciclos Ativos

## 📋 Índice

1. [Como RH/Admin Cadastra Meta Corporativa](#1-como-rhadmin-cadastra-meta-corporativa)
2. [Como Funcionário Cadastra Meta Individual](#2-como-funcionário-cadastra-meta-individual)
3. [Workflow de Aprovação de Metas](#3-workflow-de-aprovação-de-metas)
4. [Como Usar o Dashboard de Ciclos Ativos](#4-como-usar-o-dashboard-de-ciclos-ativos)
5. [Diferenças: Metas Corporativas vs Individuais](#5-diferenças-metas-corporativas-vs-individuais)

---

## 1. Como RH/Admin Cadastra Meta Corporativa

### 📍 Acesso

**Caminho:** Dashboard → Metas → Gestão de Metas (ou `/metas/corporativas`)

**Permissões necessárias:** Usuário com role `admin` ou `rh`

### 📝 Passo a Passo

#### **Passo 1: Acessar a Página de Metas Corporativas**

1. Faça login com usuário Admin ou RH
2. No menu lateral, clique em **"Metas"**
3. Selecione **"Gestão de Metas"** ou acesse diretamente `/metas/corporativas`

#### **Passo 2: Criar Nova Meta Corporativa**

1. Clique no botão **"Nova Meta Corporativa"** (canto superior direito)
2. Preencha o formulário:

**Informações Básicas:**
- **Ciclo:** Selecione o ciclo de avaliação (ex: 2025)
- **Categoria:** Escolha entre:
  - Financeira
  - Comportamental
  - Corporativa
  - Desenvolvimento
- **Título da Meta:** Descreva de forma clara (mínimo 10 caracteres)
  - ✅ Exemplo: "Aumentar receita em 20% no Q1 2025"
- **Descrição:** Detalhe a meta (mínimo 50 caracteres)
  - ✅ Exemplo: "Implementar estratégias de cross-selling para aumentar a receita recorrente em 20% até março de 2025, focando em clientes enterprise."

**Métricas:**
- **Unidade de Medida:** Ex: R$, %, unidades, pontos
- **Valor Alvo:** Meta numérica a ser atingida
- **Peso:** Importância da meta (1-100, padrão: 10)

**Período:**
- **Data de Início:** Quando a meta começa
- **Data de Término:** Prazo final

**Vinculação (Opcional):**
- ☑️ **Atribuir a todos os funcionários** - Meta se aplica a toda empresa
- **Departamentos Específicos:** IDs separados por vírgula (ex: 1,2,3)
- **Cargos Específicos:** IDs separados por vírgula
- **Funcionários Específicos:** IDs separados por vírgula

#### **Passo 3: Confirmar Criação**

1. Clique em **"Criar Meta Corporativa"**
2. ✅ **Meta criada e APROVADA AUTOMATICAMENTE** (não precisa de aprovação)
3. A meta aparecerá na aba **"Corporativas"**

### 🎯 Características das Metas Corporativas

- ✅ **Aprovação automática** ao criar
- ✅ Visível para todos os funcionários vinculados
- ✅ Pode ser vinculada a departamentos, cargos ou funcionários específicos
- ✅ Criada apenas por Admin/RH
- ✅ Status inicial: `approved`

---

## 2. Como Funcionário Cadastra Meta Individual

### 📍 Acesso

**Caminho:** Dashboard → Metas → Minhas Metas (ou `/metas-smart/criar`)

**Permissões necessárias:** Qualquer funcionário autenticado

### 📝 Passo a Passo

#### **Passo 1: Acessar Criação de Meta**

1. Faça login como funcionário
2. No menu lateral, clique em **"Metas"**
3. Selecione **"Minhas Metas"** ou **"Criar Meta SMART"**

#### **Passo 2: Preencher Formulário de Meta Individual**

**Informações Básicas:**
- **Tipo de Meta:** `goalType = "individual"` (padrão)
- **Título:** Descreva sua meta pessoal (mínimo 10 caracteres)
- **Descrição:** Detalhe como pretende alcançar (mínimo 50 caracteres)
- **Categoria:** Financeira, Comportamental, Corporativa ou Desenvolvimento

**Critérios SMART (validados automaticamente):**
- ✅ **Específica:** Título claro e descrição com verbos de ação
- ✅ **Mensurável:** Unidade de medida + valor alvo definidos
- ✅ **Atingível:** Valor alvo realista (entre 0 e 1.000.000)
- ✅ **Relevante:** Descrição menciona impacto/resultado/benefício
- ✅ **Temporal:** Prazo entre 1 e 24 meses

**Métricas:**
- **Unidade de Medida:** Ex: vendas, clientes, horas, certificações
- **Valor Alvo:** Número a ser atingido
- **Peso:** Importância (1-100)

**Período:**
- **Data de Início**
- **Data de Término**

**Bônus (Opcional):**
- ☑️ **Elegível para Bônus**
- **Percentual de Bônus:** % do salário
- **Valor de Bônus:** Valor fixo em R$

#### **Passo 3: Enviar para Aprovação**

1. Clique em **"Criar Meta"**
2. Status inicial: `draft` (rascunho)
3. Clique em **"Enviar para Aprovação"**
4. Status muda para: `pendente_lider` (aguardando aprovação do líder)

---

## 3. Workflow de Aprovação de Metas

### 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW DE APROVAÇÃO                     │
└─────────────────────────────────────────────────────────────┘

1. FUNCIONÁRIO CRIA META
   Status: draft
   ↓
   
2. FUNCIONÁRIO ENVIA PARA APROVAÇÃO
   Status: pendente_lider
   Notificação enviada ao líder
   ↓
   
3. LÍDER ANALISA
   Opções:
   ├─ APROVAR → Status: aprovado
   │  └─ Meta ativa e pode ser acompanhada
   │
   └─ REJEITAR → Status: rejeitado
      └─ Funcionário pode revisar e reenviar
      
4. CONSENSO (Opcional)
   Se houver divergência:
   Status: pendente_consenso
   ↓
   Reunião entre funcionário e líder
   ↓
   Acordo final → Status: aprovado
```

### 📊 Status Possíveis

| Status | Descrição | Ação Necessária |
|--------|-----------|-----------------|
| `draft` | Rascunho | Funcionário deve enviar para aprovação |
| `not_submitted` | Não enviada | Funcionário deve enviar para aprovação |
| `pendente_lider` | Aguardando líder | Líder deve aprovar ou rejeitar |
| `pendente_consenso` | Aguardando consenso | Reunião entre funcionário e líder |
| `aprovado` | Aprovada | Meta ativa |
| `rejeitado` | Rejeitada | Funcionário pode revisar e reenviar |

### 🔔 Notificações Automáticas

- ✉️ Funcionário envia meta → Líder recebe notificação
- ✉️ Líder aprova/rejeita → Funcionário recebe notificação
- ✉️ Meta próxima do prazo → Funcionário recebe lembrete
- ✉️ Meta atrasada (sem progresso por 7 dias) → Funcionário e líder recebem alerta

---

## 4. Como Usar o Dashboard de Ciclos Ativos

### 📍 Acesso

**Caminho:** Dashboard → Avaliações → Ciclos Ativos (ou `/ciclos/ativos`)

**Permissões necessárias:** Usuário com role `admin` ou `rh`

### 📊 Visão Geral do Dashboard

O Dashboard de Ciclos Ativos mostra todos os ciclos de avaliação em andamento com indicadores de progresso em tempo real.

### 📝 Funcionalidades

#### **1. KPIs Gerais (Topo da Página)**

- **Ciclos Ativos:** Total de ciclos em andamento
- **Participantes:** Total de avaliações em todos os ciclos
- **Concluídas:** Número de avaliações finalizadas
- **Pendentes:** Avaliações aguardando resposta

#### **2. Filtros**

- **Tipo de Ciclo:**
  - Avaliação de Performance
  - Avaliação 360°
  - Metas
  - PDI

- **Status:**
  - Ativo
  - Em Andamento
  - Próximo do Prazo

#### **3. Cards de Ciclos**

Cada card mostra:

**Informações do Ciclo:**
- Nome do ciclo
- Tipo (badge)
- Descrição
- Alertas de prazo (se aplicável)

**Estatísticas:**
- 👥 **Participantes:** Total de pessoas no ciclo
- ✅ **Concluídas:** Avaliações finalizadas
- ⏰ **Pendentes:** Avaliações aguardando resposta

**Barra de Progresso:**
- Progresso geral do ciclo (%)
- Cor dinâmica:
  - 🟢 Verde: ≥ 80%
  - 🟡 Amarelo: 50-79%
  - 🔴 Vermelho: < 50%

**Prazos:**
- 📅 **Autoavaliação:** Data limite
- 📅 **Avaliação Gestor:** Data limite
- 📅 **Consenso:** Data limite

**Alertas de Prazo:**
- 🔴 **Vencido:** Prazo passou
- 🔴 **3 dias:** Prazo em 3 dias ou menos
- 🟡 **7 dias:** Prazo em 7 dias ou menos

#### **4. Ações Rápidas**

**Enviar Lembretes:**
- Clique no botão **"Enviar Lembretes"**
- Sistema envia notificações para todos os participantes com avaliações pendentes
- Toast de confirmação: "Lembretes enviados para X pessoas!"

**Exportar Relatório:**
- Clique no botão **"Exportar"**
- Gera relatório PDF com:
  - Estatísticas do ciclo
  - Lista de participantes
  - Status de cada avaliação
  - Progresso detalhado

---

## 5. Diferenças: Metas Corporativas vs Individuais

### 📊 Tabela Comparativa

| Característica | Metas Corporativas | Metas Individuais |
|----------------|-------------------|-------------------|
| **Quem cria** | Admin/RH | Funcionário |
| **Aprovação** | Automática | Líder → Consenso |
| **Status inicial** | `approved` | `draft` |
| **Visibilidade** | Todos os vinculados | Próprio funcionário + líder |
| **Vinculação** | Departamentos, cargos, funcionários | Apenas o funcionário |
| **Workflow** | Sem aprovação | Aprovação em 2 níveis |
| **Notificações** | Lembretes de progresso | Aprovação + Lembretes |
| **Edição** | Admin/RH | Funcionário (apenas rascunho) |
| **Bônus** | Pode ter | Pode ter |

### 🎯 Quando Usar Cada Tipo

**Use Meta Corporativa quando:**
- ✅ A meta se aplica a toda empresa ou departamento
- ✅ É uma meta estratégica definida pela diretoria
- ✅ Precisa ser implementada rapidamente sem aprovação
- ✅ Exemplo: "Aumentar NPS em 15 pontos até dezembro"

**Use Meta Individual quando:**
- ✅ É uma meta pessoal de desenvolvimento
- ✅ Precisa de alinhamento com o líder
- ✅ Está vinculada ao PDI do funcionário
- ✅ Exemplo: "Concluir certificação AWS Solutions Architect até junho"

---

## 🚀 Resumo dos Fluxos

### Meta Corporativa (RH/Admin)
```
1. Acessar /metas/corporativas
2. Clicar "Nova Meta Corporativa"
3. Preencher formulário
4. Clicar "Criar Meta Corporativa"
5. ✅ Meta aprovada automaticamente
```

### Meta Individual (Funcionário)
```
1. Acessar /metas-smart/criar
2. Preencher formulário
3. Clicar "Criar Meta"
4. Clicar "Enviar para Aprovação"
5. Aguardar aprovação do líder
6. ✅ Meta aprovada após consenso
```

### Dashboard de Ciclos Ativos (Admin/RH)
```
1. Acessar /ciclos/ativos
2. Visualizar KPIs gerais
3. Aplicar filtros (tipo, status)
4. Analisar progresso de cada ciclo
5. Enviar lembretes ou exportar relatórios
```

---

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@uisa.com.br
- 💬 Chat: Disponível no sistema (canto inferior direito)
- 📚 Documentação completa: `/docs`

---

**Última atualização:** 21/11/2024
**Versão:** 1.0
