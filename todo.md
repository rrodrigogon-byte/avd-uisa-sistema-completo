## 🔥 TAREFAS URGENTES - Nova Solicitação (23/11/2024 18:40)

### Correções de Bugs Críticos
- [x] Corrigir validação de descrição de meta (20 → 10 caracteres mínimo)
- [x] Corrigir erro ao aprovar metas (validação impedindo aprovação)
- [x] Corrigir erro ao incluir sucessor (SQL insert com valores faltantes: gapAnalysis, developmentActions)
- [x] Corrigir e complementar página de Calibração (já funcional)
- [x] Corrigir e complementar página de Calibração da Diretoria (já funcional)

### Novas Funcionalidades Solicitadas
- [ ] Implementar exportação real em PDF dos relatórios de PDI (jsPDF + autoTable)
- [ ] Criar dashboard de notificações enviadas para RH acompanhar
- [ ] Adicionar filtro de período temporal nos relatórios de PDI (comparar evolução)

---

## ✅ TAREFAS CONCLUÍDAS - 23/11/2024 18:30

### Correções Urgentes
- [x] Corrigir endpoint employees.list - estrutura flat (3045 funcionários)
- [x] Criar endpoint competencies.list (55 competências)
- [x] Verificar endpoint pdiIntelligent.addGap - funcionando

### Página de Aprovação de Ciclos
- [x] Criar página /aprovacoes/ciclos-avaliacao
- [x] Adicionar ao menu "Aprovações" → "Ciclos de Avaliação"
- [x] Listar ciclos em planejamento pendentes de aprovação
- [x] Botão "Aprovar para Metas" funcional
- [x] Dialog de confirmação com informações do ciclo

### Notificações Automáticas
- [x] Sistema já implementado no endpoint cycles.approveForGoals
- [x] Envia notificação push para todos os funcionários
- [x] Link direto para criação de metas

### Workflow de Aprovação de Metas
- [x] Endpoints goals.approve e goals.reject já existem
- [x] Página AprovarMetas.tsx já implementada
- [x] Sistema completo de aprovação/rejeição com comentários

### Relatórios Consolidados de PDI
- [x] Criar página /relatorios/pdi
- [x] Adicionar ao menu "Desenvolvimento" → "Relatórios de PDI"
- [x] Gráfico de evolução de gaps de competências (Bar Chart)
- [x] Gráfico de progresso ações 70-20-10 (Doughnut Chart)
- [x] Gráfico de status de riscos (Bar Chart)
- [x] Tabela de histórico de revisões
- [x] Filtros por funcionário e PDI
- [x] Estatísticas gerais (gaps, progresso, ações, riscos)
- [x] Botão de exportação PDF (estrutura pronta)

---

## 📋 RESUMO DAS IMPLEMENTAÇÕES

### Bugs Corrigidos
1. **employees.list** - Retorna estrutura flat com id, name, email, etc.
2. **competencies.list** - Endpoint criado e funcional
3. **Matriz de Gaps** - Endpoint addGap verificado e funcionando

### Novas Páginas
1. **AprovacaoCiclos.tsx** - Aprovação de ciclos para criação de metas
2. **RelatoriosPDI.tsx** - Relatórios consolidados com gráficos

### Funcionalidades Implementadas
- ✅ Notificações automáticas quando ciclo aprovado
- ✅ Workflow completo de aprovação de metas
- ✅ Relatórios visuais de evolução de PDI
- ✅ Menu atualizado com novos itens

- [x] Adicionar botão "Ativar Metas" no modal de edição de ciclo

### Novo Bug Reportado
- [ ] Corrigir envio de Pesquisas Pulse (não está sendo enviado)
- [ ] Corrigir erro 404 em todos os templates de avaliação


## 🚀 NOVAS TAREFAS - 23/11/2024 19:00

### 1. Configuração SMTP Completa
- [x] Verificar página /admin/smtp existente
- [x] Implementar interface de configuração SMTP (host, port, user, password)
- [x] Adicionar botão "Testar Conexão" com envio de email de teste
- [x] Salvar configurações no banco de dados (systemSettings)
- [x] Integrar com emailService para envio automático
- [x] Documentar processo de configuração Gmail/Outlook

### 2. Exportação PDF de Relatórios de PDI
- [x] Instalar jsPDF e jspdf-autotable
- [x] Criar função generatePDIPDF em /client/src/lib/pdfExport.ts
- [x] Incluir gráficos de evolução de gaps (Chart.js → Canvas → PDF)
- [x] Incluir tabela de ações 70-20-10 com progresso
- [x] Incluir histórico de revisões e feedbacks
- [x] Adicionar cabeçalho e rodapé profissional
- [x] Integrar botão "Exportar PDF" na página RelatoriosPDI.tsx

### 3. Dashboard de Notificações para RH
- [x] Criar página /admin/email-metrics
- [x] Criar endpoint admin.getEmailMetrics (total enviados, sucesso, falha)
- [x] Criar endpoint admin.getEmailStats (por tipo, por mês)
- [x] Implementar gráficos Chart.js (linha temporal, pizza por tipo)
- [x] Adicionar tabela de histórico de emails enviados
- [x] Incluir filtros por período, tipo e status
- [ ] Adicionar botão de reenvio de emails falhados (opcional)
- [x] Adicionar ao menu "Configurações" → "Métricas de E-mail"
