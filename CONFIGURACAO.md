# Guia de Configuração - Sistema AVD UISA

## 📋 Índice

1. [Variáveis de Ambiente](#variáveis-de-ambiente)
2. [Integração TOTVS RM](#integração-totvs-rm)
3. [Sistema de E-mail (Gmail SMTP)](#sistema-de-e-mail)
4. [Reconhecimento Facial](#reconhecimento-facial)
5. [Banco de Dados](#banco-de-dados)

---

## 🔧 Variáveis de Ambiente

### Configuração Automática

As seguintes variáveis já estão pré-configuradas pelo sistema:

```bash
# Sistema Manus (Pré-configurado)
DATABASE_URL=<configurado automaticamente>
JWT_SECRET=<configurado automaticamente>
VITE_APP_ID=<configurado automaticamente>
VITE_APP_TITLE="Sistema AVD UISA - Avaliação de Desempenho"
VITE_APP_LOGO=<configurado automaticamente>
```

### Configuração Manual Necessária

Configure as seguintes variáveis através do **painel de Secrets** na interface de gerenciamento:

#### TOTVS RM Integration

```bash
TOTVS_RM_BASE_URL=https://api.totvs.com.br/rm
TOTVS_RM_APP_KEY=<sua_app_key>
TOTVS_RM_APP_SECRET=<seu_app_secret>
TOTVS_RM_TENANT=<seu_tenant_id>
```

#### Gmail SMTP (Já Configurado)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=avd@uisa.com.br
SMTP_PASS=C8HNBnv@Wfjznqo6CKSzw^
SMTP_FROM_NAME=Sistema AVD UISA
SMTP_FROM_EMAIL=avd@uisa.com.br
```

---

## 🔗 Integração TOTVS RM

### Passo 1: Criar Aplicação OAuth no TOTVS

1. Acesse o portal TOTVS RM
2. Navegue até **Configurações** → **Integrações** → **OAuth**
3. Clique em **Nova Aplicação**
4. Preencha os dados:
   - **Nome**: Sistema AVD UISA
   - **Tipo**: Server-to-Server
   - **Redirect URI**: `https://seu-dominio.com/api/totvs/callback`
5. Copie o **App Key** e **App Secret** gerados

### Passo 2: Configurar Secrets

Adicione as credenciais no painel de Secrets:

- `TOTVS_RM_APP_KEY`: Cole o App Key
- `TOTVS_RM_APP_SECRET`: Cole o App Secret
- `TOTVS_RM_TENANT`: ID do tenant (geralmente o CNPJ da empresa)

### Passo 3: Testar Conexão

Execute o script de teste:

```bash
pnpm run test:totvs
```

### Endpoints Disponíveis

A integração TOTVS RM fornece os seguintes endpoints:

- `POST /api/totvs/sync/employees` - Sincronizar colaboradores
- `POST /api/totvs/sync/departments` - Sincronizar departamentos
- `POST /api/totvs/sync/positions` - Sincronizar cargos
- `GET /api/totvs/status` - Verificar status da conexão

### Agendamento Automático

Para configurar sincronização automática diária:

1. Acesse **Configurações** → **Integrações** → **TOTVS RM**
2. Ative **Sincronização Automática**
3. Defina o horário (recomendado: 02:00 AM)

---

## 📧 Sistema de E-mail

### Configuração Gmail SMTP

As credenciais do Gmail já estão configuradas:

- **E-mail**: avd@uisa.com.br
- **Senha de App**: C8HNBnv@Wfjznqo6CKSzw^
- **Servidor**: smtp.gmail.com
- **Porta**: 587 (TLS)

### Tipos de E-mail Automatizados

O sistema envia automaticamente 32 tipos de e-mails:

#### Autenticação
- Bem-vindo ao sistema
- Reset de senha
- Login suspeito detectado

#### Metas
- Nova meta atribuída
- Meta aprovada pelo gestor
- Meta rejeitada
- Prazo de meta vencendo (3 dias antes)
- Meta vencida

#### Avaliações 360°
- Nova avaliação pendente
- Lembrete de avaliação (7 dias antes)
- Avaliação concluída
- Feedback disponível

#### PDI
- PDI criado
- PDI aprovado
- PDI rejeitado
- Ação de PDI vencendo
- Ação de PDI vencida

### Testar Envio de E-mail

```bash
pnpm run test:email
```

### Personalizar Templates

Os templates HTML estão em:
```
server/utils/emailService.ts
```

---

## 👤 Reconhecimento Facial

### Passo 1: Baixar Modelos

Os modelos face-api.js já foram baixados automaticamente para:
```
client/public/models/
```

Se precisar baixar novamente:

```bash
chmod +x scripts/download-face-models.sh
./scripts/download-face-models.sh
```

### Passo 2: Cadastrar Face

1. Faça login no sistema
2. Acesse **Perfil** → **Segurança** → **Reconhecimento Facial**
3. Clique em **Cadastrar Face**
4. Siga as instruções na tela (capture 3 fotos diferentes)
5. Aguarde o processamento

### Passo 3: Login com Face

1. Na tela de login, clique em **Login com Face**
2. Permita acesso à câmera
3. Posicione seu rosto na área indicada
4. Aguarde o reconhecimento

### Configurações

- **Threshold de Confiança**: 0.6 (60%)
- **Número de Fotos**: 3
- **Fallback**: Login tradicional sempre disponível

---

## 🗄️ Banco de Dados

### Estrutura

O sistema possui 24 tabelas principais:

- **Usuários e Autenticação**: users, facial_descriptors
- **Organização**: departments, positions, employees
- **Ciclos**: evaluation_cycles
- **Metas**: goals
- **Avaliações**: performance_evaluations, evaluation_responses, evaluation_competencies
- **PDI**: pdi_plans, pdi_items, pdi_progress, development_actions
- **9-Box**: nine_box_positions, succession_plans
- **Competências**: competencies, competency_levels, employee_competencies
- **Calibração**: calibration_sessions, calibration_changes
- **Auditoria**: audit_logs

### Migrations

Para aplicar migrações:

```bash
pnpm db:push
```

### Seeds

Para popular o banco com dados de exemplo:

```bash
npx tsx scripts/seed.ts
```

### Backup

Recomendado: Backup diário automático às 03:00 AM

---

## 🚀 Inicialização Rápida

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Banco de Dados

```bash
pnpm db:push
npx tsx scripts/seed.ts
```

### 3. Baixar Modelos Faciais

```bash
./scripts/download-face-models.sh
```

### 4. Iniciar Servidor

```bash
pnpm dev
```

### 5. Acessar Sistema

```
http://localhost:3000
```

---

## 📞 Suporte

Para dúvidas ou problemas:

- **E-mail**: suporte@uisa.com.br
- **Documentação**: https://docs.avd.uisa.com.br
- **GitHub Issues**: https://github.com/uisa/avd-sistema

---

**Última atualização**: 17 de Novembro de 2025
