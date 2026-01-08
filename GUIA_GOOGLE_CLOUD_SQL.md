# 🔧 Guia de Configuração - Google Cloud SQL para AVD UISA

**Data**: 08/01/2026  
**Sistema**: AVD UISA v2.0.0  
**Banco de Dados**: Google Cloud SQL (MySQL 8.0)

---

## 📋 ÍNDICE

1. [Criar Instância Cloud SQL](#1-criar-instância-cloud-sql)
2. [Configurar Rede e Segurança](#2-configurar-rede-e-segurança)
3. [Criar Banco de Dados e Usuário](#3-criar-banco-de-dados-e-usuário)
4. [Conectar Localmente](#4-conectar-localmente)
5. [Configurar .env](#5-configurar-env)
6. [Testar Conexão](#6-testar-conexão)
7. [Deploy no Cloud Run](#7-deploy-no-cloud-run)
8. [Backup e Monitoramento](#8-backup-e-monitoramento)

---

## 1. Criar Instância Cloud SQL

### Via Console Google Cloud

1. Acesse: https://console.cloud.google.com/sql
2. Clique em **"Criar Instância"**
3. Selecione **"MySQL"**
4. Configure:

**Configuração Básica**:
```
ID da instância: avd-uisa-db
Senha do root: [Gere uma senha forte]
Versão: MySQL 8.0
Região: southamerica-east1 (São Paulo)
Zona: Qualquer (ou southamerica-east1-a)
```

**Configuração de Máquina** (Recomendado para produção):
```
Tipo de máquina: db-n1-standard-2
  - 2 vCPUs
  - 7.5 GB RAM
  - Capacidade para ~3.000-5.000 usuários simultâneos

Armazenamento:
  - Tipo: SSD
  - Tamanho: 50 GB (inicial)
  - Ativar: Aumento automático de armazenamento
  - Limite: 250 GB
```

**Configuração de Máquina** (Desenvolvimento/Teste):
```
Tipo de máquina: db-f1-micro
  - 1 vCPU compartilhada
  - 0.6 GB RAM
  - Suficiente para testes e desenvolvimento

Armazenamento:
  - Tipo: SSD
  - Tamanho: 10 GB
```

**Alta Disponibilidade** (Produção):
```
☑️ Ativar alta disponibilidade (configuração regional)
☑️ Ativar backups automáticos
☐ Ativar log binário (opcional, para point-in-time recovery)
```

5. Clique em **"Criar Instância"**
6. Aguarde ~10-15 minutos para provisionamento

### Via gcloud CLI

```bash
# Criar instância de produção
gcloud sql instances create avd-uisa-db \
  --database-version=MYSQL_8_0 \
  --tier=db-n1-standard-2 \
  --region=southamerica-east1 \
  --storage-type=SSD \
  --storage-size=50GB \
  --storage-auto-increase \
  --storage-auto-increase-limit=250 \
  --availability-type=REGIONAL \
  --backup \
  --backup-start-time=03:00 \
  --retained-backups-count=7 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4

# Criar instância de desenvolvimento (mais barata)
gcloud sql instances create avd-uisa-db-dev \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=southamerica-east1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --no-backup
```

---

## 2. Configurar Rede e Segurança

### 2.1 Configurar IP Público (Desenvolvimento)

**Via Console**:
1. Acesse a instância criada
2. Vá em **"Conexões"** > **"Rede"**
3. Em **"Redes autorizadas"**, clique em **"Adicionar rede"**
4. Adicione seu IP público:
   ```
   Nome: Meu IP Local
   Rede: [Seu IP]/32
   ```
   
   Para descobrir seu IP: https://whatismyip.com

5. **⚠️ IMPORTANTE**: Para desenvolvimento, você pode temporariamente usar `0.0.0.0/0` (todos os IPs), mas **NUNCA** em produção!

**Via gcloud**:
```bash
# Obter seu IP público
curl https://ipinfo.io/ip

# Adicionar seu IP
gcloud sql instances patch avd-uisa-db \
  --authorized-networks=[SEU_IP]/32

# OU permitir todos (apenas dev/teste)
gcloud sql instances patch avd-uisa-db \
  --authorized-networks=0.0.0.0/0
```

### 2.2 Configurar Cloud SQL Proxy (Recomendado)

O Cloud SQL Proxy é a forma mais segura de conectar:

**Instalar o Proxy**:
```bash
# macOS
brew install cloud-sql-proxy

# Linux
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy
sudo mv cloud_sql_proxy /usr/local/bin/

# Windows
# Baixar de: https://cloud.google.com/sql/docs/mysql/sql-proxy
```

**Executar o Proxy**:
```bash
# Obter o nome da conexão
gcloud sql instances describe avd-uisa-db --format='value(connectionName)'
# Resultado: seu-projeto:southamerica-east1:avd-uisa-db

# Executar proxy
cloud_sql_proxy -instances=seu-projeto:southamerica-east1:avd-uisa-db=tcp:3306
```

### 2.3 Configurar Private IP (Produção)

Para produção no Cloud Run, use Private IP:

```bash
# Criar VPC Connector
gcloud compute networks vpc-access connectors create avd-connector \
  --network=default \
  --region=southamerica-east1 \
  --range=10.8.0.0/28

# Configurar instância com IP privado
gcloud sql instances patch avd-uisa-db \
  --network=default \
  --no-assign-ip
```

---

## 3. Criar Banco de Dados e Usuário

### Via Console

1. Acesse sua instância
2. Vá em **"Bancos de dados"**
3. Clique em **"Criar banco de dados"**
   ```
   Nome: avd_uisa_db
   Conjunto de caracteres: utf8mb4
   Agrupamento: utf8mb4_unicode_ci
   ```

4. Vá em **"Usuários"** > **"Adicionar conta de usuário"**
   ```
   Nome de usuário: avd_user
   Senha: [Gere uma senha forte - min 20 caracteres]
   Host: % (qualquer host)
   ```

### Via MySQL Client

```bash
# Conectar como root
mysql -h [IP_DA_INSTANCIA] -u root -p

# OU via Cloud SQL Proxy
mysql -h 127.0.0.1 -u root -p
```

```sql
-- Criar banco de dados
CREATE DATABASE avd_uisa_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'avd_user'@'%' IDENTIFIED BY 'SuaSenhaForteAqui123!@#';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON avd_uisa_db.* TO 'avd_user'@'%';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Verificar
SELECT user, host FROM mysql.user WHERE user = 'avd_user';
SHOW DATABASES;
```

### Via gcloud

```bash
# Criar banco de dados
gcloud sql databases create avd_uisa_db \
  --instance=avd-uisa-db \
  --charset=utf8mb4 \
  --collation=utf8mb4_unicode_ci

# Criar usuário
gcloud sql users create avd_user \
  --instance=avd-uisa-db \
  --password=[SUA_SENHA_FORTE]
```

---

## 4. Conectar Localmente

### Opção 1: Conexão Direta (IP Público)

1. Obtenha o IP público da instância:
   ```bash
   gcloud sql instances describe avd-uisa-db --format='value(ipAddresses[0].ipAddress)'
   ```

2. Teste a conexão:
   ```bash
   mysql -h [IP_PUBLICO] -u avd_user -p avd_uisa_db
   ```

3. String de conexão:
   ```
   mysql://avd_user:SuaSenha@[IP_PUBLICO]:3306/avd_uisa_db
   ```

### Opção 2: Cloud SQL Proxy (Recomendado)

1. Execute o proxy em um terminal:
   ```bash
   cloud_sql_proxy -instances=seu-projeto:southamerica-east1:avd-uisa-db=tcp:3306
   ```

2. Em outro terminal, teste:
   ```bash
   mysql -h 127.0.0.1 -u avd_user -p avd_uisa_db
   ```

3. String de conexão:
   ```
   mysql://avd_user:SuaSenha@127.0.0.1:3306/avd_uisa_db
   ```

---

## 5. Configurar .env

### 5.1 Copiar Template

```bash
cd /home/user/webapp
cp .env.example .env
```

### 5.2 Editar .env

```bash
nano .env
# ou
vim .env
# ou
code .env
```

### 5.3 Preencher Variáveis

#### Para Desenvolvimento Local com Cloud SQL Proxy:

```env
# Banco de Dados (via Proxy)
DATABASE_URL="mysql://avd_user:SuaSenhaForte123!@127.0.0.1:3306/avd_uisa_db"

# JWT
JWT_SECRET="[gere com: openssl rand -base64 32]"

# OAuth Manus
OAUTH_CLIENT_ID="seu-client-id"
OAUTH_CLIENT_SECRET="seu-client-secret"
OAUTH_REDIRECT_URI="http://localhost:3000/auth/callback"

# SMTP (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="noreply@uisa.com.br"
SMTP_FROM_NAME="Sistema AVD UISA"

# AWS S3 (se usar)
AWS_ACCESS_KEY_ID="sua-key"
AWS_SECRET_ACCESS_KEY="sua-secret"
AWS_REGION="us-east-1"
AWS_BUCKET="avd-uisa-storage"

# Aplicação
NODE_ENV="development"
PORT="3000"
APP_URL="http://localhost:3000"
```

#### Para Desenvolvimento Local com IP Público:

```env
DATABASE_URL="mysql://avd_user:SuaSenhaForte123!@34.95.123.45:3306/avd_uisa_db"
# Resto igual
```

### 5.4 Gerar JWT Secret

```bash
# No terminal
openssl rand -base64 32

# Resultado exemplo: xK9m3nP7qR2wS5tV8yB4cE6fH1jL0oN3pQ8rS2uT1vW5xY9zA3bC7dE1fG4hJ6k
```

---

## 6. Testar Conexão

### 6.1 Teste Manual com MySQL Client

```bash
# Se usando Cloud SQL Proxy
mysql -h 127.0.0.1 -u avd_user -p avd_uisa_db

# Se usando IP público
mysql -h [IP_PUBLICO] -u avd_user -p avd_uisa_db
```

```sql
-- Verificar conexão
SELECT 'Conexão OK!' AS status;

-- Verificar versão
SELECT VERSION();

-- Listar tabelas (deve estar vazio ainda)
SHOW TABLES;

-- Sair
EXIT;
```

### 6.2 Teste com Node.js

Crie um arquivo de teste: `test-db-connection.mjs`

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

console.log('🔍 Testando conexão com banco de dados...\n');

try {
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('✅ Conexão estabelecida com sucesso!\n');
  
  const [rows] = await connection.execute('SELECT VERSION() as version');
  console.log(`📊 Versão MySQL: ${rows[0].version}\n`);
  
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`📋 Tabelas existentes: ${tables.length}\n`);
  
  await connection.end();
  console.log('✅ Teste concluído com sucesso!');
  
} catch (error) {
  console.error('❌ Erro ao conectar:', error.message);
  console.error('\n🔧 Verifique:');
  console.error('  1. DATABASE_URL está correta no .env');
  console.error('  2. Cloud SQL Proxy está rodando (se aplicável)');
  console.error('  3. Firewall permite conexão');
  console.error('  4. Credenciais estão corretas');
  process.exit(1);
}
```

Execute:
```bash
cd /home/user/webapp
node test-db-connection.mjs
```

---

## 7. Deploy no Cloud Run

### 7.1 Criar Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm e dependências
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiar código
COPY . .

# Build
RUN pnpm build

# Expor porta
EXPOSE 3000

# Comando de start
CMD ["pnpm", "start"]
```

### 7.2 Deploy

```bash
# Build e deploy
gcloud run deploy avd-uisa \
  --source . \
  --region=southamerica-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --add-cloudsql-instances=seu-projeto:southamerica-east1:avd-uisa-db

# OU usando Docker
docker build -t gcr.io/seu-projeto/avd-uisa .
docker push gcr.io/seu-projeto/avd-uisa

gcloud run deploy avd-uisa \
  --image=gcr.io/seu-projeto/avd-uisa \
  --region=southamerica-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --add-cloudsql-instances=seu-projeto:southamerica-east1:avd-uisa-db
```

### 7.3 Configurar Variáveis de Ambiente

```bash
# Usando Secret Manager (recomendado)
gcloud secrets create DATABASE_URL --data-file=-
# Cole a string de conexão e pressione Ctrl+D

gcloud run services update avd-uisa \
  --update-secrets=DATABASE_URL=DATABASE_URL:latest

# OU via variáveis diretas (menos seguro)
gcloud run services update avd-uisa \
  --set-env-vars="DATABASE_URL=mysql://avd_user:senha@/avd_uisa_db?socket=/cloudsql/seu-projeto:southamerica-east1:avd-uisa-db"
```

---

## 8. Backup e Monitoramento

### 8.1 Configurar Backups Automáticos

```bash
# Ativar backups automáticos
gcloud sql instances patch avd-uisa-db \
  --backup-start-time=03:00 \
  --retained-backups-count=7

# Fazer backup manual
gcloud sql backups create --instance=avd-uisa-db
```

### 8.2 Monitoramento

**Via Console**:
- Acesse: https://console.cloud.google.com/sql/instances/avd-uisa-db/monitoring
- Monitore: CPU, Memória, Conexões, Queries

**Configurar Alertas**:
```bash
# Alerta de CPU alta
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="Cloud SQL CPU Alto" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s
```

### 8.3 Logs

```bash
# Ver logs da instância
gcloud sql operations list --instance=avd-uisa-db

# Ver logs de queries lentas
gcloud logging read "resource.type=cloudsql_database" --limit=50
```

---

## 9. Custos Estimados (Região São Paulo)

### Desenvolvimento (db-f1-micro):
```
Instância: ~$8/mês
Armazenamento 10GB SSD: ~$2/mês
Backup 10GB: ~$0.30/mês
Rede: ~$0.10/GB
Total estimado: ~$10-15/mês
```

### Produção (db-n1-standard-2 com HA):
```
Instância: ~$140/mês
Alta Disponibilidade: +$140/mês
Armazenamento 50GB SSD: ~$8.50/mês
Backup 50GB: ~$1.50/mês
Rede: ~$0.10/GB
Total estimado: ~$290-320/mês
```

---

## 10. Troubleshooting

### Erro: "Can't connect to MySQL server"

**Solução**:
1. Verifique se Cloud SQL Proxy está rodando
2. Verifique firewall/redes autorizadas
3. Confirme IP público da instância
4. Teste com telnet: `telnet [IP] 3306`

### Erro: "Access denied for user"

**Solução**:
1. Verifique usuário e senha
2. Confirme host permitido: `SELECT user, host FROM mysql.user;`
3. Verifique privilégios: `SHOW GRANTS FOR 'avd_user'@'%';`

### Erro: "Too many connections"

**Solução**:
```sql
-- Ver conexões atuais
SHOW PROCESSLIST;

-- Aumentar limite
SET GLOBAL max_connections = 300;
```

**Via gcloud**:
```bash
gcloud sql instances patch avd-uisa-db \
  --database-flags=max_connections=300
```

---

## 📋 Checklist de Configuração

- [ ] Instância Cloud SQL criada
- [ ] Banco de dados `avd_uisa_db` criado
- [ ] Usuário `avd_user` criado com privilégios
- [ ] Rede configurada (IP público ou Private IP)
- [ ] Cloud SQL Proxy instalado (se usar)
- [ ] Arquivo `.env` criado e configurado
- [ ] Teste de conexão bem-sucedido
- [ ] Backups automáticos configurados
- [ ] Monitoramento configurado
- [ ] Alertas criados (produção)

---

## 🔗 Links Úteis

- **Console Cloud SQL**: https://console.cloud.google.com/sql
- **Documentação**: https://cloud.google.com/sql/docs/mysql
- **Pricing**: https://cloud.google.com/sql/pricing
- **Cloud SQL Proxy**: https://cloud.google.com/sql/docs/mysql/sql-proxy
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager

---

**Próximo passo**: Após configurar o banco, execute `pnpm db:push` para criar as 62 tabelas!
