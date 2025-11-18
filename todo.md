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


---

## 🐛 Correções de Bugs (Sessão Atual)

- [x] Adicionar tratamento para quando colaborador não existe
- [x] Permitir sistema funcionar sem dados de colaborador
- [x] Retornar dados vazios no dashboard quando não houver colaborador
- [x] Corrigir endpoint employees.getCurrent para retornar null em vez de undefined
- [x] Corrigir endpoint employees.getByUserId para retornar null em vez de undefined
- [x] Remover throws de erro "Colaborador não encontrado" em goals.list, evaluations.list e pdi.list
- [x] Retornar arrays vazios quando colaborador não existe


---

## 🚀 Execução Final - Importação e Testes (Sessão Atual)

- [x] Executar script de importação de dados (npx tsx scripts/import-from-excel.ts)
- [x] Verificar importação de 2.889 funcionários no banco
- [x] Verificar importação de 387 cargos no banco
- [x] Vincular usuário admin (rrodrigogon@gmail.com) a um colaborador
- [x] Criar ciclo de avaliação de teste
- [x] Criar meta de teste
- [x] Criar PDI de teste
- [x] Validar sistema completo funcionando


---

## 🎯 Cadastro de Competências Organizacionais (Sessão Atual)

- [x] Criar competências comportamentais da UISA
- [x] Criar competências técnicas por área
- [x] Definir níveis de proficiência (1-5) para cada competência
- [x] Vincular competências aos cargos
- [x] Testar avaliação 360° com competências
- [x] Sistema pronto para PDI Inteligente com análise de gaps


---

## 🎯 Avaliação 360° Completa + Sucessão (Sessão Atual)

### Avaliação 360°
- [x] Criar perguntas de autoavaliação (10 perguntas)
- [x] Criar perguntas para avaliação de gestores (14 perguntas)
- [x] Criar perguntas para avaliação de pares (6 perguntas)
- [x] Criar perguntas para avaliação de subordinados (10 perguntas)
- [x] Implementar etapa de consenso (6 perguntas)
- [x] Implementar calibração entre diretores (6 perguntas)

### PDI Inteligente
- [x] Criar avaliações de competências para colaboradores
- [x] Sistema pronto para gerar PDI com IA Gemini
- [x] Sistema pronto para análise de gaps de competências

### Processo de Sucessão
- [x] Configurar Matriz 9-Box (Desempenho × Potencial)
- [x] Criar planos de sucessão para cargos críticos (15 planos)
- [x] Identificar sucessores potenciais (3 candidatos)
- [x] Popular Matriz 9-Box com exemplos (13 posicionamentos)


---

## 📊 Histórico de Avaliações e PDIs (Sessão Atual)

### Backend
- [x] Criar endpoint para histórico de avaliações 360°
- [x] Criar endpoint para histórico de PDIs
- [x] Criar endpoint para evolução de competências
- [x] Criar endpoint para histórico de Matriz 9-Box

### Frontend
- [x] Criar página de Histórico
- [x] Implementar timeline de avaliações
- [x] Implementar visualização de evolução de desempenho
- [x] Implementar visualização de PDIs anteriores
- [x] Implementar visualização de evolução de competências
- [x] Adicionar rota no menu lateral


---

## 🚀 Funcionalidades Pendentes do Escopo Original

### Visualizações Gráficas
- [x] Implementar visualização gráfica da Matriz 9-Box (grid 3x3 interativo)
- [x] Implementar gráfico spider de competências no PDI
- [x] Implementar visualização gráfica do pipeline de sucessão (organograma)
- [ ] Adicionar gráficos de evolução temporal no Histórico

### IA Gemini - PDI Inteligente
- [x] Integrar Gemini AI para análise de gaps de competências
- [x] Implementar recomendações automáticas de ações de desenvolvimento
- [x] Criar prompt engineering para sugestões personalizadas 70-20-10
- [ ] Adicionar botão "Gerar PDI com IA" na interface

### Sistema de Notificações por E-mail
- [x] Implementar e-mail de boas-vindas
- [x] Implementar e-mail de reset de senha
- [x] Implementar notificação de meta criada/aprovada
- [x] Implementar notificação de avaliação pendente
- [x] Implementar notificação de PDI criado/aprovado
- [x] Implementar notificação de ação de PDI vencida
- [ ] Criar cron jobs para lembretes automáticos
- [x] Criar templates HTML responsivos para e-mails

### Aprovações e Calibração
- [x] Implementar fluxo de aprovação de PDI pelo gestor
- [x] Implementar calibração da Matriz 9-Box por diretoria
- [x] Implementar ajustes manuais de 9-Box pelo RH
- [x] Sistema de alertas de ações de PDI vencidas (via e-mail)

### Relatórios
- [ ] Implementar relatório consolidado de feedback 360°
- [ ] Implementar exportação de relatórios em PDF
- [ ] Implementar exportação da Matriz 9-Box
- [ ] Implementar exportação de PDIs

### Autenticação
- [ ] Implementar recuperação de senha por e-mail
- [ ] Adicionar página de reset de senha
- [ ] Implementar validação de token de recuperação


---

## 🎨 Reorganização do Menu Lateral
- [x] Criar seção "Performance" com submenu
- [x] Adicionar "Performance Integrada" no submenu
- [x] Adicionar "Avaliação 360°" no submenu
- [x] Adicionar "360° Enhanced" no submenu
- [x] Adicionar "Calibração" no submenu
- [x] Adicionar "Nine Box" no submenu
- [x] Criar seção "Desenvolvimento" com submenu
- [x] Adicionar "PDI Inteligente" no submenu
- [x] Adicionar "Mapa de Sucessão" no submenu
- [x] Criar seção "Aprovações" com submenu

## 📄 Exportação de Relatórios em PDF
- [x] Implementar exportação de relatório 360°
- [x] Implementar exportação de PDI
- [x] Implementar exportação de Matriz 9-Box
- [x] Endpoints backend prontos para geração de PDF

## 🔐 Recuperação de Senha
- [x] Criar tabela de tokens de reset de senha
- [x] Implementar endpoint de solicitação de reset
- [x] Implementar endpoint de validação de token
- [x] Implementar endpoint de redefinição de senha
- [ ] Criar página de reset de senha no frontend

## ⏰ Cron Jobs de Lembretes
- [x] Criar cron job de lembretes de metas (diário às 9h)
- [x] Criar cron job de avaliações pendentes (segundas às 9h)
- [x] Criar cron job de ações de PDI vencidas (diário às 10h)
- [x] Configurar agendamento automático com node-cron


---

## 📊 Visualização Gráfica da Matriz 9-Box
- [x] Criar página NineBox.tsx com grid 3x3 interativo
- [x] Implementar posicionamento de colaboradores no grid
- [x] Adicionar cores diferenciadas por quadrante (9 categorias)
- [x] Implementar tooltips com informações detalhadas
- [x] Criar interface de ajustes manuais para RH/Diretoria
- [x] Adicionar registro de motivos de ajuste
- [x] Implementar endpoints backend (list, adjust)
- [x] Adicionar estatísticas por quadrante


---

## 👥 Gestão de Pessoas
- [x] Criar página de Funcionários com CRUD completo
- [x] Implementar filtros e busca de funcionários
- [x] Adicionar importação/exportação de funcionários
- [x] Criar página de Departamentos (stub)
- [x] Criar página de Centros de Custo (stub)
- [x] Adicionar seção Gestão de Pessoas ao menu

## ✅ Aprovações (Expandido)
- [x] Criar Dashboard de Aprovações (stub)
- [x] Criar página Minhas Solicitações (stub)
- [x] Criar página de Bônus (stub)
- [x] Criar página de Workflows (stub)
- [x] Expandir seção Aprovações no menu

## 🧠 Testes Psicométricos
- [x] Criar schema de tabelas de testes psicométricos
- [x] Popular 40 perguntas DISC no banco
- [ ] Criar página de questionário DISC
- [ ] Implementar cálculo de perfil DISC
- [ ] Popular 50 perguntas Big Five no banco
- [ ] Criar página de questionário Big Five
- [ ] Implementar cálculo de perfil Big Five
- [ ] Criar relatórios visuais de perfil comportamental

## 📊 Páginas Faltantes
- [ ] Criar página Performance Integrada (dashboard consolidado)
- [ ] Criar página 360° Enhanced (avaliação aprimorada)
- [ ] Criar página Mapa de Sucessão visual (organograma interativo)

## 🔧 População da Matriz 9-Box
- [x] Criar script de cálculo de performance (avaliações + metas)
- [x] Criar script de cálculo de potencial (competências + testes + carreira)
- [x] Implementar posicionamento automático nos 9 quadrantes
- [x] Executar script e popular Matriz 9-Box com 2.893 colaboradores
- [x] Validar distribuição de colaboradores na matriz

## 🔧 Integrações
- [x] Corrigir todos os erros 404
- [ ] Implementar integração TOTVS RM


---

## 🐛 Correção de Erro 404
- [x] Criar página Sucessao.tsx
- [x] Registrar rota /sucessao no App.tsx
- [x] Testar acesso à página


---

## 🚀 Implementação Completa - Próximos Passos

### Backend de Sucessão
- [x] Criar endpoint successionPlans.list no routers.ts
- [x] Buscar 15 planos de sucessão do banco
- [x] Conectar página Sucessao.tsx ao endpoint

### Organograma Interativo
- [ ] Instalar biblioteca ReactFlow
- [ ] Criar componente SuccessionOrgChart
- [ ] Implementar visualização hierárquica
- [ ] Adicionar interatividade (zoom, pan, click)

### Performance Integrada
- [x] Criar página PerformanceIntegrada.tsx
- [x] Dashboard consolidado com KPIs
- [x] Adicionar rota no App.tsx

### 360° Enhanced
- [x] Criar página Avaliacao360Enhanced.tsx
- [x] Interface com etapas da avaliação
- [x] Botões de consenso e calibração
- [x] Adicionar rota no App.tsx

### Testes Psicométricos Completos
- [ ] Popular 50 perguntas Big Five
- [ ] Criar página TesteDISC.tsx com questionário
- [ ] Criar página TesteBigFive.tsx com questionário
- [ ] Implementar cálculo de perfil DISC
- [ ] Implementar cálculo de perfil Big Five
- [ ] Criar relatórios visuais com gráficos radar

## 🐛 Correções Recentes

- [x] Corrigir erro de chave duplicada na página Nine Box (key={emp.id} → key={`${key}-emp-${emp.id}-${idx}`})
- [x] Completar Testes Psicométricos (50 perguntas Big Five)
- [x] Criar questionários interativos DISC e Big Five
- [x] Implementar cálculo de perfil psicométrico
- [x] Endpoints backend (getQuestions, submitTest, getTests)
- [x] Páginas de testes com escala Likert 1-5
- [x] Gráficos radar de resultados
- [x] Criar organograma interativo de sucessão com ReactFlow
- [x] Ativar cron jobs e notificações automáticas

## 🎯 Nova Implementação: Painel de Administração SMTP

- [x] Criar schema de configurações SMTP no banco de dados (systemSettings)
- [x] Implementar endpoints backend (getSmtpConfig, updateSmtpConfig, testSmtpConnection)
- [x] Criar página de administração com formulário de SMTP (/admin/smtp)
- [x] Integrar configurações SMTP com EmailService (busca dinâmica do banco)
- [x] Adicionar botão de teste de envio de e-mail
- [x] Menu "SMTP (Admin)" na seção Configurações

## 📊 Nova Implementação: Dashboard de Métricas de E-mail

- [x] Implementar endpoints backend para buscar métricas (getEmailMetrics, getEmailStats)
- [x] Criar página /admin/email-metrics com gráficos
- [x] Gráfico de linha: histórico mensal de envios (Chart.js)
- [x] Gráfico de pizza: taxa de sucesso vs falha
- [x] Gráfico de barras: tipos de e-mails mais enviados
- [x] Cards com estatísticas resumidas (total enviado, taxa de sucesso, etc)
- [x] Adicionar menu "Métricas de E-mail" na seção Configurações
- [x] Instalar react-chartjs-2 e chart.js

## 🔧 Correção e Desenvolvimento: Calibração e 360° Enhanced

- [x] Analisar e corrigir erros nas páginas atuais
- [x] Implementar schema de calibração no banco (calibrationSessions, calibrationReviews)
- [x] Criar endpoints backend para Calibração (getEvaluations, saveCalibration, getHistory, createSession)
- [x] Desenvolver página de Calibração completa com diálogos de ajuste
- [x] Implementar funcionalidades de ajuste de ratings com histórico
- [x] Criar endpoints backend para 360° Enhanced (list, getDetails, submitFeedback)
- [x] Desenvolver página 360° Enhanced com múltiplos avaliadores
- [x] Implementar gráficos radar comparativos (autoavaliação vs pares vs gestor vs subordinados)
- [x] Adicionar estatísticas detalhadas de respostas por tipo de avaliador
- [x] Renomear router antigo calibration para nineBoxCalibration (evitar conflito)

## 🚀 Próximos Passos: Avaliação 360° Avançada

- [x] Criar endpoint para buscar perguntas de avaliação 360° (evaluation360.getQuestions)
- [x] Criar página /avaliar-360/:evaluationId com formulário interativo
- [x] Implementar seleção de tipo de avaliador (self, manager, peer, subordinate)
- [x] Organizar perguntas por categoria com navegação (6 categorias)
- [x] Adicionar validação e salvamento de respostas
- [x] Popular 23 perguntas de avaliação 360° (Liderança, Comunicação, Trabalho em Equipe, Resultados, Desenvolvimento, Feedback Aberto)
- [ ] Criar schema de mensagens de chat para calibração (calibrationMessages criado)
- [ ] Implementar WebSocket para sessões de calibração em grupo (adiado - complexidade alta)
- [ ] Criar página /calibracao/sessao/:sessionId com lista de participantes (adiado)
- [ ] Adicionar chat em tempo real para discussão (adiado)
- [ ] Implementar votação colaborativa de ajustes (adiado)
- [x] Instalar jsPDF e html2canvas para geração de PDF
- [x] Criar função de geração de PDF com análise completa (generate360PDF.ts)
- [x] Adicionar seções de médias, estatísticas e recomendações ao PDF
- [x] Implementar botão "Exportar Relatório" na página 360° Enhanced

## 🚀 Expansão Completa: Performance + Testes + Recursos Avançados

### Novos Testes Psicométricos
- [x] Popular perguntas do teste MBTI (16 personalidades) - 20 perguntas
- [x] Popular perguntas de Inteligência Emocional (Goleman) - 25 perguntas
- [x] Popular perguntas de Estilos de Aprendizagem (VARK) - 20 perguntas
- [x] Atualizar schema de testQuestions para suportar mbti, ie, vark
- [x] Migração 0007 aplicada
- [x] Criar páginas de questionários para MBTI, IE e VARK (TestMBTI.tsx, TestIE.tsx, TestVARK.tsx)
- [x] Atualizar router psychometric para suportar novos testes
- [x] Atualizar schema psychometricTests (migração 0008)
- [x] Adicionar rotas no App.tsx (/teste-mbti, /teste-ie, /teste-vark)
- [x] Adicionar cards dos novos testes na página PsychometricTests
- [ ] Implementar cálculo de resultados para MBTI, IE e VARK
- [ ] Adicionar gráficos e interpretações de resultados

### Expansão do Módulo de Performance
- [ ] Criar avaliações por competências customizáveis
- [ ] Implementar matriz de competências por cargo
- [ ] Criar relatórios de performance por departamento
- [ ] Adicionar comparativo de performance ao longo do tempo
- [ ] Implementar metas em cascata (corporativas → departamentais → individuais)
- [ ] Criar dashboard executivo de performance

### Notificações In-App em Tempo Real
- [ ] Criar componente de sino de notificações no header
- [ ] Implementar badge com contador de não lidas
- [ ] Criar dropdown com lista de notificações
- [ ] Adicionar marcação de lida/não lida
- [ ] Implementar polling ou WebSocket para atualização automática
- [ ] Criar tipos de notificação (meta vencida, avaliação pendente, aprovação PDI)

### Histórico de Alterações (Audit Trail)
- [ ] Criar página /admin/audit-log
- [ ] Implementar filtros por usuário, data, tipo de ação
- [ ] Adicionar visualização detalhada de cada alteração
- [ ] Implementar paginação e busca
- [ ] Criar exportação de relatório de auditoria em CSV

### Integração com Calendário
- [ ] Criar função para gerar arquivos .ics
- [ ] Adicionar botão "Adicionar ao Calendário" em metas
- [ ] Adicionar botão "Adicionar ao Calendário" em ações de PDI
- [ ] Implementar download automático do arquivo .ics
- [ ] Suportar Google Calendar e Outlook
