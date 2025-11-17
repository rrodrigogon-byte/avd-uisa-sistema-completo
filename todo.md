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
- [ ] Dashboard de metas

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
- [x] API REST completa
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
- [ ] Card de meta
- [ ] Timeline de PDI
- [ ] Captura de foto facial
- [ ] Upload de arquivos

---

## 🔧 Backend (APIs)

### Rotas de Autenticação
- [x] POST /api/auth/login
- [ ] POST /api/auth/login-facial
- [ ] POST /api/auth/register
- [x] POST /api/auth/logout
- [ ] POST /api/auth/reset-password
- [x] GET /api/auth/me

### Rotas de Colaboradores
- [x] GET /api/employees
- [x] GET /api/employees/:id
- [ ] POST /api/employees
- [ ] PUT /api/employees/:id
- [ ] DELETE /api/employees/:id
- [ ] POST /api/employees/:id/photo

### Rotas de Metas
- [x] GET /api/goals
- [x] GET /api/goals/:id
- [ ] POST /api/goals
- [ ] PUT /api/goals/:id
- [ ] DELETE /api/goals/:id
- [ ] PUT /api/goals/:id/approve

### Rotas de Avaliações 360°
- [x] GET /api/evaluations
- [x] GET /api/evaluations/:id
- [ ] POST /api/evaluations
- [ ] POST /api/evaluations/:id/responses
- [ ] GET /api/evaluations/:id/report

### Rotas de PDI
- [x] GET /api/pdi
- [x] GET /api/pdi/:id
- [ ] POST /api/pdi
- [ ] PUT /api/pdi/:id
- [ ] POST /api/pdi/:id/items
- [ ] PUT /api/pdi/items/:id/progress
- [ ] GET /api/pdi/:id/recommendations (IA)

### Rotas de 9-Box
- [x] GET /api/nine-box
- [ ] PUT /api/nine-box/:id/position
- [ ] POST /api/nine-box/calibrate

### Rotas de Relatórios
- [ ] GET /api/reports/goals
- [ ] GET /api/reports/evaluations
- [ ] GET /api/reports/pdi
- [ ] GET /api/reports/nine-box
- [x] GET /api/reports/dashboard

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
- [x] Documentação de APIs
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

**Status:** 🟡 Core Funcional - Pronto para Validação  
**Última atualização:** 17/11/2025  
**Progresso:** ~40% (módulos core implementados)
