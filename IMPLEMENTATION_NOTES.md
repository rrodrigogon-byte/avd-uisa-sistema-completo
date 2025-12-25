# Notas de Implementação - Novas Funcionalidades AVD UISA

## Estado Atual do Sistema
- **Checkpoint Estável**: bd19884 (51090d60 após rollback)
- **URL de Desenvolvimento**: https://3000-ibzcal5n371w4j8lmrafq-b5559b3e.us2.manus.computer
- **Status**: ✅ Sistema completamente funcional

## Funcionalidades a Implementar

### 1. Fluxo de Aprovação de Descrições de Cargo
**Requisitos:**
- Ajustar botões de edição e exclusão nas páginas de descrições de cargo
- Criar fluxo de aprovação sequencial após alterações:
  1. Líder direto (para complemento e aprovação)
  2. Especialista de cargos e salários (aprovação/rejeição/complemento)
  3. Gerente de RH (aprovação/rejeição/complemento)
  4. Diretor Rodrigo Gonçalves (aprovação final)
- Envio de emails automáticos para cada aprovador
- Interface para aprovação/rejeição/complemento

**Tabelas Existentes:**
- `jobDescriptionApprovals` (linha 2431 do schema.ts) - já existe!
- Campos: id, jobDescriptionId, currentStep, status, approvers (JSON)

### 2. Exportação de Dados
**Requisitos:**
- Exportar relatórios e dados para Excel
- Exportar relatórios e dados para PDF
- Complementar sistema de importação existente

**Dependências a instalar:**
- xlsx (para Excel)
- jspdf / pdfmake (para PDF)

### 3. Organograma com Edição Inline
**Requisitos:**
- Permitir arrastar colaboradores para novos gestores
- Edição direta no organograma interativo
- Atualização automática da hierarquia no banco

**Página Existente:**
- `/organograma` - já implementada

### 4. Dashboard de Importações
**Requisitos:**
- Histórico de todas as importações realizadas
- Estatísticas (sucessos, erros, registros processados)
- Logs detalhados de erros
- Funcionalidade de reverter importações problemáticas

**Tabelas Criadas:**
- `importHistory` - registro de importações
- `importLogs` - logs detalhados

## Estratégia de Implementação

1. **Fase 1**: Implementar backend (routers tRPC) sem tocar no frontend
2. **Fase 2**: Criar páginas novas isoladas para testar
3. **Fase 3**: Integrar com sistema existente
4. **Fase 4**: Testar extensivamente antes de checkpoint

## Problemas Anteriores a Evitar

❌ **NÃO FAZER:**
- Modificar `server/_core/vite.ts` - causou problema de MIME type
- Criar duplicações no schema.ts
- Fazer mudanças grandes sem testar

✅ **FAZER:**
- Implementar incrementalmente
- Testar cada mudança
- Manter backup do código funcionando
