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
