# Roadmap - Novas Funcionalidades AVD UISA

## 📋 Status Atual do Sistema

✅ **Sistema 100% Funcional e Operacional**

O Sistema AVD UISA está completamente implementado e funcionando perfeitamente com todas as funcionalidades principais:

- ✅ Dashboard principal e executivo com métricas em tempo real
- ✅ Gestão completa de funcionários e hierarquia organizacional
- ✅ Importação massiva de dados via Excel
- ✅ Organograma interativo com visualização hierárquica
- ✅ Sistema completo de metas (individuais, corporativas, cascata)
- ✅ Avaliações 360° Enhanced
- ✅ PDI (Plano de Desenvolvimento Individual)
- ✅ Calibração e Nine Box para gestão de talentos
- ✅ Processo AVD completo em 5 passos
- ✅ Sistema de notificações e lembretes automáticos
- ✅ Gestão de usuários e permissões

**Checkpoint Estável Atual**: `bd19884` (version: `51090d60`)  
**URL de Acesso**: https://3000-ibzcal5n371w4j8lmrafq-b5559b3e.us2.manus.computer

---

## 🆕 Funcionalidades Solicitadas para Implementação

### 1. 📝 Fluxo de Aprovação de Descrições de Cargo

**Objetivo**: Implementar fluxo de aprovação sequencial para alterações em descrições de cargo, com envio automático de emails para cada aprovador.

**Requisitos Detalhados**:

1. **Ajustes na Interface de Descrições de Cargo**
   - Adicionar botões de "Editar" e "Excluir" nas páginas:
     - `/descricoes-cargo` - Descrições de Cargo gerais
     - `/descricoes-cargo-uisa` - Descrições de Cargo UISA
   - Implementar modal de confirmação para exclusões
   - Criar formulário de edição com validação

2. **Fluxo de Aprovação Sequencial** (4 níveis)
   
   **Nível 1: Líder Direto**
   - Recebe notificação por email quando descrição é alterada
   - Pode: Aprovar, Rejeitar ou Complementar
   - Se aprovar → avança para Nível 2
   - Se rejeitar → processo encerrado
   - Se complementar → adiciona informações e aprova automaticamente

   **Nível 2: Especialista de Cargos e Salários**
   - Recebe notificação após aprovação do Nível 1
   - Pode: Aprovar, Rejeitar ou Complementar
   - Se aprovar → avança para Nível 3
   - Se rejeitar → processo encerrado

   **Nível 3: Gerente de RH**
   - Recebe notificação após aprovação do Nível 2
   - Pode: Aprovar, Rejeitar ou Complementar
   - Se aprovar → avança para Nível 4
   - Se rejeitar → processo encerrado

   **Nível 4: Diretor Rodrigo Gonçalves**
   - Recebe notificação após aprovação do Nível 3
   - Pode: Aprovar ou Rejeitar (aprovação final)
   - Se aprovar → descrição oficialmente atualizada
   - Se rejeitar → processo encerrado

3. **Sistema de Emails Automáticos**
   - Template profissional com informações da alteração
   - Link direto para página de aprovação
   - Resumo das mudanças realizadas
   - Botões de ação (Aprovar/Rejeitar/Complementar)

4. **Interface de Aprovação**
   - Página dedicada para revisar alterações
   - Comparação lado a lado (antes vs depois)
   - Campo para comentários do aprovador
   - Histórico de aprovações anteriores

**Estrutura Técnica**:

```typescript
// Tabela já existente no banco de dados (schema.ts linha 2431)
jobDescriptionApprovals {
  id: int
  jobDescriptionId: int
  
  // Nível 1: Líder Imediato
  level1ApproverId: int
  level1Status: "pending" | "approved" | "rejected"
  level1Comments: text
  level1ApprovedAt: datetime
  
  // Nível 2: Especialista
  level2ApproverId: int
  level2Status: "pending" | "approved" | "rejected"
  level2Comments: text
  level2ApprovedAt: datetime
  
  // Nível 3: Gerente RH
  level3ApproverId: int
  level3Status: "pending" | "approved" | "rejected"
  level3Comments: text
  level3ApprovedAt: datetime
  
  // Nível 4: Diretor
  level4ApproverId: int
  level4Status: "pending" | "approved" | "rejected"
  level4Comments: text
  level4ApprovedAt: datetime
  
  currentLevel: int (1-4)
  overallStatus: "pending" | "approved" | "rejected"
}
```

**Arquivos a Criar/Modificar**:
- `server/routers/jobDescriptionApprovalRouter.ts` - Router tRPC para aprovações
- `server/approvalEmailHelper.ts` - Helper para envio de emails
- `client/src/pages/AprovacaoDescricaoCargo.tsx` - Página de aprovação
- `client/src/pages/DescricoesCargo.tsx` - Adicionar botões de edição
- `client/src/pages/DescricoesCargoUISA.tsx` - Adicionar botões de edição

**Estimativa**: 8-12 horas de desenvolvimento

---

### 2. 📊 Exportação de Dados (Excel e PDF)

**Objetivo**: Permitir exportação de relatórios e dados do sistema para Excel e PDF, complementando o sistema de importação existente.

**Requisitos Detalhados**:

1. **Exportação para Excel**
   - Relatório de funcionários com todos os dados
   - Relatório de metas por período
   - Relatório de avaliações consolidadas
   - Relatório de PDIs ativos
   - Relatório de calibração e Nine Box
   - Formatação profissional com cabeçalhos e estilos

2. **Exportação para PDF**
   - Relatório individual de colaborador (ficha completa)
   - Relatório de avaliação 360° com gráficos
   - Relatório de PDI com plano de ação
   - Relatório consolidado de departamento
   - Layout profissional com logo e formatação

3. **Interface de Exportação**
   - Botão "Exportar" em cada página relevante
   - Modal com opções de formato (Excel/PDF)
   - Seleção de dados a incluir
   - Preview antes de exportar
   - Download automático do arquivo

**Bibliotecas Necessárias** (já instaladas):
- `xlsx` - Para geração de arquivos Excel
- `jspdf` - Para geração de PDFs
- `jspdf-autotable` - Para tabelas em PDF

**Arquivos a Criar**:
- `server/routers/exportRouter.ts` - Router tRPC para exportações
- `server/exportHelpers/excelExport.ts` - Helper para Excel
- `server/exportHelpers/pdfExport.ts` - Helper para PDF
- `client/src/components/ExportButton.tsx` - Componente de botão de exportação
- `client/src/components/ExportModal.tsx` - Modal de opções de exportação

**Estimativa**: 6-8 horas de desenvolvimento

---

### 3. 🌳 Organograma com Edição Inline (Drag-and-Drop)

**Objetivo**: Permitir que administradores editem a hierarquia organizacional diretamente no organograma interativo, arrastando colaboradores para novos gestores.

**Requisitos Detalhados**:

1. **Funcionalidade Drag-and-Drop**
   - Arrastar card de colaborador para novo gestor
   - Visualização em tempo real da mudança
   - Confirmação antes de salvar
   - Validação de hierarquia (não permitir loops)

2. **Edição Inline**
   - Clicar em colaborador para editar dados básicos
   - Alterar cargo, departamento, gestor
   - Salvar alterações instantaneamente
   - Feedback visual de sucesso/erro

3. **Validações**
   - Não permitir que colaborador seja gestor de si mesmo
   - Não permitir loops na hierarquia (A → B → C → A)
   - Validar permissões do usuário
   - Confirmar mudanças que afetam múltiplos colaboradores

4. **Histórico de Mudanças**
   - Registrar todas as alterações de hierarquia
   - Mostrar quem fez a mudança e quando
   - Permitir reverter mudanças recentes
   - Auditoria completa de reorganizações

**Bibliotecas Necessárias**:
- `@dnd-kit/core` - Para drag-and-drop
- `@dnd-kit/sortable` - Para ordenação
- `@dnd-kit/utilities` - Utilitários

**Arquivos a Criar/Modificar**:
- `client/src/components/OrgChartInteractive.tsx` - Adicionar drag-and-drop
- `server/routers/orgChartRouter.ts` - Adicionar procedures de edição
- `server/db.ts` - Adicionar funções de validação de hierarquia
- `drizzle/schema.ts` - Adicionar tabela de histórico de mudanças

**Estimativa**: 10-14 horas de desenvolvimento

---

### 4. 📈 Dashboard de Histórico de Importações

**Objetivo**: Criar dashboard completo para gerenciar importações de dados, com histórico, logs de erros e possibilidade de reverter importações problemáticas.

**Requisitos Detalhados**:

1. **Histórico de Importações**
   - Lista de todas as importações realizadas
   - Data/hora, usuário responsável, tipo de importação
   - Estatísticas: total de registros, sucessos, erros
   - Status: concluída, com erros, revertida
   - Filtros por data, tipo, status, usuário

2. **Logs Detalhados**
   - Log de cada linha processada
   - Detalhes de erros encontrados
   - Warnings e avisos
   - Dados que foram alterados
   - Exportação de logs para análise

3. **Visualização de Estatísticas**
   - Gráfico de importações por período
   - Taxa de sucesso vs erro
   - Tipos de erros mais comuns
   - Tempo médio de processamento
   - Volume de dados importados

4. **Reversão de Importações**
   - Botão "Reverter" para cada importação
   - Preview das mudanças que serão revertidas
   - Confirmação com senha do administrador
   - Backup automático antes de reverter
   - Log de reversões realizadas

5. **Validação Prévia**
   - Análise do arquivo antes de importar
   - Relatório de problemas potenciais
   - Sugestões de correção
   - Opção de importar apenas linhas válidas

**Estrutura Técnica**:

```typescript
// Tabelas já criadas no banco de dados
importHistory {
  id: int
  userId: int
  fileName: string
  fileType: "employees" | "goals" | "evaluations"
  totalRecords: int
  successCount: int
  errorCount: int
  status: "completed" | "with_errors" | "reverted"
  startedAt: datetime
  completedAt: datetime
}

importLogs {
  id: int
  importHistoryId: int
  lineNumber: int
  level: "info" | "warning" | "error"
  message: text
  data: json
  createdAt: datetime
}
```

**Arquivos a Criar**:
- `client/src/pages/DashboardImportacoes.tsx` - Página principal
- `server/routers/importHistoryRouter.ts` - Router tRPC
- `server/importHelpers/revertImport.ts` - Helper para reversão
- `server/importHelpers/validateImport.ts` - Helper para validação prévia

**Estimativa**: 12-16 horas de desenvolvimento

---

## 📅 Cronograma Sugerido de Implementação

### Sprint 1 (1 semana)
- ✅ Instalação de bibliotecas necessárias
- 🔄 Implementação do Fluxo de Aprovação de Descrições de Cargo (Funcionalidade 1)
  - Criar router tRPC e helpers de email
  - Implementar páginas de aprovação
  - Adicionar botões de edição nas páginas existentes
  - Testes completos do fluxo

### Sprint 2 (1 semana)
- 🔄 Implementação de Exportação de Dados (Funcionalidade 2)
  - Criar helpers de exportação Excel e PDF
  - Implementar componentes de interface
  - Adicionar botões de exportação nas páginas
  - Testes de exportação com dados reais

### Sprint 3 (1 semana)
- 🔄 Implementação de Organograma com Drag-and-Drop (Funcionalidade 3)
  - Instalar e configurar biblioteca de drag-and-drop
  - Implementar funcionalidade no organograma
  - Adicionar validações de hierarquia
  - Criar histórico de mudanças
  - Testes extensivos de usabilidade

### Sprint 4 (1 semana)
- 🔄 Implementação de Dashboard de Importações (Funcionalidade 4)
  - Criar página de dashboard
  - Implementar visualizações e gráficos
  - Adicionar funcionalidade de reversão
  - Implementar validação prévia de arquivos
  - Testes de reversão e validação

### Sprint 5 (3-5 dias)
- 🔄 Testes Integrados e Ajustes Finais
  - Testes end-to-end de todas as funcionalidades
  - Correção de bugs encontrados
  - Otimização de performance
  - Documentação final
  - Criação de checkpoint estável

---

## 🎯 Próximos Passos Imediatos

1. **Validar Requisitos** - Confirmar com stakeholders se os requisitos estão completos e corretos
2. **Priorizar Funcionalidades** - Definir ordem de implementação baseada em urgência/impacto
3. **Alocar Recursos** - Definir quem será responsável por cada funcionalidade
4. **Iniciar Sprint 1** - Começar implementação do Fluxo de Aprovação

---

## 📝 Notas Importantes

### Considerações Técnicas

1. **Manter Sistema Estável**
   - Todas as implementações devem ser feitas em branches separadas
   - Testes extensivos antes de merge para main
   - Checkpoints frequentes para facilitar rollback se necessário

2. **Performance**
   - Exportações grandes devem ser processadas em background
   - Drag-and-drop deve ser otimizado para hierarquias grandes
   - Dashboard de importações deve usar paginação

3. **Segurança**
   - Validar permissões em todas as operações
   - Logs de auditoria para ações sensíveis
   - Confirmação dupla para operações irreversíveis

4. **UX/UI**
   - Manter consistência com design atual
   - Feedback visual claro para todas as ações
   - Loading states apropriados
   - Mensagens de erro amigáveis

### Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Quebrar funcionalidades existentes | Alto | Médio | Testes extensivos, checkpoints frequentes |
| Performance degradada com dados grandes | Médio | Médio | Otimização, paginação, processamento assíncrono |
| Complexidade do drag-and-drop | Médio | Alto | Usar biblioteca testada, validações robustas |
| Problemas com reversão de importações | Alto | Baixo | Backups automáticos, validações antes de reverter |

---

## 📞 Contato e Suporte

Para dúvidas ou esclarecimentos sobre este roadmap:
- Revisar documentação técnica em `/IMPLEMENTATION_NOTES.md`
- Consultar TODO list em `/todo.md`
- Verificar schema do banco em `/drizzle/schema.ts`

---

**Última Atualização**: 25 de Dezembro de 2025  
**Versão do Sistema**: bd19884 (51090d60)  
**Status**: Sistema 100% funcional, pronto para novas implementações
