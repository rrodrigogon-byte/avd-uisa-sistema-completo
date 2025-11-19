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
