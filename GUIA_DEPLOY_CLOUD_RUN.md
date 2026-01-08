# 🚀 Guia Completo de Deploy no Google Cloud Run - AVD UISA

**Data**: 08/01/2026  
**Sistema**: AVD UISA v2.0.0  
**Plataforma**: Google Cloud Run

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Inicial](#configuração-inicial)
4. [Deploy Manual](#deploy-manual)
5. [Deploy Automático com Script](#deploy-automático)
6. [CI/CD com Cloud Build](#cicd-com-cloud-build)
7. [Configurações Avançadas](#configurações-avançadas)
8. [Monitoramento](#monitoramento)
9. [Troubleshooting](#troubleshooting)
10. [Custos Estimados](#custos-estimados)

---

## 1. Visão Geral

### Arquitetura do Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   GitHub Repository                                         │
│   └─ Push to main                                           │
│       ↓                                                     │
│   ┌──────────────────────────────────────────┐             │
│   │ Google Cloud Build                       │             │
│   │ - Build Docker image                     │             │
│   │ - Run tests                              │             │
│   │ - Push to Container Registry             │             │
│   └──────────────────────────────────────────┘             │
│       ↓                                                     │
│   ┌──────────────────────────────────────────┐             │
│   │ Google Cloud Run                         │             │
│   │ - Deploy new revision                    │             │
│   │ - Auto-scaling (1-10 instances)          │             │
│   │ - HTTPS endpoint                         │             │
│   └──────────────────────────────────────────┘             │
│       ↓                                                     │
│   ┌──────────────────────────────────────────┐             │
│   │ Google Cloud SQL                         │             │
│   │ - MySQL database                         │             │
│   │ - Private connection                     │             │
│   └──────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Características do Deploy

- ✅ **Containers Docker** otimizados multi-stage
- ✅ **Auto-scaling** de 1-10 instâncias
- ✅ **HTTPS** automático com certificado gerenciado
- ✅ **Zero downtime** deploys
- ✅ **Rollback** instantâneo
- ✅ **Private VPC** para conexão com Cloud SQL
- ✅ **Secret Manager** para credenciais
- ✅ **Health checks** automatizados

---

## 2. Pré-requisitos

### Software Necessário

```bash
# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
gcloud --version

# Docker
docker --version

# Git
git --version

# Node.js 20+
node --version

# pnpm
pnpm --version
```

### Conta Google Cloud

1. Criar conta: https://console.cloud.google.com
2. Criar projeto novo ou usar existente
3. Ativar billing (necessário para Cloud Run)
4. Anot project ID

### APIs Necessárias

Ativar as seguintes APIs no Google Cloud Console:

```bash
# Ativar APIs via gcloud
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    sql-component.googleapis.com \
    vpcaccess.googleapis.com \
    secretmanager.googleapis.com \
    compute.googleapis.com
```

Ou via console:
- Cloud Run API
- Cloud Build API
- Container Registry API
- Cloud SQL Admin API
- VPC Access API
- Secret Manager API

---

## 3. Configuração Inicial

### 3.1 Configurar gcloud CLI

```bash
# Login
gcloud auth login

# Configurar projeto
gcloud config set project SEU_PROJECT_ID

# Configurar região
gcloud config set run/region southamerica-east1

# Verificar configuração
gcloud config list
```

### 3.2 Criar Service Account

```bash
# Criar service account
gcloud iam service-accounts create avd-uisa-sa \
    --display-name="AVD UISA Service Account"

# Obter email da service account
SA_EMAIL="avd-uisa-sa@$(gcloud config get-value project).iam.gserviceaccount.com"

# Conceder permissões necessárias
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor"
```

### 3.3 Criar VPC Connector (para Cloud SQL)

```bash
# Criar VPC Connector
gcloud compute networks vpc-access connectors create avd-connector \
    --network=default \
    --region=southamerica-east1 \
    --range=10.8.0.0/28

# Verificar
gcloud compute networks vpc-access connectors describe avd-connector \
    --region=southamerica-east1
```

### 3.4 Configurar Secrets no Secret Manager

```bash
# DATABASE_URL
echo -n "mysql://user:pass@/database?socket=/cloudsql/PROJECT:REGION:INSTANCE" | \
    gcloud secrets create DATABASE_URL --data-file=-

# JWT_SECRET
openssl rand -base64 32 | \
    gcloud secrets create JWT_SECRET --data-file=-

# SMTP_PASS
echo -n "sua-senha-smtp" | \
    gcloud secrets create SMTP_PASS --data-file=-

# Verificar secrets criados
gcloud secrets list
```

---

## 4. Deploy Manual

### 4.1 Build Local e Push

```bash
# 1. Build da imagem Docker
docker build -t gcr.io/[PROJECT_ID]/avd-uisa:latest .

# 2. Testar localmente
docker run -p 3000:3000 \
    -e DATABASE_URL="sua-database-url" \
    -e JWT_SECRET="seu-jwt-secret" \
    gcr.io/[PROJECT_ID]/avd-uisa:latest

# 3. Configurar Docker para gcloud
gcloud auth configure-docker

# 4. Push para Container Registry
docker push gcr.io/[PROJECT_ID]/avd-uisa:latest
```

### 4.2 Deploy no Cloud Run

```bash
# Deploy com configuração mínima
gcloud run deploy avd-uisa \
    --image gcr.io/[PROJECT_ID]/avd-uisa:latest \
    --region southamerica-east1 \
    --platform managed \
    --allow-unauthenticated

# Deploy com configuração completa
gcloud run deploy avd-uisa \
    --image gcr.io/[PROJECT_ID]/avd-uisa:latest \
    --region southamerica-east1 \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production" \
    --add-cloudsql-instances [PROJECT_ID]:southamerica-east1:avd-uisa-db \
    --service-account avd-uisa-sa@[PROJECT_ID].iam.gserviceaccount.com \
    --vpc-connector avd-connector \
    --vpc-egress private-ranges-only \
    --min-instances 1 \
    --max-instances 10 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 80 \
    --port 3000 \
    --update-secrets=DATABASE_URL=DATABASE_URL:latest \
    --update-secrets=JWT_SECRET=JWT_SECRET:latest \
    --update-secrets=SMTP_PASS=SMTP_PASS:latest
```

### 4.3 Verificar Deploy

```bash
# Ver URL do serviço
gcloud run services describe avd-uisa \
    --region southamerica-east1 \
    --format 'value(status.url)'

# Testar endpoint
SERVICE_URL=$(gcloud run services describe avd-uisa \
    --region southamerica-east1 \
    --format 'value(status.url)')

curl $SERVICE_URL/health
```

---

## 5. Deploy Automático com Script

Usamos o script `deploy-cloud-run.sh` criado:

```bash
# Tornar executável
chmod +x deploy-cloud-run.sh

# Deploy em produção
bash deploy-cloud-run.sh production

# Deploy em staging
bash deploy-cloud-run.sh staging

# Deploy em development
bash deploy-cloud-run.sh development
```

### O que o script faz:

1. ✅ Valida pré-requisitos (gcloud, docker, git)
2. ✅ Build da imagem Docker com cache
3. ✅ Push para Container Registry
4. ✅ Deploy no Cloud Run com configurações específicas por ambiente
5. ✅ Health check automatizado
6. ✅ Resumo com URL e próximos passos

---

## 6. CI/CD com Cloud Build

### 6.1 Configurar Trigger no GitHub

```bash
# Conectar repositório GitHub ao Cloud Build
# Via console: https://console.cloud.google.com/cloud-build/triggers

# Ou via gcloud:
gcloud builds triggers create github \
    --name="avd-uisa-deploy-main" \
    --repo-name="avd-uisa-sistema-completo" \
    --repo-owner="rrodrigogon-byte" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml" \
    --substitutions='_PROJECT_ID=[PROJECT_ID],_REGION=southamerica-east1'

# Trigger para staging
gcloud builds triggers create github \
    --name="avd-uisa-deploy-staging" \
    --repo-name="avd-uisa-sistema-completo" \
    --repo-owner="rrodrigogon-byte" \
    --branch-pattern="^staging$" \
    --build-config="cloudbuild.yaml" \
    --substitutions='_PROJECT_ID=[PROJECT_ID],_REGION=southamerica-east1'
```

### 6.2 Testar Build Localmente

```bash
# Instalar cloud-build-local
go install github.com/GoogleCloudPlatform/cloud-build-local@latest

# Executar build local
cloud-build-local --config=cloudbuild.yaml --dryrun=false .
```

### 6.3 Workflow Automático

1. **Developer** faz push para branch `main`
2. **Cloud Build** detecta push via trigger
3. **Build** automático da imagem Docker
4. **Tests** executados (se configurado)
5. **Deploy** automático no Cloud Run
6. **Notificação** de sucesso/falha

---

## 7. Configurações Avançadas

### 7.1 Custom Domain

```bash
# Mapear domínio customizado
gcloud run domain-mappings create \
    --service avd-uisa \
    --domain avd.uisa.com.br \
    --region southamerica-east1

# Adicionar registro DNS
# Tipo: CNAME
# Nome: avd
# Valor: ghs.googlehosted.com
```

### 7.2 Load Balancer (Multi-região)

```bash
# Criar backend service
gcloud compute backend-services create avd-backend \
    --global

# Adicionar Cloud Run como backend
gcloud compute backend-services add-backend avd-backend \
    --global \
    --network-endpoint-group=avd-neg \
    --network-endpoint-group-region=southamerica-east1
```

### 7.3 Cloud CDN

```bash
# Ativar CDN no backend service
gcloud compute backend-services update avd-backend \
    --enable-cdn \
    --global
```

### 7.4 IAP (Identity-Aware Proxy)

```bash
# Configurar IAP para autenticação
gcloud iap web enable \
    --resource-type=app-engine \
    --oauth2-client-id=[CLIENT_ID] \
    --oauth2-client-secret=[CLIENT_SECRET]
```

---

## 8. Monitoramento

### 8.1 Logs

```bash
# Ver logs em tempo real
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=avd-uisa" \
    --limit 50 \
    --format json

# Logs de erro apenas
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=avd-uisa AND severity>=ERROR" \
    --limit 50

# Seguir logs (tail -f)
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=avd-uisa"
```

### 8.2 Métricas

Acessar via console:
- https://console.cloud.google.com/run/detail/southamerica-east1/avd-uisa/metrics

Métricas disponíveis:
- **Request count** - Número de requisições
- **Request latency** - Latência média
- **Container CPU utilization** - Uso de CPU
- **Container memory utilization** - Uso de memória
- **Container instance count** - Número de instâncias ativas
- **Billable instance time** - Tempo cobrado

### 8.3 Alertas

```bash
# Criar alerta para erros
gcloud alpha monitoring policies create \
    --notification-channels=[CHANNEL_ID] \
    --display-name="Cloud Run - Muitos Erros" \
    --condition-display-name="Error rate > 5%" \
    --condition-threshold-value=0.05
```

### 8.4 Uptime Checks

```bash
# Criar uptime check
gcloud monitoring uptime create http avd-uisa-health \
    --resource-type=uptime-url \
    --resource-url=https://avd-uisa-[hash]-uc.a.run.app/health \
    --period=60 \
    --timeout=10s
```

---

## 9. Troubleshooting

### Erro: "Container failed to start"

**Causa**: Aplicação não inicia corretamente

**Solução**:
```bash
# Ver logs de startup
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=avd-uisa AND jsonPayload.message=~'Container'" --limit 50

# Testar localmente
docker run -p 3000:3000 gcr.io/[PROJECT_ID]/avd-uisa:latest

# Verificar variáveis de ambiente
gcloud run services describe avd-uisa --region southamerica-east1 --format yaml
```

### Erro: "Cloud SQL connection failed"

**Causa**: Problema na conexão com Cloud SQL

**Solução**:
```bash
# Verificar VPC connector
gcloud compute networks vpc-access connectors describe avd-connector --region southamerica-east1

# Verificar service account tem permissões
gcloud projects get-iam-policy [PROJECT_ID] --flatten="bindings[].members" --filter="bindings.members:avd-uisa-sa@"

# Testar conexão do container
gcloud run services update avd-uisa --set-env-vars="DEBUG=true"
```

### Erro: "Memory limit exceeded"

**Causa**: Aplicação usa mais memória que alocado

**Solução**:
```bash
# Aumentar memória
gcloud run services update avd-uisa --memory 4Gi

# Ver uso atual
gcloud monitoring read "metric.type=run.googleapis.com/container/memory/utilizations" --limit 10
```

### Erro: "Request timeout"

**Causa**: Requisição demora mais que timeout configurado

**Solução**:
```bash
# Aumentar timeout (max 3600s)
gcloud run services update avd-uisa --timeout 600

# Identificar queries lentas no banco
# Ver GUIA_GOOGLE_CLOUD_SQL.md seção de otimização
```

---

## 10. Custos Estimados

### Calculadora de Custos

**Fórmula**:
```
Custo = (CPU_hours × CPU_price) + (Memory_GB_hours × Memory_price) + (Requests × Request_price)
```

### Cenário: Produção (tráfego médio)

Configuração:
- 2 vCPU, 2 GB RAM
- 1 instância mínima, 10 máximas
- 100.000 requests/mês
- 500ms latência média

**Custos mensais**:
```
CPU: 2 vCPU × 720h × $0.00002400 = $34.56
Memory: 2 GB × 720h × $0.00000250 = $3.60
Requests: 100.000 × $0.40/milhão = $0.04
Networking: ~$1.00
Total: ~$39.20/mês
```

### Cenário: Staging (tráfego baixo)

Configuração:
- 1 vCPU, 1 GB RAM
- 0 instâncias mínimas, 5 máximas
- 10.000 requests/mês

**Custos mensais**:
```
CPU: 1 vCPU × 50h × $0.00002400 = $1.20
Memory: 1 GB × 50h × $0.00000250 = $0.13
Requests: 10.000 × $0.40/milhão = $0.004
Total: ~$1.33/mês
```

### Dicas para Reduzir Custos

1. **Min Instances = 0** em ambientes não-produção
2. **Concurrency alta** (80-100) para reutilizar instâncias
3. **Otimizar startup time** para cold starts mais rápidos
4. **Cache agressivo** para reduzir requisições ao banco
5. **CDN** para servir assets estáticos

---

## 📋 Checklist de Deploy

- [ ] Cloud SQL configurado e acessível
- [ ] Service Account criada com permissões
- [ ] VPC Connector criado
- [ ] Secrets configurados no Secret Manager
- [ ] Dockerfile testado localmente
- [ ] cloudbuild.yaml configurado
- [ ] Trigger no Cloud Build criado
- [ ] Custom domain mapeado (opcional)
- [ ] Monitoring e alertas configurados
- [ ] Backup strategy definida
- [ ] Rollback plan documentado

---

## 🔗 Links Úteis

- **Console Cloud Run**: https://console.cloud.google.com/run
- **Console Cloud Build**: https://console.cloud.google.com/cloud-build
- **Container Registry**: https://console.cloud.google.com/gcr
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager
- **Documentação Cloud Run**: https://cloud.google.com/run/docs
- **Pricing Calculator**: https://cloud.google.com/products/calculator

---

**Próximo**: Após deploy, consulte `GUIA_GOOGLE_CLOUD_SQL.md` para otimizar o banco de dados.
