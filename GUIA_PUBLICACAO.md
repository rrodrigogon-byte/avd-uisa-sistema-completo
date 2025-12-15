# Guia Rápido de Publicação - Sistema AVD UISA

## 🚀 Passo a Passo para Publicar

### 1. Criar Checkpoint

Antes de publicar, você precisa criar um checkpoint do sistema:

1. Acesse a interface de gerenciamento do Manus
2. Aguarde alguns instantes para o sistema processar
3. Um card de checkpoint aparecerá na interface

**Nota:** Se houver problemas ao criar o checkpoint, aguarde alguns minutos e tente novamente. O servidor pode estar processando outras operações.

### 2. Publicar o Sistema

Após criar o checkpoint com sucesso:

1. Clique no botão **"Publish"** no canto superior direito da interface de gerenciamento
2. Aguarde o processo de deploy completar (geralmente 2-5 minutos)
3. Você receberá uma URL pública para acessar o sistema

### 3. Configurações Pós-Publicação

Após publicar, configure os seguintes itens:

#### 3.1 Configurar SMTP (Obrigatório para emails)

1. Acesse o sistema publicado
2. Faça login como administrador
3. Vá em **Configurações > SMTP**
4. Preencha:
   - **Host:** servidor SMTP (ex: smtp.gmail.com)
   - **Porta:** 587 (TLS) ou 465 (SSL)
   - **Usuário:** seu email
   - **Senha:** senha do email ou senha de aplicativo
   - **Secure:** Ative se usar porta 465

5. Clique em **"Testar Configuração"** para validar
6. Salve as configurações

#### 3.2 Importar Dados Iniciais

**Departamentos:**
1. Acesse **Admin > Departamentos**
2. Crie os departamentos da sua organização

**Cargos:**
1. Acesse **Admin > Cargos**
2. Cadastre os cargos existentes

**Centros de Custo:**
1. Acesse **Admin > Centros de Custo**
2. Configure os centros de custo

**Funcionários:**
1. Acesse **Admin > Funcionários**
2. Importe via Excel/CSV ou cadastre manualmente
3. Associe cada funcionário a: departamento, cargo, gestor

#### 3.3 Configurar Workflows

**Workflow de Metas:**
1. Acesse **Aprovações > Workflows**
2. Crie workflow "Aprovação de Metas"
3. Defina etapas: Gestor → Diretor → RH
4. Configure aprovadores por departamento

**Workflow de Bônus:**
1. Acesse **Bônus > Configuração de Workflows**
2. Defina regras de cálculo
3. Configure aprovadores

**Workflow de Descrição de Cargos:**
1. Acesse **Descrição de Cargos > Configurações**
2. Defina fluxo: Ocupante → Superior → RH → Aprovador CC → Líder C&S

#### 3.4 Criar Templates de Avaliação

1. Acesse **Performance > Configurar Avaliações**
2. Crie templates para diferentes tipos de avaliação:
   - Avaliação de Desempenho Anual
   - Avaliação 360°
   - Avaliação de Experiência
3. Defina critérios e pesos para cada template

---

## 📊 Funcionalidades Disponíveis

### Para Administradores

- Gestão completa de usuários e permissões
- Configuração de departamentos, cargos e hierarquia
- Criação de ciclos de avaliação
- Configuração de workflows
- Relatórios executivos e analytics
- Auditoria e logs do sistema

### Para Gestores

- Dashboard de equipe
- Avaliações de desempenho
- Aprovação de metas
- Acompanhamento de PDIs
- Gestão de sucessão
- Calibração de avaliações

### Para Colaboradores

- Autoavaliação
- Visualização de metas e progresso
- PDI pessoal
- Feedback 360°
- Histórico de avaliações
- Notificações e alertas

---

## 🔧 Solução de Problemas Comuns

### Emails não estão sendo enviados

**Solução:**
1. Verifique a configuração SMTP em **Configurações > SMTP**
2. Teste a conexão usando o botão "Testar Configuração"
3. Verifique se o firewall não está bloqueando a porta SMTP
4. Para Gmail, use uma "Senha de App" em vez da senha normal

### Usuários não conseguem fazer login

**Solução:**
1. Verifique se o usuário está cadastrado no sistema
2. Confirme que o email está correto
3. Verifique se o usuário tem permissão de acesso
4. Limpe o cache do navegador

### Dados não aparecem nos relatórios

**Solução:**
1. Verifique se os dados foram importados corretamente
2. Confirme que os filtros não estão muito restritivos
3. Aguarde alguns minutos para o cache atualizar
4. Recarregue a página (Ctrl+F5)

### Checkpoint não está sendo criado

**Solução:**
1. Aguarde 2-3 minutos e tente novamente
2. Verifique se não há erros no console do navegador
3. Certifique-se de que o servidor está rodando
4. Entre em contato com o suporte se o problema persistir

---

## 📞 Suporte Técnico

Para questões técnicas ou problemas:

1. **Documentação:** Consulte o arquivo `RELEASE_NOTES.md`
2. **Suporte Manus:** https://help.manus.im
3. **Logs do Sistema:** Acesse **Admin > Logs** no sistema

---

## ✅ Checklist Pós-Publicação

Use este checklist para garantir que tudo está configurado:

- [ ] Sistema publicado e acessível via URL
- [ ] SMTP configurado e testado
- [ ] Departamentos criados
- [ ] Cargos cadastrados
- [ ] Centros de custo configurados
- [ ] Funcionários importados
- [ ] Hierarquia organizacional definida
- [ ] Workflows de aprovação configurados
- [ ] Templates de avaliação criados
- [ ] Primeiro ciclo de avaliação criado
- [ ] Usuários testaram o acesso
- [ ] Notificações funcionando
- [ ] Relatórios gerando corretamente

---

## 🎯 Primeiros Passos Recomendados

Após publicar e configurar, recomendamos:

1. **Semana 1:** Treinamento dos administradores
2. **Semana 2:** Treinamento dos gestores
3. **Semana 3:** Comunicação e treinamento dos colaboradores
4. **Semana 4:** Lançamento do primeiro ciclo de avaliação piloto
5. **Mês 2:** Ajustes baseados no feedback
6. **Mês 3:** Rollout completo para toda a organização

---

## 📈 Métricas de Sucesso

Acompanhe estas métricas após o lançamento:

- Taxa de adoção (% de usuários ativos)
- Taxa de conclusão de avaliações
- Tempo médio de resposta em aprovações
- Satisfação dos usuários (pesquisa interna)
- Número de metas criadas e acompanhadas
- Engajamento com PDIs

---

**Boa sorte com o lançamento do Sistema AVD UISA! 🎉**
