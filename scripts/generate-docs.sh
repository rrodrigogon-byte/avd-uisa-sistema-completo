#!/bin/bash

OUTPUT_DIR="/home/ubuntu/avd-uisa-sistema-completo/docs"
mkdir -p "$OUTPUT_DIR"

# Gerar código-fonte completo
echo "=== SISTEMA AVD UISA - CÓDIGO-FONTE COMPLETO ===" > "$OUTPUT_DIR/codigo-fonte-completo.txt"
echo "Gerado em: $(date)" >> "$OUTPUT_DIR/codigo-fonte-completo.txt"
echo "" >> "$OUTPUT_DIR/codigo-fonte-completo.txt"

# Listar arquivos principais
find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" | while read file; do
  echo "========================================" >> "$OUTPUT_DIR/codigo-fonte-completo.txt"
  echo "ARQUIVO: $file" >> "$OUTPUT_DIR/codigo-fonte-completo.txt"
  echo "========================================" >> "$OUTPUT_DIR/codigo-fonte-completo.txt"
  cat "$file" >> "$OUTPUT_DIR/codigo-fonte-completo.txt"
  echo "" >> "$OUTPUT_DIR/codigo-fonte-completo.txt"
  echo "" >> "$OUTPUT_DIR/codigo-fonte-completo.txt"
done

# Gerar especificações técnicas
cat > "$OUTPUT_DIR/especificacoes-tecnicas.md" << 'EOF'
# Sistema AVD UISA - Especificações Técnicas

## Arquitetura do Sistema

### Stack Tecnológico
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express + tRPC 11
- **Banco de Dados**: MySQL/TiDB (62+ tabelas)
- **UI**: Shadcn/ui + Tailwind CSS 4
- **Gráficos**: Chart.js + Recharts
- **Exportações**: ExcelJS + jsPDF

### Estrutura de Diretórios
```
avd-uisa-sistema-completo/
├── client/               # Frontend React
│   ├── src/
│   │   ├── pages/       # 50+ páginas
│   │   ├── components/  # Componentes reutilizáveis
│   │   └── lib/         # Utilitários e helpers
├── server/              # Backend tRPC
│   ├── routers/         # 30+ routers
│   └── utils/           # Helpers e serviços
├── drizzle/             # Schema do banco
└── shared/              # Tipos compartilhados

## Módulos Principais

### 1. Sistema de Bônus
- **Tabelas**: bonusPolicies, bonusCalculations, bonusAuditLogs, bonusApprovalComments
- **Routers**: bonusRouter (10 endpoints), bonusWorkflowRouter (10 endpoints)
- **Páginas**: /bonus, /aprovacoes/bonus, /aprovacoes/bonus-lote, /relatorios/bonus, /previsao-bonus, /bonus/auditoria

### 2. Testes Psicométricos
- **Tabelas**: psychometricTests, testQuestions (280 perguntas)
- **Tipos**: DISC, Big Five, MBTI, IE, VARK, Liderança, Âncoras de Carreira
- **Router**: psychometricRouter (8 endpoints)

### 3. PDI Inteligente
- **Tabelas**: pdiPlans, pdiIntelligentDetails, pdiCompetencyGaps, pdiRisks, pdiReviews, pdiActions, pdiGovernanceReviews
- **Router**: pdiIntelligentRouter (10 endpoints)
- **Modelo**: 70-20-10 (70% experiências, 20% relacionamentos, 10% cursos)

### 4. Avaliação 360°
- **Tabelas**: performanceEvaluations, evaluation360Questions, evaluation360Responses
- **Router**: evaluation360Router (8 endpoints)
- **Workflow**: Autoavaliação → Gestor → Consenso

### 5. Nine Box
- **Tabelas**: nineBoxAssessments, nineBoxCalibrations
- **Router**: nineBoxRouter (7 endpoints)
- **Matriz**: Performance (1-3) × Potencial (1-3)

### 6. Descrição de Cargos UISA
- **Tabelas**: jobDescriptions, jobResponsibilities, jobKnowledge, jobCompetencies, jobDescriptionApprovals, employeeActivities, activityLogs
- **Router**: jobDescriptionsRouter (10 endpoints)
- **Workflow**: Ocupante → Superior → RH

### 7. Pesquisas de Pulse
- **Tabelas**: pulseSurveys, pulseSurveyResponses, pulseSurveyEmailLogs
- **Router**: pulseRouter (7 endpoints)
- **Cron Job**: Envio automático a cada 8 horas

### 8. Produtividade e Alertas
- **Tabelas**: employeeActivities, timeClockRecords, timeDiscrepancies, alerts
- **Routers**: productivityRouter, alertsRouter, timeClockRouter
- **Cron Job**: Cálculo diário de discrepâncias

## Regras de Negócio

### Cálculo de Bônus
1. Verificar elegibilidade (metas concluídas, performance, tempo de casa)
2. Buscar política aplicável (cargo, departamento, faixa salarial)
3. Calcular valor base (salário × multiplicador)
4. Aplicar % adicional baseado em metas
5. Gerar registro em bonusCalculations
6. Iniciar workflow de aprovação multinível

### Workflow de Aprovação de Bônus
1. **Nível 1**: Gestor Direto (aprovação básica)
2. **Nível 2**: Gerente (valores > R$ 5.000)
3. **Nível 3**: Diretor (valores > R$ 10.000)
4. **Nível 4**: Diretor de Gente (valores > R$ 20.000)
5. **Nível 5**: CFO (valores > R$ 50.000)

### Validação SMART de Metas
- **S** (Specific): Título com verbo de ação + descrição clara
- **M** (Measurable): Unidade de medida + valor alvo numérico
- **A** (Achievable): Valor realista (não superior a 300% da média)
- **R** (Relevant): Impacto no negócio + alinhamento estratégico
- **T** (Time-bound): Prazo entre 1-24 meses

### Cálculo de Performance (40-30-30)
- **40%**: Metas SMART (progresso ponderado)
- **30%**: Avaliação 360° (média de todas as avaliações)
- **30%**: Competências (gap analysis)

### Sistema de Notificações
- **Eventos**: Bônus calculado/aprovado/rejeitado, Meta vencendo, Avaliação pendente, PDI sem atualização
- **Canais**: In-app (tabela notifications) + E-mail (Gmail SMTP)
- **Frequência**: Tempo real (WebSocket) + Cron jobs (diário/semanal)

## Endpoints Backend (120+ endpoints)

### bonusRouter
- list, getById, create, update, delete
- calculateBonus, listCalculations, approveCalculation, markAsPaid
- getStats, getMonthlyTrends, getDepartmentDistribution
- approveBatch, rejectBatch, addComment, getComments
- getAuditLogs, getApprovalMetrics

### bonusWorkflowRouter
- list, getById, create, update, delete
- startWorkflow, approveLevel, rejectLevel
- getPendingInstances

### goalsRouter (smartGoals)
- list, getById, create, update, updateProgress
- validateSMART, submitForApproval, approve, reject
- addMilestone, updateMilestone, linkToPDI
- addComment, getDashboard, calculateBonus

### psychometricRouter
- getQuestions, submitTest, getTests, sendTestInvitation
- getAllTests, getPDIRecommendations, getAggregatedResults

### pdiIntelligentRouter
- create, getById, list, updateStatus
- addGap, updateGap, addRisk, updateRisk
- addReview, compareProfiles
- addAction, updateActionStatus, getActions
- addGovernanceReview, getGovernanceReviews, getIPSEvolution

### evaluation360Router
- list, getById, getQuestions, submitFeedback, getDetails
- submitSelfAssessment, submitManagerAssessment, submitConsensus
- getEvaluationWithWorkflow

### nineBoxRouter
- list, getById, create, update, adjust
- getComparison, getLeaders, getSubordinates

### jobDescriptionsRouter
- list, getById, create, update
- submitForApproval, approve, reject, getApprovalHistory
- addActivity, getActivities

### pulseRouter
- list, getById, create, activate, submitResponse
- getResults, close, sendInvitations

### productivityRouter
- getMetrics, getTopPerformers, getAlerts
- getActivityBreakdown, getComparison

### alertsRouter
- list, getById, create, resolve, dismiss
- getStats

### timeClockRouter
- importRecords, getRecords, calculateDiscrepancies
- getDiscrepancyStats

## Integrações

### Sistema de E-mail (Gmail SMTP)
- **Configuração**: /admin/smtp
- **Templates**: 10+ templates HTML profissionais
- **Eventos**: Bônus, Metas, Avaliações, PDI, Testes Psicométricos

### Cron Jobs
- **Notificações Automáticas**: Diariamente às 9h
- **Pesquisas de Pulse**: A cada 8 horas
- **Cálculo de Discrepâncias**: Diariamente às 6h

### Exportações
- **Excel**: ExcelJS (formatação monetária, estilos)
- **PDF**: jsPDF + html2canvas (KPIs + gráficos + tabelas)
- **Formatos**: CSV, XML (folha de pagamento)

## Segurança e Permissões

### Controle de Acesso
- **Admin**: Acesso total ao sistema
- **RH**: Gestão de pessoas, relatórios, configurações
- **Gestor**: Equipe, aprovações, metas
- **Colaborador**: Autoavaliação, PDI, metas próprias

### Hierarquia Organizacional
- **Campo**: employees.managerId (gestor direto)
- **Campo**: employees.costCenter (centro de custos)
- **Validação**: Gestores veem apenas subordinados diretos/indiretos

## Performance

### Índices de Banco de Dados
- 30+ índices criados (employeeId, departmentId, status, createdAt)
- Índices compostos para queries complexas
- Otimização de JOINs com Map lookup (O(1))

### Caching
- tRPC query cache (React Query)
- Invalidação automática em mutations

## Monitoramento

### Logs de Auditoria
- **Tabelas**: bonusAuditLogs, activityLogs
- **Eventos**: Criação, atualização, exclusão, aprovação, rejeição
- **Campos**: userId, action, oldValue, newValue, timestamp

### Métricas de Sistema
- **Dashboard Analytics**: KPIs, gráficos, tendências
- **Dashboard Executivo**: Headcount, performance, turnover, sucessão
- **Dashboard Compliance**: SLA, tempo médio, pendências

EOF

echo "Documentação gerada com sucesso em $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
