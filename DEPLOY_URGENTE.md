# 🚨 CORREÇÃO URGENTE - Frontend não está aparecendo

## ❌ Problema

O site https://avd-uisa-sistema-281844763676.southamerica-east1.run.app está mostrando apenas:
```
Sistema AVD UISA Online
```

## 🔍 Causa Raiz

O **Cloud Run está usando uma imagem Docker antiga** que não tem o novo frontend. O código no GitHub está correto, mas o Cloud Run precisa fazer um **rebuild forçado**.

---

## ✅ SOLUÇÃO DEFINITIVA

### Opção 1: Script Automatizado (RECOMENDADO)

Execute este comando no seu terminal local (não no sandbox):

```bash
# 1. Clone o repositório (se ainda não tiver)
git clone https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo.git
cd avd-uisa-sistema-completo

# 2. Execute o script de deploy forçado
./force-deploy.sh
```

O script irá:
1. ✅ Verificar se o frontend existe
2. ✅ Fazer build da imagem Docker (sem cache)
3. ✅ Push para Google Container Registry
4. ✅ Deploy no Cloud Run com nova imagem
5. ✅ Configurar todas as variáveis de ambiente
6. ✅ Testar o health check

---

### Opção 2: Comandos Manuais

Se preferir fazer manualmente, execute estes comandos:

```bash
# 1. Ir para o diretório do projeto
cd avd-uisa-sistema-completo

# 2. Pull das últimas mudanças
git pull origin main

# 3. Verificar se o frontend existe
ls -la client/dist/index.html

# 4. Configurar PROJECT_ID
export PROJECT_ID="seu-project-id"
gcloud config set project $PROJECT_ID

# 5. Build da imagem (SEM CACHE - IMPORTANTE!)
docker build --no-cache --platform linux/amd64 \
  -t gcr.io/$PROJECT_ID/avd-uisa:latest .

# 6. Push para GCR
docker push gcr.io/$PROJECT_ID/avd-uisa:latest

# 7. Deploy no Cloud Run
gcloud run deploy avd-uisa \
  --image gcr.io/$PROJECT_ID/avd-uisa:latest \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 3000 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=mysql://root:SENHA@34.39.223.147:3306/avd_uisa,MULTI_TENANT_ENABLED=true"
```

---

### Opção 3: Cloud Build (Alternativa)

Use o Cloud Build para fazer o deploy:

```bash
# 1. Ir para o diretório
cd avd-uisa-sistema-completo

# 2. Deploy via Cloud Build
gcloud builds submit --tag gcr.io/$PROJECT_ID/avd-uisa

# 3. Deploy no Cloud Run
gcloud run deploy avd-uisa \
  --image gcr.io/$PROJECT_ID/avd-uisa \
  --region southamerica-east1
```

---

## 🎯 O Que Vai Mudar

### ANTES (Atual)
```
Sistema AVD UISA Online
```

### DEPOIS (Após Deploy)
```
╔═══════════════════════════════════════════════════╗
║          🎯 AVD UISA v2.0.0                      ║
║   Sistema de Avaliação de Desempenho            ║
║                                                   ║
║   ┌──────────────────────────────────────┐      ║
║   │  ✅ Sistema Operacional              │      ║
║   │  API conectada e funcionando         │      ║
║   │  Database: connected | Uptime: OK    │      ║
║   └──────────────────────────────────────┘      ║
║                                                   ║
║   [Health Check] [API Info] [System Status]     ║
║   [Dashboard Metrics]                            ║
║                                                   ║
║   📊 3.114        📊 622         📊 26          ║
║   Funcionários    Usuários       Tabelas        ║
║                                                   ║
║   🚀 Deployed no Google Cloud Run               ║
║   🔐 Multi-tenancy | 125+ Routers | 500+ API    ║
╚═══════════════════════════════════════════════════╝
```

---

## 📝 Checklist de Verificação

Antes de fazer o deploy, verifique:

- [ ] Git pull feito (última versão)
- [ ] Arquivo `client/dist/index.html` existe
- [ ] Docker está rodando
- [ ] gcloud configurado com PROJECT_ID correto
- [ ] DATABASE_URL configurada
- [ ] Permissões no GCP (Cloud Run Admin, Storage Admin)

---

## 🔧 Troubleshooting

### Problema: "client/dist/index.html não encontrado"

**Solução:**
```bash
git pull origin main
ls -la client/dist/index.html
```

Se não aparecer, rode:
```bash
mkdir -p client/dist
git checkout origin/main -- client/dist/index.html
```

---

### Problema: "Permission denied no Docker"

**Solução:**
```bash
sudo docker build ...
# ou
sudo usermod -aG docker $USER
# (depois fazer logout/login)
```

---

### Problema: "gcloud: command not found"

**Solução:**
Instale o Google Cloud SDK:
```bash
# Linux/Mac
curl https://sdk.cloud.google.com | bash

# Depois configure
gcloud init
gcloud auth login
```

---

### Problema: "Build falhou - out of memory"

**Solução:**
O build está configurado para usar apenas backend build (sem Vite). O frontend já está pronto em `client/dist/`.

Se continuar falhando, edite o Dockerfile e remova a linha do `pnpm build`.

---

### Problema: "Deploy concluído mas ainda mostra texto simples"

**Solução:**
Aguarde 2-3 minutos e faça um hard refresh:
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

Se ainda não funcionar:
```bash
# Force uma nova revisão no Cloud Run
gcloud run services update avd-uisa \
  --region southamerica-east1 \
  --update-env-vars "FORCE_UPDATE=$(date +%s)"
```

---

## 🎯 Resultado Esperado

Após o deploy bem-sucedido:

1. **Página Visual Completa**
   - Design moderno com gradiente roxo
   - Dashboard interativo
   - Estatísticas em tempo real

2. **Botões Funcionais**
   - Health Check → `/health`
   - API Info → `/api`
   - System Status → `/api/status`
   - Dashboard Metrics → `/api/dashboard/metrics`

3. **API Funcionando**
   - 125+ routers tRPC
   - 500+ endpoints
   - Multi-tenancy ativo
   - Banco de dados conectado

---

## 📊 Validação Pós-Deploy

Execute estes testes para validar:

```bash
# 1. Health Check
curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/health

# 2. API Info
curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/api

# 3. System Status
curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/api/status

# 4. Dashboard Metrics
curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/api/dashboard/metrics
```

Todos devem retornar JSON válido.

---

## 🚀 Ação Imediata

**EXECUTE AGORA:**

```bash
cd avd-uisa-sistema-completo
./force-deploy.sh
```

Ou, se preferir manual:

```bash
git pull origin main
docker build --no-cache -t gcr.io/PROJECT_ID/avd-uisa:latest .
docker push gcr.io/PROJECT_ID/avd-uisa:latest
gcloud run deploy avd-uisa --image gcr.io/PROJECT_ID/avd-uisa:latest
```

---

## 📞 Suporte

Se o problema persistir:

1. Verifique os logs do Cloud Run:
```bash
gcloud run services logs read avd-uisa --region southamerica-east1
```

2. Verifique a revisão atual:
```bash
gcloud run services describe avd-uisa --region southamerica-east1
```

3. Liste as imagens no GCR:
```bash
gcloud container images list --repository=gcr.io/PROJECT_ID
```

---

**Data**: 08/01/2026  
**Status**: 🔴 REQUER AÇÃO IMEDIATA  
**Prioridade**: ALTA  
**Ação**: Execute `./force-deploy.sh` AGORA
