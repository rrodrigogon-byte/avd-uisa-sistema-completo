# 🚀 GUIA DE DEPLOY SIMPLIFICADO - CLOUD RUN

## 📋 PRÉ-REQUISITOS

✅ Banco de dados MySQL pronto em: **34.39.223.147:3306**  
✅ Database: **avd_uisa**  
✅ 3.114 funcionários importados  
✅ Conta Google Cloud ativa  

---

## 🔧 PASSO 1: CONFIGURAÇÃO INICIAL

### 1.1 Instalar Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# Verificar instalação
gcloud --version
```

### 1.2 Autenticar e Configurar Projeto

```bash
# Login
gcloud auth login

# Listar projetos
gcloud projects list

# Definir projeto padrão
gcloud config set project SEU-PROJECT-ID

# Definir região
gcloud config set run/region southamerica-east1
```

### 1.3 Habilitar APIs Necessárias

```bash
# Habilitar APIs (executar uma vez)
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

---

## 🗄️ PASSO 2: CONFIGURAR DATABASE_URL

### Opção A: Via Secret Manager (Recomendado)

```bash
# Criar secret com DATABASE_URL
echo -n "mysql://root:SUA_SENHA@34.39.223.147:3306/avd_uisa" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Verificar secret criado
gcloud secrets list
```

### Opção B: Via Variável de Ambiente (Simples)

```bash
# Será configurado direto no deploy (Passo 4)
```

---

## 📦 PASSO 3: PREPARAR ARQUIVOS

### 3.1 Usar Dockerfile Simplificado

O Dockerfile simplificado já foi criado e está pronto para uso.

### 3.2 Testar Build Local (Opcional)

```bash
# Build local para testar
docker build -t avd-uisa .

# Testar container local
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://root:SENHA@34.39.223.147:3306/avd_uisa" \
  avd-uisa

# Acessar: http://localhost:3000
```

---

## 🚀 PASSO 4: DEPLOY NO CLOUD RUN

### Opção A: Deploy Direto (Mais Rápido)

```bash
# Build e deploy em um comando
gcloud run deploy avd-uisa \
  --source . \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=mysql://root:SENHA@34.39.223.147:3306/avd_uisa" \
  --min-instances=1 \
  --max-instances=5 \
  --memory=2Gi \
  --cpu=2 \
  --port=3000 \
  --timeout=300
```

### Opção B: Deploy com Docker Manual

```bash
# 1. Build da imagem
docker build -t gcr.io/SEU-PROJECT-ID/avd-uisa:latest .

# 2. Push para Container Registry
docker push gcr.io/SEU-PROJECT-ID/avd-uisa:latest

# 3. Deploy
gcloud run deploy avd-uisa \
  --image gcr.io/SEU-PROJECT-ID/avd-uisa:latest \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=mysql://root:SENHA@34.39.223.147:3306/avd_uisa" \
  --min-instances=1 \
  --max-instances=5 \
  --memory=2Gi \
  --cpu=2 \
  --port=3000 \
  --timeout=300
```

### Opção C: Deploy com Cloud Build (CI/CD)

```bash
# Usar cloudbuild.simple.yaml
gcloud builds submit --config=cloudbuild.simple.yaml
```

---

## ✅ PASSO 5: VERIFICAR DEPLOY

### 5.1 Obter URL do Serviço

```bash
# Listar serviços
gcloud run services list

# Obter URL
gcloud run services describe avd-uisa \
  --region southamerica-east1 \
  --format 'value(status.url)'
```

### 5.2 Testar Health Check

```bash
# Obter URL
URL=$(gcloud run services describe avd-uisa \
  --region southamerica-east1 \
  --format 'value(status.url)')

# Testar
curl $URL/health

# Deve retornar: {"status":"ok"}
```

### 5.3 Ver Logs

```bash
# Logs em tempo real
gcloud run services logs tail avd-uisa --region southamerica-east1

# Logs recentes
gcloud run services logs read avd-uisa --region southamerica-east1 --limit 50
```

---

## 🔍 PASSO 6: TROUBLESHOOTING

### Erro: "Build Failed"

```bash
# Verificar logs do build
gcloud builds log $(gcloud builds list --limit 1 --format 'value(id)')

# Soluções comuns:
# 1. Verificar Dockerfile syntax
# 2. Verificar package.json scripts
# 3. Aumentar timeout do build
# 4. Verificar memoria/CPU disponível
```

### Erro: "Connection to database failed"

```bash
# Verificar DATABASE_URL
gcloud run services describe avd-uisa --region southamerica-east1

# Testar conexão do Cloud Run para o banco
# 1. Verificar se IP 34.39.223.147 está acessível
# 2. Verificar firewall do Cloud SQL
# 3. Adicionar IP do Cloud Run na lista de IPs autorizados
```

### Erro: "Container failed to start"

```bash
# Ver logs detalhados
gcloud run services logs read avd-uisa --region southamerica-east1 --limit 100

# Verificar:
# 1. PORT=3000 está configurado
# 2. Aplicação está ouvindo na porta correta
# 3. Health check está respondendo
```

---

## 📊 CONFIGURAÇÕES RECOMENDADAS

### Para Produção

```bash
gcloud run deploy avd-uisa \
  --image gcr.io/SEU-PROJECT-ID/avd-uisa:latest \
  --region southamerica-east1 \
  --min-instances=2 \
  --max-instances=10 \
  --memory=4Gi \
  --cpu=4 \
  --concurrency=80 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production"
```

### Para Desenvolvimento/Staging

```bash
gcloud run deploy avd-uisa-staging \
  --image gcr.io/SEU-PROJECT-ID/avd-uisa:latest \
  --region southamerica-east1 \
  --min-instances=0 \
  --max-instances=3 \
  --memory=2Gi \
  --cpu=2 \
  --concurrency=80 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=staging"
```

---

## 🔒 SEGURANÇA: CONFIGURAR SECRETS

### Usar Secret Manager ao Invés de Env Vars

```bash
# 1. Criar secrets
echo -n "mysql://root:SENHA@34.39.223.147:3306/avd_uisa" | \
  gcloud secrets create DATABASE_URL --data-file=-

echo -n "seu-jwt-secret-super-secreto" | \
  gcloud secrets create JWT_SECRET --data-file=-

# 2. Deploy com secrets
gcloud run deploy avd-uisa \
  --image gcr.io/SEU-PROJECT-ID/avd-uisa:latest \
  --region southamerica-east1 \
  --update-secrets=DATABASE_URL=DATABASE_URL:latest \
  --update-secrets=JWT_SECRET=JWT_SECRET:latest \
  --min-instances=1 \
  --max-instances=5
```

---

## 📝 COMANDOS ÚTEIS

```bash
# Atualizar serviço existente
gcloud run services update avd-uisa \
  --region southamerica-east1 \
  --memory=4Gi

# Deletar serviço
gcloud run services delete avd-uisa --region southamerica-east1

# Listar revisões
gcloud run revisions list --service avd-uisa --region southamerica-east1

# Rollback para revisão anterior
gcloud run services update-traffic avd-uisa \
  --to-revisions=REVISION_NAME=100 \
  --region southamerica-east1

# Ver métricas
gcloud run services describe avd-uisa \
  --region southamerica-east1 \
  --format json
```

---

## ✅ CHECKLIST FINAL

- [ ] Google Cloud SDK instalado
- [ ] Projeto configurado
- [ ] APIs habilitadas
- [ ] DATABASE_URL configurado
- [ ] Build testado localmente (opcional)
- [ ] Deploy realizado
- [ ] URL obtida
- [ ] Health check respondendo
- [ ] Logs verificados
- [ ] Sistema acessível

---

## 🎯 RESULTADO ESPERADO

Após seguir todos os passos, você terá:

✅ Sistema AVD UISA rodando em **https://avd-uisa-XXXXX-uc.a.run.app**  
✅ Conectado ao banco MySQL em **34.39.223.147**  
✅ 3.114 funcionários disponíveis  
✅ Auto-scaling configurado (1-5 instâncias)  
✅ Deploy em **< 10 minutos**  

---

## 📞 SUPORTE

- **Logs**: `gcloud run services logs tail avd-uisa --region southamerica-east1`
- **Status**: `gcloud run services describe avd-uisa --region southamerica-east1`
- **Documentação**: https://cloud.google.com/run/docs

---

📅 **Atualizado**: 08/01/2026  
🚀 **Versão**: v2.0.0  
👨‍💻 **Desenvolvido por**: GenSpark AI Developer
