# Sistema AVD UISA - TODO List

## 📋 SISTEMA DE DESCRIÇÃO DE CARGOS - TEMPLATE UISA (NOVA REQUISIÇÃO)

### Fase 1: Análise do Template ✅
- [x] Extrair estrutura completa do template (Cargo, Depto, CBO, Divisão, Reporte, Revisão)
- [x] Mapear seções: Objetivo Principal, Responsabilidades, Conhecimento Técnico, Treinamento Obrigatório
- [x] Mapear seções: Competências/Habilidades, Qualificação Desejada, e-Social
- [x] Mapear workflow de aprovação: Ocupante → Superior Imediato → Gerente RH

### Fase 2: Schema de Banco de Dados ✅
- [x] Criar tabela `jobDescriptions` (descrições de cargo completas)
- [x] Criar tabela `jobResponsibilities` (responsabilidades por categoria)
- [x] Criar tabela `jobKnowledge` (conhecimentos técnicos com níveis)
- [x] Criar tabela `jobCompetencies` (competências e habilidades)
- [x] Criar tabela `jobDescriptionApprovals` (workflow de aprovação 3 níveis)
- [x] Criar tabela `employeeActivities` (registro manual de tarefas)
- [x] Criar tabela `activityLogs` (coleta automática de atividades)

### Fase 3: Backend tRPC ✅
- [x] Router `jobDescriptionsRouter` com 10 endpoints
- [x] Endpoint `create` - Criar descrição de cargo
- [x] Endpoint `update` - Atualizar descrição
- [x] Endpoint `getById` - Buscar por ID com todas as relações
- [x] Endpoint `list` - Listar com filtros (departamento, status)
- [x] Endpoint `submitForApproval` - Enviar para aprovação
- [x] Endpoint `approve` - Aprovar (Superior/RH)
- [x] Endpoint `reject` - Rejeitar com motivo
- [x] Endpoint `getApprovalHistory` - Histórico completo
- [x] Endpoint `addActivity` - Registrar atividade manual
- [x] Endpoint `getActivities` - Buscar atividades do funcionário

### Fase 4: Interface de Criação/Edição ✅
- [x] Página `/descricao-cargos/criar` com formulário wizard
- [x] Seção 1: Informações Básicas (Cargo, Depto, CBO, Divisão, Reporte)
- [x] Seção 2: Objetivo Principal do Cargo (textarea)
- [x] Seção 3: Responsabilidades (por categoria: Processo, Análise KPI, Planejamento, Budget, Resultados)
- [x] Seção 4: Conhecimento Técnico (tabela com níveis: Básico, Intermediário, Avançado, Obrigatório)
- [x] Seção 5: Treinamento Obrigatório (lista editável)
- [x] Seção 6: Competências/Habilidades (grid 2 colunas)
- [x] Seção 7: Qualificação Desejada (Formação + Experiência)
- [x] Seção 8: e-Social (especificações PCMSO, PPRA)
- [x] Botão "Salvar Rascunho" e "Enviar para Aprovação"

### Fase 5: Workflow de Aprovação ✅
- [x] Modal de aprovação com 3 níveis (Ocupante, Superior Imediato, Gerente RH)
- [x] Indicadores visuais de status (Pendente, Aprovado, Rejeitado)
- [x] Campo de comentários obrigatório na rejeição
- [x] Timeline de aprovações com datas e aprovadores
- [x] Página de listagem e detalhes com workflow visual
- [x] Botões de aprovar/rejeitar em cada nível

### Fase 6: Registro de Tarefas/Atividades ✅
- [x] Página `/minhas-atividades` para funcionários
- [x] Formulário de registro: Data, Hora Início, Hora Fim, Descrição, Categoria
- [x] Categorias: Reunião, Análise, Planejamento, Execução, Suporte, Outros
- [x] Tabela de atividades registradas com filtros
- [x] Estatísticas: Total de horas, Distribuição por categoria
- [x] Cálculo automático de duração em minutos
- [x] KPIs de atividades registradas

### Fase 7: Coleta Automática de Atividades ✅
- [ ] Sistema de tracking de ações no sistema (middleware de logs)
- [ ] Registro automático: Login/Logout, Criação de metas, Atualização de PDI, Envio de avaliações
- [ ] Registro automático: Aprovações, Comentários, Uploads de arquivos
- [ ] Dashboard de atividades automáticas vs manuais
- [ ] Integração com activityLogs para análise de produtividade
- [ ] Relatório consolidado: Atividades manuais + automáticas
- [ ] Análise de tempo gasto por responsabilidade

### Fase 8: Testes e Validação ✅
- [ ] Testar criação de descrição de cargo completa (todas as 8 seções)
- [ ] Testar workflow de aprovação (3 níveis: Ocupante → Superior → RH)
- [ ] Testar registro manual de atividades
- [ ] Testar coleta automática de atividades
- [ ] Validar notificações por email em cada etapa
- [ ] Validar geração de PDF com template UISA
- [ ] Gerar relatório de teste completo

---

## 🎯 IMPLEMENTAÇÃO FINAL - ATÉ O FIM!

### Fase 1: Dashboard de Resultados ✅
- [x] Criar página `/pesquisas-pulse/resultados/:id` (ResultadosPesquisaPulse.tsx)
- [x] Implementar gráfico BarChart de distribuição (0-10) com cores dinâmicas
- [x] Implementar lista de comentários com bordas coloridas
- [x] Implementar KPIs (12 respostas, nota média 7.2, 5 comentários)
- [x] Adicionar botão "Ver Resultados" na tabela de pesquisas

### Fase 2: Modais CRUD ⏳
- [ ] Modal "Nova Pesquisa" com formulário completo
- [ ] Modal "Editar Pesquisa"
- [ ] Modal "Novo Cargo" com validação de faixa salarial
- [ ] Modal "Editar Cargo"
- [ ] Confirmação de exclusão

### Fase 3: E-mails Reais ⏳
- [ ] Integrar pulse.sendInvitations com emailService
- [ ] Criar template de e-mail de convite
- [ ] Testar envio real de e-mails

### Fase 4: Exportação de Relatórios ⏳
- [ ] Criar exportPulseSurveyPDF.ts
- [ ] Criar exportPulseSurveyExcel.ts
- [ ] Adicionar botões de exportação

### Fase 5: Testes End-to-End ⏳
- [ ] Testar criação de pesquisa → envio → resposta → resultados
- [ ] Testar criação de cargo → edição → exclusão
- [ ] Testar exportações

### Fase 6: Finalização ⏳
- [ ] Salvar checkpoint final
- [ ] Sistema 100% COMPLETO


---

## 📄 NOVAS FUNCIONALIDADES - FASE 2

### Exportação em PDF ✅
- [x] Endpoint backend `exportJobDescriptionPDF` para gerar PDF
- [x] Template PDF com todas as 8 seções da descrição
- [x] Seção de assinaturas digitais dos 3 níveis (Ocupante, Superior, RH)
- [x] Botão "Exportar PDF" na página de detalhes (somente se aprovado)
- [x] Download automático do PDF gerado

### Notificações Automáticas ✅
- [x] Integração com sistema de notificações do template
- [x] Notificação ao enviar para aprovação (para Ocupante)
- [x] Notificação ao aprovar nível 1 (para Superior Imediato)
- [x] Notificação ao aprovar nível 2 (para Gerente RH)
- [x] Notificação ao aprovar nível 3 (para criador - aprovação completa)
- [x] Notificação ao rejeitar em qualquer nível (para criador)
- [x] Sistema de notificações integrado

### Relatórios de Produtividade ✅
- [x] Página `/relatorios-produtividade` com dashboard gerencial
- [x] Gráfico: Atividades registradas vs Responsabilidades do cargo
- [x] Gráfico: Distribuição de tempo por categoria (barras)
- [x] Tabela: Top 10 funcionários mais produtivos
- [x] Filtros: Período, Departamento
- [x] KPI: Taxa de aderência às responsabilidades (%)
- [x] KPI: Média de horas por funcionário
- [x] KPI: Total de horas e funcionários ativos
- [x] Comparação: Atividades manuais vs automáticas


---

## 🚀 FUNCIONALIDADES AVANÇADAS - FASE 3

### Parser Real de .docx ✅
- [x] Instalar biblioteca mammoth.js para leitura de arquivos Word
- [x] Criar função de extração de seções via regex
- [x] Implementar endpoint tRPC para upload de múltiplos arquivos
- [x] Criar sistema de validação de dados extraídos
- [x] Implementar relatório de sucessos/erros detalhado
- [x] Popular banco de dados com descrições reais UISA

### Dashboard de Gestão de Alertas ✅
- [x] Criar schema de tabela alerts no banco de dados
- [x] Implementar router tRPC alertsRouter com endpoints (list, resolve, dismiss, sendEmail)
- [x] Criar página /alertas com dashboard centralizado
- [x] Implementar filtros por severidade (crítico, alto, médio, baixo)
- [x] Adicionar ações em lote (enviar email, agendar reunião)
- [x] Criar histórico de alertas resolvidos
- [x] Integrar com sistema de notificações existente

### Integração com Sistema de Ponto ✅
- [x] Criar schema de tabela timeClockRecords no banco de dados
- [x] Implementar endpoint de importação de dados de ponto
- [x] Criar função de cálculo de discrepâncias (atividades vs ponto)
- [x] Implementar comparação horas registradas vs presença física
- [x] Criar relatório de inconsistências
- [x] Adicionar alertas automáticos para discrepâncias >20%
- [x] Criar página de visualização de dados de ponto
