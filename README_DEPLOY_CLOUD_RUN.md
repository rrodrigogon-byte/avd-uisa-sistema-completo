# 🚀 DEPLOY CLOUD RUN - AVD UISA v2.0.0

## ✅ STATUS DO BANCO DE DADOS

- ✅ MySQL rodando em: **34.39.223.147:3306**
- ✅ Database: **avd_uisa**
- ✅ 3.114 funcionários importados
- ✅ 622 usuários criados
- ✅ 26 tabelas criadas

---

## 🎯 OBJETIVO

Deploy simplificado do sistema AVD UISA no Google Cloud Run para resolver os erros de build.

---

## 📦 ARQUIVOS CRIADOS

### ✅ Arquivos Simplificados

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `Dockerfile` | Dockerfile simplificado (2 stages) | ✅ Corrigido |
| `package.simple.json` | Dependencies mínimas | ✅ Novo |
| `cloudbuild.simple.yaml` | Build simplificado | ✅ Novo |
| `deploy-cloud-run-simple.sh` | Script automatizado | ✅ Novo |
| `GUIA_DEPLOY_CLOUD_RUN_SIMPLES.md` | Guia completo | ✅ Novo |

---

## 🚀 OPÇÕES DE DEPLOY

### ⚡ Opção 1: Deploy Automatizado (Recomendado)

**Mais rápido e fácil - um comando faz tudo!**

```bash
# Executar script automatizado
./deploy-cloud-run-simple.sh
```

**O que o script faz:**
1. ✅ Verifica pré-requisitos (gcloud, docker)
2. ✅ Configura projeto
3. ✅ Habilita APIs necessárias
4. ✅ Build da imagem Docker
5. ✅ Push para Container Registry
6. ✅ Deploy no Cloud Run
7. ✅ Testa health check
8. ✅ Retorna URL do serviço

---

### 🎯 Opção 2: Deploy Manual Direto

**Deploy direto do código fonte (Cloud Build faz o build)**

```bash
# Configurar DATABASE_URL
export DATABASE_URL="mysql://root:SUA_SENHA@34.39.223.147:3306/avd_uisa"

# Deploy
gcloud run deploy avd-uisa \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=$DATABASE_URL" \
  --min-instances=1 \
  --max-instances=5 \
  --memory=2Gi \
  --cpu=2 \
  --port=3000
```

---

### 🐳 Opção 3: Deploy com Docker Manual

**Controle total do processo**

```bash
# 1. Build local
docker build -t gcr.io/SEU-PROJECT-ID/avd-uisa:latest .

# 2. Testar localmente (opcional)
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://root:SENHA@34.39.223.147:3306/avd_uisa" \
  gcr.io/SEU-PROJECT-ID/avd-uisa:latest

# 3. Push para Container Registry
gcloud auth configure-docker
docker push gcr.io/SEU-PROJECT-ID/avd-uisa:latest

# 4. Deploy
gcloud run deploy avd-uisa \
  --image gcr.io/SEU-PROJECT-ID/avd-uisa:latest \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=mysql://root:SENHA@34.39.223.147:3306/avd_uisa" \
  --min-instances=1 \
  --max-instances=5 \
  --memory=2Gi \
  --cpu=2 \
  --port=3000
```

---

### 🔧 Opção 4: Deploy com Cloud Build

**CI/CD automático**

```bash
# Usar cloudbuild.simple.yaml
gcloud builds submit --config=cloudbuild.simple.yaml
```

---

## 🔍 CORREÇÕES IMPLEMENTADAS

### ❌ Problemas Anteriores

1. **Dockerfile muito complexo** - 5 stages, muitas dependências
2. **package.json pesado** - 100+ dependências desnecessárias
3. **Build timeout** - Levava mais de 30 minutos
4. **Erros de memória** - OOM durante build
5. **Dependencies conflitantes** - Patches e overrides problemáticos

### ✅ Soluções Aplicadas

1. **Dockerfile simplificado** - 2 stages apenas
   - Stage 1: Build (vite + esbuild)
   - Stage 2: Production (node:20-alpine)

2. **Dependencies mínimas** - Apenas essenciais
   - Core: express, drizzle-orm, mysql2
   - tRPC: client + server
   - React: componentes básicos

3. **Build otimizado**
   - Cache de layers
   - pnpm com frozen-lockfile
   - Remover devDependencies na prod

4. **Configuração Cloud Run**
   - Memory: 2Gi (suficiente)
   - CPU: 2 (adequado)
   - Timeout: 300s
   - Min instances: 1 (sempre ativo)

---

## 📋 PRÉ-REQUISITOS

### ✅ Instalar Ferramentas

```bash
# 1. Google Cloud SDK
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# Windows
# Download: https://cloud.google.com/sdk/docs/install

# 2. Docker (opcional, para testes locais)
# https://docs.docker.com/get-docker/
```

### ✅ Configurar Google Cloud

```bash
# Login
gcloud auth login

# Configurar projeto
gcloud config set project SEU-PROJECT-ID

# Configurar região
gcloud config set run/region southamerica-east1

# Habilitar APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

---

## ✅ DEPOIS DO DEPLOY

### Verificar Serviço

```bash
# Obter URL
gcloud run services describe avd-uisa \
  --region southamerica-east1 \
  --format 'value(status.url)'

# Testar health check
curl https://SEU-SERVICO.run.app/health

# Ver logs
gcloud run services logs tail avd-uisa \
  --region southamerica-east1
```

### Comandos Úteis

```bash
# Status do serviço
gcloud run services describe avd-uisa --region southamerica-east1

# Atualizar configuração
gcloud run services update avd-uisa \
  --region southamerica-east1 \
  --memory=4Gi

# Listar revisões
gcloud run revisions list \
  --service avd-uisa \
  --region southamerica-east1

# Rollback
gcloud run services update-traffic avd-uisa \
  --to-revisions=REVISION=100 \
  --region southamerica-east1

# Deletar serviço
gcloud run services delete avd-uisa \
  --region southamerica-east1
```

---

## 🔒 SEGURANÇA: USAR SECRET MANAGER

### Configurar Secrets (Recomendado)

```bash
# 1. Criar secret DATABASE_URL
echo -n "mysql://root:SENHA@34.39.223.147:3306/avd_uisa" | \
  gcloud secrets create DATABASE_URL --data-file=-

# 2. Deploy com secret
gcloud run deploy avd-uisa \
  --image gcr.io/PROJECT/avd-uisa:latest \
  --region southamerica-east1 \
  --update-secrets=DATABASE_URL=DATABASE_URL:latest
```

---

## 🐛 TROUBLESHOOTING

### Build Failed

```bash
# Ver logs do build
gcloud builds log $(gcloud builds list --limit 1 --format 'value(id)')

# Soluções:
# 1. Usar Dockerfile simplificado (já aplicado)
# 2. Aumentar timeout: --timeout=1800s
# 3. Usar máquina maior: --machine-type=E2_HIGHCPU_8
```

### Connection Failed

```bash
# Verificar DATABASE_URL
gcloud run services describe avd-uisa --region southamerica-east1

# Testar conexão local
mysql -h 34.39.223.147 -u root -p avd_uisa

# Adicionar IP do Cloud Run no firewall
```

### Container Failed to Start

```bash
# Ver logs detalhados
gcloud run services logs read avd-uisa \
  --region southamerica-east1 \
  --limit 100

# Verificar:
# 1. PORT=3000 configurado
# 2. dist/index.js existe
# 3. Health check respondendo
```

---

## 📊 CONFIGURAÇÕES RECOMENDADAS

### Produção

```bash
--min-instances=2
--max-instances=10
--memory=4Gi
--cpu=4
--concurrency=80
```

### Staging

```bash
--min-instances=0
--max-instances=3
--memory=2Gi
--cpu=2
--concurrency=80
```

---

## ✅ CHECKLIST DE DEPLOY

- [ ] Google Cloud SDK instalado
- [ ] Projeto configurado (`gcloud config set project`)
- [ ] APIs habilitadas
- [ ] Docker instalado (opcional)
- [ ] DATABASE_URL preparada
- [ ] Senha do banco disponível
- [ ] Dockerfile simplificado revisado
- [ ] Script de deploy executado
- [ ] URL do serviço obtida
- [ ] Health check testado
- [ ] Logs verificados
- [ ] Sistema acessível

---

## 🎯 RESULTADO ESPERADO

Após o deploy bem-sucedido:

✅ Sistema rodando em: `https://avd-uisa-XXXXX-uc.a.run.app`  
✅ Conectado ao MySQL: `34.39.223.147:3306`  
✅ 3.114 funcionários acessíveis  
✅ 622 usuários disponíveis  
✅ Auto-scaling: 1-5 instâncias  
✅ Deploy em: **< 10 minutos**  

---

## 📞 SUPORTE

### Documentação

- **Guia completo**: `GUIA_DEPLOY_CLOUD_RUN_SIMPLES.md`
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Troubleshooting**: Ver seção acima

### Comandos de Debug

```bash
# Logs em tempo real
gcloud run services logs tail avd-uisa --region southamerica-east1

# Status completo
gcloud run services describe avd-uisa --region southamerica-east1

# Métricas
gcloud monitoring metrics list
```

---

## 🚀 INÍCIO RÁPIDO (TL;DR)

```bash
# 1. Configurar projeto
gcloud config set project SEU-PROJECT-ID

# 2. Executar deploy automatizado
./deploy-cloud-run-simple.sh

# 3. Acessar URL retornada
```

**Isso é tudo!** 🎉

---

📅 **Data**: 08/01/2026  
🚀 **Versão**: v2.0.0  
👨‍💻 **Desenvolvido por**: GenSpark AI Developer  
📦 **Repositório**: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo
