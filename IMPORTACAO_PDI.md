# Importação de PDI - Documentação Completa

## 📋 Visão Geral

A funcionalidade de **Importação de PDI** permite que gestores e administradores de RH importem múltiplos Planos de Desenvolvimento Individual (PDI) de uma só vez através de arquivos Excel ou CSV, agilizando significativamente o processo de cadastro e atualização de PDIs no sistema.

## ✨ Funcionalidades Implementadas

### 1. Upload de Arquivo
- **Drag and Drop**: Interface intuitiva para arrastar e soltar arquivos
- **Formatos Suportados**: XLSX, XLS e CSV
- **Validação de Tamanho**: Limite de 10MB por arquivo
- **Validação de Tipo**: Apenas arquivos de planilha são aceitos

### 2. Preview e Validação
- **Preview Automático**: Visualização dos primeiros 10 registros do arquivo
- **Validação em Tempo Real**: Verificação de erros antes da importação
- **Feedback Visual**: Erros destacados com mensagens claras
- **Estatísticas**: Total de registros, sucessos e erros

### 3. Processamento Inteligente
- **Parser Robusto**: Leitura de Excel e CSV com tratamento de erros
- **Validação de Dados**:
  - Campos obrigatórios
  - Formatos de data (DD/MM/AAAA ou AAAA-MM-DD)
  - Categorias válidas (70_pratica, 20_mentoria, 10_curso)
  - Status válidos (pendente, em_andamento, concluido, cancelado)
- **Busca Inteligente de Colaboradores**: Por matrícula, CPF ou email
- **Agrupamento Automático**: PDIs com múltiplas ações são agrupados corretamente
- **Atualização ou Criação**: Se já existe PDI para o colaborador/ciclo, atualiza; senão, cria novo

### 4. Histórico e Auditoria
- **Registro Completo**: Todas as importações são registradas
- **Detalhamento de Erros**: Cada erro é registrado com linha, campo e mensagem
- **Rastreabilidade**: Quem importou, quando e qual arquivo foi usado
- **Status da Importação**: Processando, Concluído, Erro ou Parcial

### 5. Template de Exemplo
- **Download Automático**: Template pré-configurado com exemplos
- **Campos Documentados**: Cada coluna com exemplo de preenchimento
- **Múltiplas Ações**: Exemplo de PDI com várias ações de desenvolvimento

## 📁 Estrutura do Arquivo de Importação

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `nome_colaborador` | Texto | Nome completo do colaborador | João da Silva |
| `ciclo` | Texto | Nome do ciclo de avaliação | 2025 |
| `data_inicio` | Data | Data de início do PDI | 01/01/2025 |
| `data_fim` | Data | Data de término do PDI | 31/12/2025 |
| `competencia` | Texto | Nome da competência a desenvolver | Liderança |
| `acao_desenvolvimento` | Texto | Título da ação de desenvolvimento | Participar de treinamento de liderança |
| `categoria` | Enum | Categoria 70-20-10 | 70_pratica, 20_mentoria ou 10_curso |
| `data_inicio_acao` | Data | Data de início da ação | 01/02/2025 |
| `data_fim_acao` | Data | Data de término da ação | 28/02/2025 |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `matricula` | Texto | Matrícula do colaborador | 12345 |
| `cpf` | Texto | CPF do colaborador | 123.456.789-00 |
| `email` | Email | Email do colaborador | colaborador@empresa.com |
| `cargo_alvo` | Texto | Cargo almejado | Gerente de Projetos |
| `tipo_acao` | Texto | Tipo específico da ação | curso_online, projeto, job_rotation |
| `descricao_acao` | Texto | Descrição detalhada da ação | Curso de Liderança Estratégica - 40h |
| `responsavel` | Texto | Responsável pela ação | RH, Gestor Direto |
| `status` | Enum | Status da ação | pendente, em_andamento, concluido, cancelado |

### Observações Importantes

1. **Identificação do Colaborador**: Pelo menos um dos campos (matrícula, CPF ou email) deve ser preenchido
2. **Múltiplas Ações**: Um mesmo PDI pode ter várias linhas (uma para cada ação de desenvolvimento)
3. **Agrupamento**: Linhas com mesmo colaborador e ciclo são agrupadas no mesmo PDI
4. **Formatos de Data**: Aceita DD/MM/AAAA ou AAAA-MM-DD
5. **Categorias 70-20-10**:
   - `70_pratica`: Aprendizado prático (70% do desenvolvimento)
   - `20_mentoria`: Aprendizado com outros (20% do desenvolvimento)
   - `10_curso`: Aprendizado formal (10% do desenvolvimento)

## 🔄 Fluxo de Importação

```
1. Usuário acessa /pdi/import
   ↓
2. Faz download do template (opcional)
   ↓
3. Preenche o arquivo com os dados
   ↓
4. Faz upload do arquivo (drag-and-drop ou seleção)
   ↓
5. Sistema valida e gera preview
   ↓
6. Usuário revisa erros (se houver)
   ↓
7. Usuário confirma importação
   ↓
8. Sistema processa e cria/atualiza PDIs
   ↓
9. Resultado exibido com estatísticas
   ↓
10. Histórico registrado em /pdi/import/history
```

## 🛠️ Arquitetura Técnica

### Backend

#### Serviço de Importação (`server/services/pdiImportService.ts`)
- **PDIImportParser**: Classe principal com métodos estáticos
  - `parseFile()`: Lê arquivo Excel/CSV e converte para array de objetos
  - `validateData()`: Valida estrutura e dados do arquivo
  - `parseDate()`: Converte strings de data para Date
  - `findEmployeeId()`: Busca colaborador por matrícula/CPF/email
  - `findCycleId()`: Busca ciclo por nome
  - `findCompetencyId()`: Busca competência por nome
  - `processImport()`: Processa importação completa com transações
  - `generateTemplate()`: Gera arquivo template de exemplo

#### Procedures tRPC (`server/routers.ts`)
- `pdi.uploadImportFile`: Upload e processamento do arquivo
- `pdi.previewImport`: Preview e validação sem salvar
- `pdi.downloadTemplate`: Download do template de exemplo
- `pdi.listImportHistory`: Listagem do histórico de importações
- `pdi.getImportDetails`: Detalhes de uma importação específica

#### Schema do Banco (`drizzle/schema.ts`)
- **pdiImportHistory**: Tabela de histórico de importações
  - Informações do arquivo (nome, tamanho, tipo)
  - Status da importação (processando, concluído, erro, parcial)
  - Estatísticas (total, sucessos, erros)
  - Detalhes de erros (JSON com linha, campo, mensagem)
  - Auditoria (quem importou, quando)

### Frontend

#### Páginas
- **PDIImport** (`client/src/pages/PDIImport.tsx`)
  - Interface de upload com drag-and-drop
  - Preview de dados com tabela
  - Validação visual de erros
  - Feedback de progresso
  - Resultado da importação

- **PDIImportHistory** (`client/src/pages/PDIImportHistory.tsx`)
  - Listagem de todas as importações
  - Detalhes de cada importação
  - Visualização de erros

#### Rotas
- `/pdi/import`: Página de importação
- `/pdi/import/history`: Histórico de importações

## 📊 Validações Implementadas

### 1. Validações de Arquivo
- ✅ Tipo de arquivo (XLSX, XLS, CSV)
- ✅ Tamanho máximo (10MB)
- ✅ Estrutura do arquivo (colunas esperadas)

### 2. Validações de Dados
- ✅ Campos obrigatórios preenchidos
- ✅ Formatos de data válidos
- ✅ Categorias válidas (70_pratica, 20_mentoria, 10_curso)
- ✅ Status válidos (pendente, em_andamento, concluido, cancelado)
- ✅ Colaborador existe no sistema
- ✅ Ciclo existe no sistema
- ✅ Competência existe no sistema

### 3. Regras de Negócio
- ✅ Agrupamento de ações por PDI (mesmo colaborador + ciclo)
- ✅ Atualização de PDI existente ou criação de novo
- ✅ Transação atômica (tudo ou nada por PDI)
- ✅ Rollback em caso de erro
- ✅ Logging detalhado de todas as operações

## 🎯 Próximos Passos Sugeridos

### Melhorias de Curto Prazo
1. **Validação de Competências**: Criar competências automaticamente se não existirem
2. **Importação Assíncrona**: Para arquivos muito grandes (>1000 registros)
3. **Notificações**: Enviar email quando importação for concluída
4. **Exportação**: Permitir exportar PDIs existentes no mesmo formato

### Melhorias de Médio Prazo
1. **Mapeamento de Colunas**: Permitir usuário mapear colunas do arquivo
2. **Validação Avançada**: Regras customizáveis de validação
3. **Importação Incremental**: Atualizar apenas campos específicos
4. **Versionamento**: Manter histórico de versões dos PDIs

### Melhorias de Longo Prazo
1. **Integração com APIs**: Importar de sistemas externos
2. **IA para Validação**: Sugestões inteligentes de correção
3. **Importação em Tempo Real**: Sincronização automática
4. **Dashboard de Importações**: Métricas e analytics

## 🐛 Troubleshooting

### Erro: "Colaborador não encontrado"
- **Causa**: Matrícula, CPF ou email não correspondem a nenhum colaborador cadastrado
- **Solução**: Verificar se o colaborador está cadastrado no sistema ou corrigir os dados no arquivo

### Erro: "Ciclo não encontrado"
- **Causa**: Nome do ciclo não corresponde a nenhum ciclo cadastrado
- **Solução**: Verificar nome exato do ciclo no sistema (case-sensitive)

### Erro: "Competência não encontrada"
- **Causa**: Nome da competência não corresponde a nenhuma competência cadastrada
- **Solução**: Cadastrar a competência primeiro ou corrigir o nome no arquivo

### Erro: "Data inválida"
- **Causa**: Formato de data não reconhecido
- **Solução**: Usar formato DD/MM/AAAA ou AAAA-MM-DD

### Erro: "Categoria inválida"
- **Causa**: Categoria não é uma das opções válidas
- **Solução**: Usar exatamente: 70_pratica, 20_mentoria ou 10_curso

## 📞 Suporte

Para dúvidas ou problemas com a importação de PDI:
1. Consulte esta documentação
2. Verifique o histórico de importações para detalhes de erros
3. Entre em contato com o suporte técnico

---

**Versão**: 1.0.0  
**Data**: 10/12/2024  
**Autor**: Sistema AVD UISA
