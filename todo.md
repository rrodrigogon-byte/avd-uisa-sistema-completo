# Sistema AVD UISA - TODO

## 🐛 Correção Erro pdiRisks

- [x] Adicionar coluna type (renomear category)
- [x] Adicionar coluna responsible
- [x] Testar página de PDI Inteligente

## 🐛 Correção Erro pdiIntelligentDetails

- [x] Verificar schema de pdiIntelligentDetails
- [x] Tornar campos opcionais ou adicionar valores padrão
- [x] Criar tabela pdiIntelligentDetails
- [x] Criar tabela pdiCompetencyGaps
- [x] Criar tabela pdiRisks
- [x] Criar tabela pdiReviews
- [x] Testar criação de PDI Inteligente

## 🐛 Correção Erro goalMilestones

- [x] Verificar se tabela goalMilestones existe no schema
- [x] Criar tabela goalMilestones se não existir
- [x] Executar migração do banco de dados
- [x] Testar página de progresso de meta

## 🎨 Melhorias de Performance (Cores e Layout)

- [ ] Acessar página de Avaliação 360° Enhanced
- [ ] Aplicar paleta de cores moderna (roxo #7C3AED, azul #3B82F6, verde #10B981, amarelo #F59E0B)
- [ ] Redesenhar cards de KPIs com ícones coloridos
- [ ] Melhorar layout do dashboard de avaliações
- [ ] Adicionar gráficos de progresso e métricas
- [ ] Implementar visualizações de competências

## 🧠 Testes Psicométricos Completos

- [ ] Desenvolver teste DISC (Dominância, Influência, Estabilidade, Conformidade)
- [ ] Desenvolver teste Big Five (OCEAN)
- [ ] Desenvolver teste 16 Personalities (MBTI)
- [ ] Desenvolver teste de Inteligência Emocional (Goleman)
- [ ] Desenvolver teste de Estilos de Liderança
- [ ] Desenvolver teste de Âncoras de Carreira (Schein)
- [ ] Criar schema de banco para testes e respostas
- [ ] Implementar sistema de envio de testes
- [ ] Criar interface de envio para funcionários/equipes/departamentos
- [ ] Desenvolver dashboards de resultados individuais
- [ ] Desenvolver dashboards de resultados comparativos
- [ ] Popular dados de demonstração de testes
- [ ] Testar fluxo completo end-to-end
- [ ] Aplicar paleta de cores inspirada nas imagens (roxo #7C3AED, azul #3B82F6, verde #10B981, amarelo #F59E0B)
- [ ] Redesenhar cards de KPIs com ícones coloridos
- [ ] Melhorar layout do dashboard de avaliações
- [ ] Adicionar gráficos de progresso e métricas
- [ ] Implementar visualizações de competências
- [ ] Popular dados de demonstração (ciclos, avaliações, competências)
- [ ] Testar fluxo completo de avaliação 360°
- [ ] Validar responsividade e UX

## 💰 Formatação Monetária R$ e Validar SMART

- [x] Criar helper de formatação monetária R$ (pt-BR)
- [x] Aplicar formatação R$ em campos de bônus (Metas)
- [x] Aplicar formatação R$ em campos de valores (PDI, Avaliações)
- [ ] Corrigir botão "Validar SMART" em CriarMetaSMART.tsx
- [ ] Testar gravação de meta após validação SMART
- [ ] Analisar arquivos HTML/PDF de PDIs enviados
- [ ] Extrair dados dos PDIs (Agenor, Pablo, Paulo, Nadia, Callegari, Eduardo, Fernando)
- [ ] Importar PDIs para o banco de dados
- [ ] Validar PDIs importados no sistema

## 🔍 PDI Inteligente - Busca Completa de Funcionários UISA

- [x] Verificar endpoint employees.list para retornar todos os 2.889 funcionários
- [x] Corrigir Combobox de busca de colaboradores na página /pdi-inteligente/novo
- [x] Implementar busca com filtro por nome, cargo e departamento
- [x] Testar criação de PDI com colaborador selecionado
- [x] Validar que todos os campos do formulário funcionam corretamente
- [x] Garantir que a busca funciona perfeitamente com grande volume de dados

## 📊 Sistema Completo de Testes Psicométricos (Prioridade Alta)

- [x] Popular perguntas do teste DISC no banco de dados
- [x] Popular perguntas do teste Big Five no banco de dados
- [x] Popular perguntas do teste MBTI no banco de dados
- [x] Popular perguntas do teste Inteligência Emocional no banco de dados
- [x] Popular perguntas do teste Estilos de Liderança no banco de dados
- [x] Popular perguntas do teste Âncoras de Carreira no banco de dados
- [x] Criar páginas de questionários para cada teste
- [x] Implementar cálculo de resultados para cada teste
- [x] Criar sistema de envio de testes para funcionários individuais
- [x] Criar sistema de envio de testes para equipes
- [x] Criar sistema de envio de testes para departamentos
- [ ] Criar dashboard de resultados por funcionário
- [ ] Criar dashboard de resultados comparativos por equipe/departamento
- [ ] Adicionar gráficos radar para visualização de perfis
- [ ] Integrar resultados de testes com PDI Inteligente

## 🎨 Melhorias de Performance - Design Moderno (Prioridade Alta)

- [ ] Redesenhar Performance Integrada com paleta moderna
- [ ] Redesenhar 360° Enhanced com paleta moderna
- [ ] Aplicar cores: roxo #7C3AED, azul #3B82F6, verde #10B981
- [ ] Criar cards de KPIs coloridos com ícones (lucide-react)
- [ ] Adicionar gráficos de competências com Recharts
- [ ] Melhorar visualizações de resultados 360°
- [ ] Implementar animações e transições suaves
- [ ] Adicionar indicadores visuais de progresso


## 📊 Dashboards Comparativos de Testes Psicométricos

- [x] Criar endpoint para buscar resultados agregados por equipe
- [x] Criar endpoint para buscar resultados agregados por departamento
- [x] Criar endpoint para buscar resultados agregados por cargo
- [x] Implementar página de dashboard comparativo com gráficos radar
- [x] Adicionar filtros por tipo de teste, período e grupo
- [x] Implementar visualização de distribuição de perfis
- [x] Adicionar comparação lado a lado de equipes/departamentos

## 🔗 Integração Testes + PDI Inteligente

- [x] Criar sistema de recomendações automáticas baseado em perfis
- [x] Mapear perfis psicométricos para competências e cursos
- [x] Integrar resultados na página de criação de PDI
- [x] Adicionar sugestões de desenvolvimento por perfil
- [x] Implementar análise de gaps de competências

## 📈 Relatórios Executivos de RH

- [x] Criar página de relatórios executivos
- [x] Implementar análise de distribuição de perfis organizacionais
- [x] Adicionar insights sobre gaps de competências
- [x] Criar sugestões de formação de equipes
- [x] Implementar análise de tendências ao longo do tempo
- [ ] Adicionar exportação de relatórios em PDF (preparado para implementação futura)

## 🎨 Melhorias de Design nas Páginas de Performance

- [ ] Redesenhar página de Performance Integrada com cores vibrantes
- [ ] Melhorar visualização de gráficos e métricas
- [ ] Adicionar animações e transições suaves
- [ ] Implementar tema moderno e profissional


## 📄 Exportação de Relatórios em PDF

- [x] Instalar biblioteca html2pdf ou puppeteer
- [x] Criar função de exportação de relatórios executivos
- [x] Criar função de exportação de dashboards comparativos
- [x] Criar função de exportação de recomendações de PDI
- [x] Adicionar botões de exportação nas páginas
- [x] Implementar templates de PDF profissionais
- [x] Adicionar logo e branding nos PDFs

## 🔔 Sistema de Notificações Push

- [x] Criar schema de notificações no banco de dados
- [x] Implementar endpoint de criação de notificações
- [x] Criar componente de centro de notificações no header
- [ ] Implementar notificações quando colaborador completa teste (trigger automático)
- [ ] Implementar notificações quando PDI atinge marco (trigger automático)
- [ ] Implementar notificações de insights críticos (trigger automático)
- [x] Adicionar badge de contagem de não lidas
- [x] Implementar marcação de lida/não lida

## 📊 Módulo de Benchmarking Externo

- [ ] Criar schema de dados de benchmarking
- [ ] Popular dados de médias de mercado por setor/cargo
- [ ] Criar página de benchmarking comparativo
- [ ] Implementar gráficos de comparação UISA vs Mercado
- [ ] Adicionar análise de vantagens competitivas
- [ ] Implementar identificação de gaps vs mercado
- [ ] Criar relatório de posicionamento competitivo


## 🔄 Triggers Automáticos de Notificações

- [x] Adicionar trigger ao endpoint de conclusão de teste psicométrico
- [x] Adicionar trigger ao endpoint de atualização de progresso de PDI
- [ ] Adicionar trigger ao endpoint de conclusão de avaliação 360° (pendente endpoint específico)
- [x] Adicionar trigger ao endpoint de conclusão de meta
- [ ] Adicionar trigger para insights críticos identificados (implementar quando necessário)
- [x] Testar criação automática de notificações

## 📄 Página de Histórico de Notificações

- [x] Criar página /notificacoes com lista completa
- [x] Implementar filtros por tipo de notificação
- [x] Implementar filtros por período (hoje, semana, mês, ano)
- [x] Implementar filtro por status (lidas/não lidas)
- [x] Adicionar busca textual por título e mensagem
- [x] Implementar paginação (limite de 100 notificações)
- [x] Adicionar botão de limpar todas as notificações (marcar todas como lidas)


## 🔧 Correções Urgentes

### Analytics de RH
- [x] Corrigir layout quebrado com legenda sobrepondo conteúdo
- [x] Reorganizar posicionamento dos gráficos
- [x] Ajustar z-index e overflow da legenda

### Dashboard Executivo
- [x] Adicionar seção de distribuição do Nine Box
- [x] Implementar gráfico de distribuição por quadrante
- [x] Adicionar métricas de talentos por categoria

### Criar Meta SMART
- [x] Implementar lógica de seleção exclusiva entre % e Bônus Fixo
- [x] Corrigir botão "Validar SMART" para funcionar
- [x] Garantir que meta seja gravada corretamente
- [x] Adicionar validações de campos obrigatórios

## 📊 Módulo de Benchmarking Externo
- [ ] Criar schema de dados de mercado
- [ ] Popular dados de benchmark por setor/cargo
- [ ] Criar página de comparação com médias de mercado
- [ ] Implementar gráficos radar comparativos
- [ ] Adicionar análise de gaps competitivos


## 🔧 Correção de Workflows
- [x] Verificar schema da tabela workflows no drizzle/schema.ts
- [x] Criar tabela workflows no banco de dados se não existir
- [x] Testar página /aprovacoes/workflows


## 🔄 Fluxo Completo de Avaliação 360°
- [ ] Atualizar schema com campos de status do fluxo (selfAssessmentStatus, managerAssessmentStatus, consensusStatus)
- [ ] Adicionar campos de datas (selfAssessmentCompletedAt, managerAssessmentCompletedAt, consensusCompletedAt)
- [ ] Criar endpoint para funcionário submeter autoavaliação
- [ ] Criar endpoint para gestor submeter avaliação
- [ ] Criar endpoint para líder submeter consenso
- [ ] Implementar notificações por email em cada transição
- [ ] Criar página de autoavaliação para funcionário
- [ ] Criar página de avaliação para gestor
- [ ] Criar página de consenso para líder
- [ ] Habilitar/desabilitar botões conforme etapa do fluxo
- [ ] Adicionar validações de permissões por etapa
- [ ] Testar fluxo completo end-to-end


## 🔧 Correção Nine Box
- [x] Corrigir matriz Nine Box invertida (validar eixos X e Y)

## 📊 Filtros Hierárquicos Nine Box Comparativo
- [x] Criar endpoint para buscar subordinados diretos por managerId
- [x] Implementar filtro por nível hierárquico (Diretoria, Gerência, Coordenação, Supervisão)
- [x] Implementar filtro por cargo de liderança unificado
- [x] Adicionar dropdown com lista de líderes
- [x] Filtrar matriz Nine Box pelos subordinados do líder selecionado (lógica de filtro a implementar)
- [x] Implementar lógica de classificação por nível hierárquico baseado em subordinados
- [x] Conectar filtros ao endpoint getComparative

## 🔧 Correção 360° Enhanced
- [x] Corrigir exibição de nome do colaborador (mostrar nome ao invés de código)

## 🔄 Fluxo Completo Avaliação 360°
- [ ] Atualizar schema com campos de status do fluxo (autoavaliação, avaliação gestor, consenso)
- [ ] Criar endpoint de autoavaliação
- [ ] Criar endpoint de avaliação do gestor
- [ ] Criar endpoint de consenso do líder
- [ ] Implementar notificações automáticas por email em cada transição
- [ ] Criar interface de autoavaliação para funcionário
- [ ] Criar interface de avaliação para gestor
- [ ] Criar interface de consenso para líder
- [ ] Habilitar/desabilitar botões conforme etapa

## 📊 Página de Benchmarking
- [ ] Criar página /benchmarking
- [ ] Implementar endpoint de comparação UISA vs Mercado
- [ ] Criar gráficos radar DISC comparativos
- [ ] Criar gráficos radar Big Five comparativos
- [ ] Adicionar análise automática de gaps
- [ ] Implementar filtros por setor e cargo

## 🔄 Fluxo Completo de Avaliação 360°
- [ ] Atualizar schema com campos de status do fluxo
- [ ] Criar endpoint para funcionário submeter autoavaliação
- [ ] Criar endpoint para gestor submeter avaliação
- [ ] Criar endpoint para líder submeter consenso
- [ ] Implementar notificações por email em cada transição
- [ ] Criar interface de autoavaliação
- [ ] Criar interface de avaliação do gestor
- [ ] Criar interface de consenso do líder
- [ ] Habilitar/desabilitar botões conforme etapa
- [ ] Testar fluxo completo


## 📋 PDI Inteligente Completo - Modelo Nadia (Prioridade Máxima)
- [x] Criar schema de ações do PDI (pdiActions) com campos: título, descrição, eixo (70/20/10), métrica de sucesso, responsáveis, prazo, status (não iniciado/em andamento/concluído)
- [x] Criar schema de feedbacks/acompanhamento (pdiGovernanceReviews) com campos: data reunião, índice de prontidão (IPS 1-5), feedback textual, pontos-chave
- [x] Criar endpoint para adicionar ação ao PDI
- [x] Criar endpoint para atualizar status de ação
- [x] Criar endpoint para adicionar feedback de acompanhamento
- [x] Criar endpoint para buscar histórico de feedbacks
- [x] Criar endpoint para calcular evolução do IPS ao longo do tempo
- [x] Implementar página de visualização de PDI com tabela de ações editáveis (/pdi-inteligente/:id/detalhes)
- [x] Implementar formulário de adicionar/editar ações
- [x] Implementar seletor de status (não iniciado/em andamento/concluído) com cores
- [x] Implementar seção de acompanhamento DGC com formulário de feedback
- [x] Implementar gráfico de evolução do IPS (Chart.js)
- [x] Implementar histórico de reuniões de governança
- [ ] Implementar botões de salvar progresso e exportar JSON
- [ ] Testar fluxo completo de criação, edição e acompanhamento

## 🔄 Fluxo Completo de Avaliação 360° com Emails (Prioridade Alta)
- [x] Atualizar schema performanceEvaluations com campo workflowStatus (pending_self, pending_manager, pending_consensus, completed)
- [x] Adicionar campos de datas (selfCompletedAt, managerCompletedAt, consensusCompletedAt)
- [x] Criar endpoint evaluation360.submitSelfAssessment
- [x] Criar endpoint evaluation360.submitManagerAssessment
- [x] Criar endpoint evaluation360.submitConsensus
- [x] Integrar envio de email automático ao gestor quando autoavaliação é concluída
- [x] Integrar envio de email automático ao líder quando avaliação do gestor é concluída
- [ ] Criar página de autoavaliação (/avaliacoes/autoavaliacao/:id)
- [ ] Criar página de avaliação do gestor (/avaliacoes/gestor/:id)
- [ ] Criar página de consenso do líder (/avaliacoes/consenso/:id)
- [ ] Implementar lógica de habilitação/desabilitação de botões por etapa
- [ ] Adicionar validações de permissão (apenas gestor pode avaliar, apenas líder pode fazer consenso)
- [ ] Testar fluxo completo: autoavaliação → email → avaliação gestor → email → consenso

## 📊 Página de Benchmarking de Mercado (Prioridade Alta)
- [ ] Criar página /benchmarking com layout moderno
- [ ] Implementar endpoint benchmarking.getComparison para buscar dados UISA vs 21 perfis de mercado
- [ ] Criar gráfico radar comparando DISC médio UISA vs setor selecionado
- [ ] Criar gráfico radar comparando Big Five médio UISA vs setor selecionado
- [ ] Implementar filtros por setor (Agronegócio, Indústria, Tecnologia, Financeiro, etc)
- [ ] Implementar filtros por cargo (Gerente, Coordenador, Analista, etc)
- [ ] Adicionar análise automática de gaps competitivos (dimensões abaixo da média)
- [ ] Adicionar análise de vantagens organizacionais (dimensões acima da média)
- [ ] Implementar cards de insights estratégicos
- [ ] Adicionar botão de exportação de relatório de benchmarking em PDF
- [ ] Testar comparações com todos os 21 perfis de mercado

## 🌳 Sistema de Metas em Cascata Hierárquico (Prioridade Média)
- [ ] Criar schema de metas organizacionais (organizationalGoals)
- [ ] Criar schema de vinculação de metas (goalHierarchy) com parentGoalId
- [ ] Criar endpoint para criar meta organizacional
- [ ] Criar endpoint para desdobrar meta em metas departamentais
- [ ] Criar endpoint para desdobrar meta departamental em metas individuais
- [ ] Criar endpoint para buscar árvore hierárquica de metas
- [ ] Implementar página de metas em cascata (/metas/cascata)
- [ ] Implementar visualização em árvore (ReactFlow ou similar)
- [ ] Implementar cálculo automático de contribuição percentual de cada nível
- [ ] Implementar alertas quando meta superior é alterada
- [ ] Adicionar indicadores visuais de progresso agregado por nível
- [ ] Implementar propagação de mudanças de cima para baixo
- [ ] Testar fluxo completo: meta organizacional → departamental → individual


## 🐛 Correção Erro SelectItem Nine Box Comparativo
- [x] Corrigir SelectItem com value vazio na página /nine-box-comparativo
- [x] Substituir value="" por value="todos" e ajustar lógica do Select


## 🐛 Correção Filtros Nine Box Comparativo
- [x] Corrigir filtro de nível hierárquico que não está funcionando
- [x] Verificar endpoint getComparative e lógica de filtros
- [x] Substituir leftJoin problemático por SQL raw query
- [x] Implementar combinação correta de filtros (líder + hierarquia)
