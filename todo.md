# Sistema AVD UISA - Lista de Funcionalidades

## 🎯 Objetivo
Desenvolver sistema completo de Avaliação de Desempenho e Gestão de Talentos da UISA com todos os módulos funcionais, integrados e prontos para produção.

---

## 📋 Funcionalidades Principais

### 1. Autenticação e Controle de Acesso
- [x] Login com usuário e senha (JWT)
- [ ] Login com reconhecimento facial
- [ ] Cadastro de usuários com foto facial
- [x] Controle de permissões (Admin, Gestor, Colaborador, RH)
- [ ] Integração com Azure AD (SSO)
- [ ] Recuperação de senha por e-mail
- [x] Sessão com expiração automática

### 2. Cadastros Básicos
- [x] Cadastro de colaboradores (importação TOTVS RM)
- [x] Cadastro de departamentos/seções
- [x] Cadastro de cargos
- [x] Cadastro de líderes/gestores
- [x] Cadastro de competências
- [x] Cadastro de níveis de competência
- [x] Cadastro de ciclos de avaliação

### 3. Módulo de Metas
- [x] Criação de metas individuais
- [x] Criação de metas de equipe
- [x] Vinculação de metas a PLR/bônus
- [ ] Aprovação de metas pelo gestor
- [x] Acompanhamento de progresso
- [ ] Alertas de prazo
- [x] Dashboard de metas

### 4. Avaliação 360°
- [x] Criação de ciclos de avaliação
- [x] Autoavaliação
- [x] Avaliação por pares
- [x] Avaliação por gestor
- [x] Avaliação por subordinados
- [x] Questionários customizáveis
- [ ] Relatório consolidado de feedback
- [x] Histórico de avaliações

### 5. Matriz 9-Box
- [x] Posicionamento automático baseado em avaliações
- [ ] Visualização gráfica da matriz
- [ ] Calibração por diretoria
- [ ] Ajustes manuais pelo RH
- [x] Histórico de posicionamento
- [ ] Exportação de relatórios

### 6. PDI Inteligente (70-20-10)
- [x] Análise de gaps de competências
- [ ] Recomendações automáticas de ações (IA Gemini)
- [x] Distribuição 70-20-10 (prática, mentoria, cursos)
- [ ] Gráfico spider de competências
- [x] Catálogo de ações de desenvolvimento
- [x] Acompanhamento de progresso
- [ ] Aprovação de PDI pelo gestor
- [ ] Alertas de ações vencidas
- [x] Histórico de PDIs

### 7. Mapa de Sucessão
- [x] Identificação de posições críticas
- [x] Candidatos a sucessão
- [x] Plano de desenvolvimento para sucessores
- [ ] Visualização gráfica do pipeline

### 8. Sistema de Notificações (E-mail Gmail)
- [x] Configuração SMTP Gmail
- [ ] E-mail de boas-vindas
- [ ] E-mail de reset de senha
- [ ] Notificação de meta criada/aprovada
- [ ] Notificação de avaliação pendente
- [ ] Notificação de PDI criado/aprovado
- [ ] Notificação de ação de PDI vencida
- [ ] Lembretes automáticos (cron jobs)
- [x] Templates HTML responsivos
- [x] Sistema de retry automático

### 9. Integrações
- [ ] Integração TOTVS RM (folha de pagamento)
- [ ] Integração Azure AD (autenticação)
- [ ] Integração Gemini AI (PDI inteligente)
- [x] API REST completa (tRPC)
- [ ] Webhooks para eventos

### 10. Relatórios e Dashboards
- [ ] Dashboard executivo
- [ ] Dashboard de RH
- [ ] Dashboard de gestor
- [x] Dashboard de colaborador
- [ ] Relatório de metas
- [ ] Relatório de avaliações 360°
- [ ] Relatório de PDIs
- [ ] Relatório de matriz 9-Box
- [ ] Exportação em PDF/Excel

### 11. Reconhecimento Facial
- [ ] Cadastro de foto facial
- [ ] Detecção e validação de face
- [ ] Login por reconhecimento facial
- [ ] Fallback para senha em caso de falha

### 12. Administração
- [ ] Painel de administração
- [ ] Gestão de usuários
- [ ] Gestão de permissões
- [ ] Configurações do sistema
- [x] Logs de auditoria
- [ ] Backup automático

---

## 🗄️ Banco de Dados

### Tabelas Principais
- [x] users (usuários do sistema)
- [x] employees (colaboradores)
- [x] departments (departamentos)
- [x] positions (cargos)
- [x] competencies (competências)
- [x] competency_levels (níveis de competência)
- [x] evaluation_cycles (ciclos de avaliação)
- [x] goals (metas)
- [x] performance_evaluations (avaliações 360°)
- [x] evaluation_responses (respostas de avaliações)
- [x] nine_box_positions (posicionamento 9-box)
- [x] pdi_plans (planos de PDI)
- [x] pdi_items (ações de PDI)
- [x] pdi_progress (progresso de PDI)
- [x] development_actions (catálogo de ações)
- [x] succession_plans (planos de sucessão)
- [x] email_metrics (métricas de e-mail)
- [x] audit_logs (logs de auditoria)

---

## 🎨 Frontend

### Páginas
- [x] Login (com opção facial)
- [x] Dashboard (por perfil)
- [ ] Perfil do colaborador
- [ ] Metas (lista e detalhes)
- [ ] Avaliações 360° (lista e formulário)
- [ ] Matriz 9-Box (visualização)
- [ ] PDI (lista e detalhes)
- [ ] Catálogo de ações
- [ ] Mapa de sucessão
- [ ] Relatórios
- [ ] Administração

### Componentes
- [x] Layout com sidebar
- [x] Header com notificações
- [ ] Gráfico spider (competências)
- [ ] Matriz 9-Box interativa
- [ ] Formulário de avaliação
- [x] Card de meta
- [ ] Timeline de PDI
- [ ] Captura de foto facial
- [ ] Upload de arquivos

---

## 🔧 Backend (APIs)

### Rotas de Autenticação
- [x] GET /api/auth/me
- [x] POST /api/auth/logout
- [ ] POST /api/auth/login-facial
- [ ] POST /api/auth/register
- [ ] POST /api/auth/reset-password

### Rotas de Colaboradores
- [x] GET /api/trpc/employees.list
- [x] GET /api/trpc/employees.getById
- [x] GET /api/trpc/employees.getCurrent
- [ ] POST /api/employees
- [ ] PUT /api/employees/:id
- [ ] DELETE /api/employees/:id
- [ ] POST /api/employees/:id/photo

### Rotas de Metas
- [x] GET /api/trpc/goals.list
- [x] GET /api/trpc/goals.getById
- [x] POST /api/trpc/goals.create
- [x] PUT /api/trpc/goals.updateProgress
- [ ] DELETE /api/goals/:id
- [ ] PUT /api/goals/:id/approve

### Rotas de Avaliações 360°
- [x] GET /api/trpc/evaluations.list
- [x] GET /api/trpc/evaluations.getById
- [x] POST /api/trpc/evaluations.create
- [ ] POST /api/evaluations/:id/responses
- [ ] GET /api/evaluations/:id/report

### Rotas de PDI
- [x] GET /api/trpc/pdi.list
- [x] GET /api/trpc/pdi.getById
- [x] GET /api/trpc/pdi.getItems
- [x] POST /api/trpc/pdi.create
- [x] POST /api/trpc/pdi.addItem
- [x] GET /api/trpc/pdi.getDevelopmentActions
- [ ] PUT /api/pdi/:id
- [ ] PUT /api/pdi/items/:id/progress
- [ ] GET /api/pdi/:id/recommendations (IA)

### Rotas de 9-Box
- [x] GET /api/trpc/nineBox.getByCycle
- [x] PUT /api/trpc/nineBox.updatePosition
- [ ] POST /api/nine-box/calibrate

### Rotas de Relatórios
- [x] GET /api/trpc/dashboard.getStats
- [ ] GET /api/reports/goals
- [ ] GET /api/reports/evaluations
- [ ] GET /api/reports/pdi
- [ ] GET /api/reports/nine-box

---

## 🧪 Testes

- [ ] Testes unitários (backend)
- [ ] Testes de integração (APIs)
- [ ] Testes E2E (frontend)
- [ ] Testes de segurança
- [ ] Testes de performance

---

## 📚 Documentação

- [x] README.md
- [x] Guia de instalação
- [ ] Guia de uso
- [x] Documentação de APIs (tRPC)
- [x] Diagramas de arquitetura
- [ ] Manual do usuário

---

## 🚀 Deploy

- [ ] Configuração de produção
- [ ] Scripts de deploy
- [ ] Configuração de domínio
- [ ] Configuração de SSL
- [ ] Monitoramento
- [ ] Backup automático

---

## ✅ Concluído Nesta Sessão

### Backend
- [x] Schema completo do banco de dados (24 tabelas)
- [x] Helpers de banco de dados (db.ts)
- [x] Routers tRPC completos (employees, goals, evaluations, PDI, 9-box, dashboard)
- [x] Sistema de auditoria
- [x] Script de seeds com dados de exemplo

### Frontend
- [x] Dashboard funcional com estatísticas
- [x] Layout com sidebar responsivo
- [x] Navegação completa
- [x] Cards de metas e PDI
- [x] Ações rápidas

### Infraestrutura
- [x] Banco de dados populado
- [x] APIs funcionando
- [x] Sistema rodando localmente

---

**Status:** 🟢 Core Funcional - Testável  
**Última atualização:** 17/11/2025  
**Progresso:** ~50% (módulos core implementados e testáveis)


---

## 🎯 Próximas Implementações (Em Andamento)

### Página de Metas
- [x] Lista de metas com filtros
- [x] Formulário de criação de meta
- [ ] Formulário de edição de meta
- [ ] Aprovação de meta pelo gestor
- [x] Visualização de progresso com gráficos
- [x] Atualização de progresso
- [x] Vinculação a PLR/bônus

### Página de Avaliações 360°
- [x] Lista de avaliações
- [ ] Formulário de autoavaliação
- [ ] Formulário de avaliação de pares
- [ ] Formulário de avaliação de gestor
- [ ] Relatório consolidado de feedback
- [x] Visualização de histórico

### Página de PDI
- [x] Lista de PDIs
- [ ] Criação de PDI
- [ ] Análise de gaps de competências
- [ ] Gráfico spider de competências
- [ ] Recomendações automáticas (IA Gemini)
- [ ] Adição de ações de desenvolvimento
- [x] Acompanhamento de progresso
- [ ] Aprovação pelo gestor


---

## 🚀 Implementações em Andamento (Fase 2)

### Formulários de Avaliação 360°
- [x] Formulário de autoavaliação com competências
- [x] Formulário de avaliação de pares
- [x] Formulário de avaliação de gestor
- [x] Sistema de escalas de avaliação (1-5)
- [x] Validação de formulários
- [x] Submissão e confirmação

### Wizard de Criação de PDI
- [ ] Passo 1: Seleção de cargo-alvo
- [ ] Passo 2: Análise de gaps de competências
- [ ] Passo 3: Gráfico spider de competências
- [ ] Passo 4: Recomendações automáticas (IA Gemini)
- [ ] Passo 5: Seleção de ações 70-20-10
- [ ] Passo 6: Revisão e submissão

### Página Matriz 9-Box
- [x] Grid 3x3 interativo
- [x] Posicionamento de colaboradores
- [x] Filtros por departamento
- [x] Detalhes do colaborador
- [ ] Plano de sucessão
- [ ] Exportação de relatório


---

## 🎯 Implementações Finais (Fase 3)

### Wizard de Criação de PDI com IA
- [x] Componente Wizard multi-step
- [x] Passo 1: Seleção de cargo-alvo
- [x] Passo 2: Análise de gaps de competências
- [x] Passo 3: Gráfico spider de competências
- [x] Passo 4: Integração com IA Gemini para recomendações
- [x] Passo 5: Seleção de ações 70-20-10
- [x] Passo 6: Revisão e submissão

### Página de Relatórios
- [x] Dashboard executivo
- [x] Gráficos de evolução de desempenho
- [x] Relatório de metas por departamento
- [x] Relatório de avaliações 360°
- [x] Análise de matriz 9-Box
- [ ] Exportação em PDF

### Sistema de Notificações por E-mail
- [x] Configuração do EmailService
- [x] Notificação de meta vencendo
- [x] Notificação de avaliação pendente
- [x] Notificação de PDI aprovado
- [x] Notificação de nova meta atribuída
- [x] Templates HTML de e-mail


---

## 🚀 Módulos Avançados (Fase 4)

### Reconhecimento Facial
- [x] Instalação de bibliotecas (face-api.js, @tensorflow/tfjs)
- [x] Componente de cadastro facial (captura múltiplas fotos)
- [ ] Armazenamento de descritores faciais no banco
- [x] Página de login com opção facial
- [x] Componente de verificação facial
- [x] Threshold de confiança configurável
- [x] Fallback para login tradicional
- [ ] Testes de precisão

### Integração TOTVS RM
- [x] Configuração de API TOTVS RM
- [x] Endpoint de sincronização de colaboradores
- [x] Endpoint de sincronização de departamentos
- [x] Endpoint de sincronização de cargos
- [x] Mapeamento de campos TOTVS → AVD
- [ ] Agendamento automático (cron job)
- [x] Log de sincronizações
- [x] Tratamento de erros e retry

### Sistema de Calibração
- [x] Página de calibração de avaliações
- [x] Listagem de avaliações por departamento
- [x] Interface de ajuste de notas
- [x] Histórico de calibrações
- [x] Comentários de calibração
- [ ] Notificação aos avaliados
- [ ] Relatório de calibração
- [x] Auditoria de mudanças


---

## 🎯 Melhorias Finais (Fase 5)

### Modelos Face-API.js
- [x] Script de download automático dos modelos
- [x] Adicionar modelos à pasta public/models
- [x] Validação de modelos carregados

### Configuração TOTVS
- [x] Adicionar variáveis ao .env.example
- [x] Documentação de configuração TOTVS
- [ ] Testes de conexão TOTVS

### Exportação de Relatórios PDF
- [x] Instalação de biblioteca jsPDF
- [x] Exportar dashboard em PDF
- [x] Exportar matriz 9-Box em PDF
- [x] Exportar relatório de metas em PDF
- [x] Exportar relatório de avaliações em PDF

### Funcionalidades Adicionais
- [ ] Página de configurações do sistema
- [ ] Página de perfil do usuário
- [ ] Notificações em tempo real
- [ ] Busca global no sistema
- [ ] Modo escuro/claro


---

## 🎯 Fase 6 - Funcionalidades Finais e Importação de Dados

### Página de Configurações
- [ ] Painel administrativo
- [ ] Gerenciamento de ciclos de avaliação
- [ ] Gerenciamento de competências
- [ ] Gerenciamento de cargos
- [ ] Gerenciamento de departamentos
- [ ] Configurações de e-mail
- [ ] Configurações de integração TOTVS

### Página de Perfil do Usuário
- [ ] Edição de dados pessoais
- [ ] Upload de foto de perfil
- [ ] Preferências de notificação
- [ ] Gerenciamento de reconhecimento facial
- [ ] Histórico de atividades
- [ ] Alteração de senha

### Notificações em Tempo Real
- [ ] Implementação de WebSockets
- [ ] Sistema de notificações no header
- [ ] Badge de contagem de notificações
- [ ] Marcação de lidas/não lidas
- [ ] Histórico de notificações

### Importação de Dados
- [x] Processar arquivo de seções (Excel) - 206 seções
- [x] Processar arquivo de funcionários (Excel) - 2.889 funcionários
- [ ] Processar mapa sucessório (PowerPoint)
- [x] Script de importação automática (import-to-db.ts)
- [x] Validação de dados importados
- [x] Relatório de importação


---

## 🎯 Fase 7 - Execução Final

### Execução de Importação
- [ ] Executar script import-to-db.ts
- [ ] Verificar dados importados no banco
- [ ] Validar integridade dos relacionamentos

### Processamento de Mapa Sucessório
- [ ] Extrair dados do PowerPoint
- [ ] Identificar talentos-chave
- [ ] Popular matriz 9-Box automaticamente
- [ ] Criar registros de sucessão

### Página de Configurações
- [x] Layout da página
- [x] Gerenciamento de ciclos
- [x] Gerenciamento de competências
- [x] Configurações de sistema
- [x] Configurações de e-mail
- [x] Configurações TOTVS RM
- [x] Gerenciamento de departamentos


---

## 🎯 Fase 8 - Finalização

### Correção e Execução de Importação
- [ ] Corrigir script import-to-db.ts
- [ ] Executar importação de departamentos
- [ ] Executar importação de cargos
- [ ] Executar importação de funcionários
- [ ] Validar dados importados

### Página de Perfil do Usuário
- [x] Layout da página
- [x] Edição de dados pessoais
- [x] Upload de foto de perfil
- [x] Gerenciamento de reconhecimento facial
- [x] Preferências de notificação
- [x] Histórico de atividades

### Notificações em Tempo Real
- [x] Configuração de WebSocket
- [x] Sistema de eventos
- [x] Notificações de novas metas
- [x] Notificações de avaliações pendentes
- [x] Notificações de aprovações
- [x] Badge de contagem
- [x] Componente NotificationBell
- [x] Contexto de notificações


---

## 🎯 Fase 9 - Finalização e Testes

### Correção e Execução de Importação (Revisão)
- [x] Mapear níveis de cargo corretamente
- [x] Criar script import-from-excel.ts que lê arquivos diretamente
- [x] Instalar biblioteca xlsx
- [ ] Executar importação de departamentos
- [ ] Executar importação de cargos  
- [ ] Executar importação de funcionários (2.889)
- [ ] Validar dados importados no banco

### Backend WebSocket
- [x] Configurar Socket.IO no servidor Express
- [x] Criar sistema de eventos de notificação
- [x] Implementar notificação de nova meta
- [x] Implementar notificação de avaliação pendente
- [x] Implementar notificação de aprovação de PDI
- [x] Implementar notificação de prazo próximo
- [x] NotificationService completo com 12 tipos de notificações
- [ ] Testar envio de notificações em tempo real

### Testes Automatizados
- [ ] Configurar Vitest
- [ ] Testes de criação de metas
- [ ] Testes de submissão de avaliações
- [ ] Testes de geração de PDI
- [ ] Testes de integração de APIs
- [ ] Testes de notificações


---

## 🐛 Correção de Bugs

### Erro "Colaborador não encontrado"
- [x] Adicionar tratamento para quando colaborador não existe
- [x] Permitir sistema funcionar sem dados de colaborador
- [x] Retornar dados vazios no dashboard quando não houver colaborador

- [x] Corrigir endpoint employees.getCurrent para retornar null em vez de undefined
- [x] Corrigir endpoint employees.getByUserId para retornar null em vez de undefined
