## 🔴 CORREÇÕES URGENTES - 23/11/2024 17:00

### Erros Críticos Reportados
- [x] Corrigir erro NaN no pdiPlanId ao salvar meta em /metas/criar
- [x] Corrigir seletor de funcionários vazio no modal de incluir sucessor (já estava funcionando)

### Novas Funcionalidades Solicitadas
- [x] Implementar contador real de metas por ciclo (endpoint countByCycle criado)
- [x] Criar dashboard de acompanhamento de metas por ciclo (DashboardMetasCiclos)
- [ ] Adicionar workflow de aprovação de metas pelos gestores
- [ ] Implementar notificações automáticas quando ciclo for aprovado
- [ ] Criar relatórios consolidados de PDI (evolução gaps, 70-20-10, riscos)

---

## ✅ CORREÇÕES CRÍTICAS - 23/11/2024 16:15 (CONCLUÍDAS)

### Problemas Urgentes Reportados pelo Usuário
- [x] Corrigir seletor de funcionários no modal "Incluir Sucessor" (já estava funcionando corretamente)
- [x] Corrigir erro TypeError na página de perfil do funcionário (/funcionarios/:id) - "Cannot read properties of undefined (reading 'name')"
- [x] Ajustar validação de descrição de meta (reduzir mínimo de 50 para 20 caracteres)
- [x] Implementar sistema de aprovação de ciclos 360° com preenchimento de metas pelos funcionários

---

## 🔥 NOVAS CORREÇÕES URGENTES - 23/11/2024 16:00

### Erros 404 de Aprovações
- [x] Criar página /aprovacoes/pdi (PDIs Pendentes)
- [x] Criar página /aprovacoes/avaliacoes (Avaliações Pendentes)
- [x] Corrigir página /aprovacoes/workflows (botões não funcionam)

### Correção de Workflows
- [x] Corrigir erro de validação ao criar workflow (type não aceita valores válidos)
- [x] Implementar botão "Configurar Workflow" em cada card
- [x] Corrigir botões de ação nos cards de workflow

### Melhorias de Backend
- [x] Padronizar enum status: "em_andamento" → "ativo" no schema evaluationCycles
- [x] Criar job automático para calcular selfScore e managerScore
- [x] Adicionar validação de datas em metas (startDate < endDate, não sobrepor ciclos)

---

## 🔥 CORREÇÕES URGENTES - 23/11/2024 15:40

### Erros 404 de Navegação
- [x] Corrigir rota 404 ao criar PDI em funcionário (/avaliacoes/criar)
- [x] Corrigir rota 404 ao enviar teste psicométrico (/testes-psicometricos/enviar)

### Problemas de Funcionalidade - Metas
- [x] Adicionar botão "Salvar" na página de criar metas
- [x] Adicionar botão "Editar" na página de criar metas (N/A - página de criação)
- [x] Corrigir botão "Validar Meta SMART" (endpoint corrigido)

### Melhorias de Backend
- [x] Simplificar retorno de getEmployeeById (estrutura flat)
- [x] Adicionar campos selfScore e managerScore no schema e banco
- [x] Criar interfaces TypeScript centralizadas (shared/interfaces.ts)
- [x] Criar type helpers para callbacks .map() e .filter()

### Testes e Validação
- [x] Executar testes vitest: admin.getEmailStats (falha por tabela ausente)
- [x] Executar testes vitest: employees.getById (funciona, erro 404 correto)
- [x] Executar testes vitest: cycles.* (cycles.list funciona)
- [x] Validar que correções não quebraram funcionalidades existentes


### Correção 1 - Validação de Meta (CONCLUÍDA)
- [x] Reduzir validação de descrição de meta de 50 para 20 caracteres
- [x] Ajustar validação SMART em validateSMART
- [x] Ajustar validação SMART em createSMART


### Correção 2 - Erro na Página de Perfil (CONCLUÍDA)
- [x] Corrigir função getEmployeeById para retornar estrutura aninhada {employee, department, position}
- [x] Resolver erro "Cannot read properties of undefined (reading 'name')"


### Correção 3 - Sistema de Aprovação de Ciclos 360° (CONCLUÍDA)
- [x] Adicionar campos approvedForGoals, approvedForGoalsAt, approvedForGoalsBy no schema evaluationCycles
- [x] Aplicar mudanças no banco de dados
- [x] Criar endpoint cycles.approveForGoals
- [x] Criar endpoint cycles.isApprovedForGoals
- [x] Adicionar componente ApproveCycleButton na página Avaliacao360Enhanced
- [x] Integrar botão de aprovação nos cards de avaliação

## 🎯 NOVAS MELHORIAS - 23/11/2024 16:30

### PDI Inteligente - Melhorias de Usabilidade
- [x] Permitir inserção de dados diretamente na página de detalhes do PDI
- [x] Identificar profissionais sempre pelo nome (não por código)
- [x] Pacto de Desenvolvimento: permitir editar e selecionar pessoas (sponsors, mentores, guardiões)
- [x] Matriz de Gaps: permitir construir e editar gaps de competências
- [x] Gerar sugestão automática de plano 70-20-10 e permitir alterações
- [x] Riscos: trazer principais riscos e permitir inclusão/edição de novos

### Sistema de Metas Vinculadas a Ciclos
- [x] Criar página de criação de metas vinculadas ao ciclo aprovado
- [x] Permitir que funcionários criem metas assim que ciclo for aprovado
- [x] Implementar notificações automáticas quando ciclo for aprovado
- [x] Criar dashboard de acompanhamento de aprovações de ciclos
- [x] Visualizar quais ciclos estão aprovados e quantos funcionários preencheram metas

## ✅ PROBLEMAS URGENTES CORRIGIDOS - 23/11/2024 18:00

### PDI Inteligente - Problemas Críticos
- [x] Corrigir Pacto de Desenvolvimento mostrando "Colaborador ID: 90908" ao invés do nome
- [x] Adicionar botões de edição no Pacto de Desenvolvimento para selecionar pessoas
- [x] Implementar funcionalidade de adicionar/editar gaps na Matriz de Gaps (corrigido acesso aos dados)

### Validação de Metas
- [x] Reduzir validação mínima de título de meta de 10 para 5 caracteres

### Aprovação de Ciclos
- [x] Adicionar interface clara para aprovar ciclos 360° (botão "Aprovar para Metas" em ciclos concluídos)
- [x] Documentar onde e como aprovar ciclos para preenchimento de metas (botão na página /ciclos-avaliacao)
