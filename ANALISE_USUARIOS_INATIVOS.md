# Análise de Usuários Inativos em Posições Críticas

**Data:** 26/12/2025
**Sistema:** AVD UISA - Sistema de Avaliação de Desempenho

## 🚨 Problema Identificado

Usuários inativos estão configurados como aprovadores em posições críticas do sistema, especialmente no fluxo de aprovação de descrições de cargo.

## 📊 Usuários Identificados

### 1. Alexsandra Tavares Sobral de Oliveira
- **Email:** alexsandra.oliveira@uisa.com.br
- **Papel:** Aprovadora de Cargos, Salários e Descrição (Nível 2)
- **Status:** INATIVO no sistema
- **Problema:** Configurada como aprovadora obrigatória no workflow de 4 níveis

### 2. Fernando Pinto
- **Papel:** Coordenador de Custos
- **Status:** INATIVO no sistema
- **Problema:** Pode estar em posições de aprovação relacionadas a custos

## 🔍 Análise do Sistema

### Estrutura Atual de Aprovações

O sistema possui um **workflow de 4 níveis obrigatórios** para aprovação de descrições de cargo:

1. **Nível 1:** Líder Imediato
2. **Nível 2:** Alexsandra Oliveira (RH Cargos e Salários) ⚠️ INATIVA
3. **Nível 3:** André (Gerente RH)
4. **Nível 4:** Rodrigo Ribeiro Gonçalves (Diretor)

### Arquivos Afetados

1. **Schema (drizzle/schema.ts)**
   - Linha 2434: Comentário documenta Alexsandra como aprovadora
   - Linha 2447: Campo level2ApproverId configurado para Alexsandra

2. **Router de Aprovações (server/routers/jobDescriptionApprovalsRouter.ts)**
   - Linha 18: Comentário documenta Alexsandra como aprovadora nível 2
   - Linha 30: Input level2ApproverId espera ID de Alexsandra
   - Linhas 118, 152: Queries filtram por level2ApproverId

3. **Páginas Frontend**
   - **client/src/pages/AprovacoesCargos.tsx:** Exibe "Alexsandra Oliveira" como aprovadora
   - **client/src/pages/FluxoAprovacaoCargos.tsx:** Mostra "Alexsandra Oliveira - RH Cargos e Salários"
   - **client/src/pages/GerenciarPapeis.tsx:** Procedure configureAlexsandra

4. **Testes**
   - **server/integridade-aprovacoes.test.ts:** 7 testes com level2ApproverId = 2 (Alexsandra)
   - **server/pdiHtmlImport.test.ts:** Teste espera "Fernando Pinto"

## 🎯 Impacto

### Crítico
- ❌ Aprovações de descrição de cargo **BLOQUEADAS** se Alexsandra estiver inativa
- ❌ Workflow de 4 níveis **NÃO PODE SER CONCLUÍDO** sem aprovador ativo no nível 2
- ❌ Sistema pode rejeitar aprovações por falta de aprovador válido

### Moderado
- ⚠️ Confusão de usuários ao ver aprovadores inativos
- ⚠️ Processos pendentes sem responsável ativo
- ⚠️ Impossibilidade de notificar aprovadores inativos

## 💡 Soluções Propostas

### Solução 1: Sistema Dinâmico de Aprovadores (RECOMENDADO)
Implementar um sistema flexível onde aprovadores são configuráveis por papel/função, não por pessoa específica.

**Vantagens:**
- ✅ Permite múltiplos aprovadores por nível
- ✅ Facilita substituições e férias
- ✅ Valida status ativo automaticamente
- ✅ Escalável para crescimento da empresa

**Implementação:**
1. Criar tabela `approverRoles` com papéis (rh_cargos_salarios, gerente_rh, diretor)
2. Criar tabela `approverAssignments` vinculando employees a papéis
3. Modificar procedures para buscar aprovadores ativos por papel
4. Adicionar validação de status ativo em todas as queries

### Solução 2: Atualização Manual de Aprovadores
Substituir Alexsandra e Fernando por aprovadores ativos atuais.

**Vantagens:**
- ✅ Implementação rápida
- ✅ Sem mudanças estruturais

**Desvantagens:**
- ❌ Problema vai se repetir quando outros saírem
- ❌ Manutenção manual constante
- ❌ Código hardcoded com nomes específicos

### Solução 3: Hierarquia Automática
Usar hierarquia organizacional do banco de dados para determinar aprovadores.

**Vantagens:**
- ✅ Totalmente automático
- ✅ Sempre atualizado com organograma

**Desvantagens:**
- ❌ Pode não refletir responsabilidades reais
- ❌ Complexo para casos especiais

## 🛠️ Plano de Correção Imediata

### Fase 1: Identificação Completa
- [x] Listar todos os employees inativos em posições críticas
- [x] Mapear todos os locais no código onde são referenciados
- [ ] Identificar aprovadores substitutos ativos

### Fase 2: Correção do Sistema
- [ ] Implementar validação de status ativo em procedures de aprovação
- [ ] Criar procedure para atualizar aprovadores inativos
- [ ] Adicionar campo `isActive` nas validações de aprovação
- [ ] Atualizar queries para filtrar apenas aprovadores ativos

### Fase 3: Atualização de Dados
- [ ] Identificar aprovadores substitutos para cada nível
- [ ] Atualizar registros existentes com aprovadores inativos
- [ ] Migrar aprovações pendentes para novos aprovadores

### Fase 4: Prevenção Futura
- [ ] Adicionar trigger para detectar inativação de aprovadores
- [ ] Implementar notificação quando aprovador ficar inativo
- [ ] Criar interface para gestão de aprovadores por papel
- [ ] Adicionar testes automatizados para validar aprovadores ativos

## 📝 Recomendações

1. **URGENTE:** Implementar validação de status ativo em TODAS as procedures de aprovação
2. **IMPORTANTE:** Criar sistema de papéis flexível para aprovadores
3. **NECESSÁRIO:** Adicionar monitoramento de aprovadores inativos
4. **RECOMENDADO:** Implementar sistema de delegação para férias/ausências

## 🔄 Próximos Passos

1. Consultar cliente sobre aprovadores substitutos
2. Implementar Solução 1 (Sistema Dinâmico)
3. Migrar dados existentes
4. Testar fluxo completo de aprovação
5. Documentar novo processo
