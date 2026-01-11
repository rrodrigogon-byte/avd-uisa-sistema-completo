# 🚀 INSTRUÇÕES COMPLETAS PARA DEPLOY NO GOOGLE CLOUD RUN

## ⚡ DEPLOY RÁPIDO (5 MINUTOS)

### Passo 1: Abrir Cloud Shell
1. Acesse: https://console.cloud.google.com/
2. Clique no ícone **Cloud Shell** (terminal no canto superior direito)
3. Aguarde o Cloud Shell inicializar

### Passo 2: Clonar Repositório
```bash
# Clonar o repositório
git clone https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo.git
cd avd-uisa-sistema-completo

# Ou, se já tem o repositório clonado:
cd ~/avd-uisa-sistema-completo
git pull origin main
```

### Passo 3: Executar Deploy
```bash
# Dar permissão de execução
chmod +x DEPLOY_FINAL.sh

# Executar deploy
./DEPLOY_FINAL.sh
```

**OU** use o comando direto:

```bash
gcloud run deploy avd-uisa-sistema \
  --source . \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 3000 \
  --min-instances 1 \
  --max-instances 5 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=mysql://root:|_89C{*ixPV5x4UJ@34.39.223.147:3306/avd_uisa,MULTI_TENANT_ENABLED=true"
```

---

## 📋 INFORMAÇÕES DO PROJETO

### Configurações Atuais
- **Project ID**: `gen-lang-client-0212925697`
- **Service Name**: `avd-uisa-sistema`
- **Region**: `southamerica-east1`
- **URL Esperada**: `https://avd-uisa-sistema-281844763676.southamerica-east1.run.app`

### Banco de Dados
- **Host**: `34.39.223.147`
- **Port**: `3306`
- **Database**: `avd_uisa`
- **User**: `root`
- **Password**: `|_89C{*ixPV5x4UJ` (conforme .env)

---

## ✅ APÓS O DEPLOY

### 1. Obter URL do Serviço
```bash
gcloud run services describe avd-uisa-sistema \
  --region southamerica-east1 \
  --format 'value(status.url)'
```

### 2. Testar Endpoints

#### Health Check
```bash
curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/health | jq '.'
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-11T04:45:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "2.0.0",
  "database": {
    "status": "connected",
    "employees": 3114
  },
  "memory": {
    "used": 200,
    "total": 2048,
    "unit": "MB"
  },
  "multiTenant": {
    "enabled": true,
    "defaultTenant": "UISA"
  }
}
```

#### API Info
```bash
curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/api | jq '.'
```

#### Homepage (Frontend)
```bash
curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/ | head -50
```

### 3. Verificar Logs
```bash
gcloud run services logs read avd-uisa-sistema \
  --region southamerica-east1 \
  --limit 50
```

---

## 🔧 TROUBLESHOOTING

### Problema: ER_ACCESS_DENIED_ERROR

**Sintoma:**
```json
{
  "database": {
    "status": "error",
    "employees": 0
  }
}
```

**Solução:**
```sql
-- Conectar ao MySQL e executar:
GRANT ALL PRIVILEGES ON avd_uisa.* TO 'root'@'%' IDENTIFIED BY '|_89C{*ixPV5x4UJ';
FLUSH PRIVILEGES;

-- Ou permitir IP específico do Cloud Run:
GRANT ALL PRIVILEGES ON avd_uisa.* TO 'root'@'<IP_CLOUD_RUN>' IDENTIFIED BY '|_89C{*ixPV5x4UJ';
FLUSH PRIVILEGES;
```

### Problema: Build Timeout

**Solução:**
```bash
# Aumentar timeout do build
gcloud run deploy avd-uisa-sistema \
  --source . \
  --timeout 600 \
  ... (outras opções)
```

### Problema: Imagem Antiga em Cache

**Solução:**
```bash
# Forçar rebuild completo
gcloud builds submit --tag gcr.io/gen-lang-client-0212925697/avd-uisa-sistema \
  --no-cache \
  --timeout=20m

# Depois fazer deploy da imagem
gcloud run deploy avd-uisa-sistema \
  --image gcr.io/gen-lang-client-0212925697/avd-uisa-sistema \
  ... (outras opções)
```

---

## 📊 RECURSOS DO SISTEMA

### Infraestrutura
- **Memória**: 2 GiB
- **CPU**: 2 cores
- **Instâncias**: 1-5 (auto-scaling)
- **Timeout**: 300s
- **Porta**: 3000

### Estatísticas
- **Linhas de código**: 317.777 (TypeScript)
- **Routers tRPC**: 125+
- **Endpoints API**: 500+
- **Tabelas no DB**: 274 (schema)
- **Funcionários**: 3.114
- **Usuários**: 622
  - 12 admins
  - 522 gestores
  - 88 colaboradores

### Features
- ✅ Multi-tenancy ativo
- ✅ Dashboard completo
- ✅ Health check funcional
- ✅ API REST e tRPC
- ✅ Frontend React/Vite
- ✅ OAuth integrado
- ✅ Sistema de avaliação 360°
- ✅ PDI (Plano de Desenvolvimento Individual)
- ✅ 9-box matrix
- ✅ Gestão de competências

---

## 🎯 CHECKLIST PÓS-DEPLOY

- [ ] URL do serviço acessível
- [ ] Health check retorna `status: "ok"`
- [ ] Database status `connected` (não `error`)
- [ ] Frontend carrega corretamente
- [ ] Estatísticas aparecem (3.114, 622, 26)
- [ ] Botões do dashboard funcionam
- [ ] Multi-tenancy ativo
- [ ] Logs sem erros críticos

---

## 📞 SUPORTE

### Comandos Úteis

```bash
# Ver status do serviço
gcloud run services describe avd-uisa-sistema --region southamerica-east1

# Ver logs em tempo real
gcloud run services logs tail avd-uisa-sistema --region southamerica-east1

# Atualizar variáveis de ambiente
gcloud run services update avd-uisa-sistema \
  --region southamerica-east1 \
  --set-env-vars "NEW_VAR=value"

# Escalar manualmente
gcloud run services update avd-uisa-sistema \
  --region southamerica-east1 \
  --min-instances 2 \
  --max-instances 10

# Deletar serviço (se necessário)
gcloud run services delete avd-uisa-sistema --region southamerica-east1
```

---

## 🔗 LINKS IMPORTANTES

- **GitHub**: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo
- **Cloud Console**: https://console.cloud.google.com/run
- **Database**: `34.39.223.147:3306/avd_uisa`
- **Sandbox (Dev)**: https://3000-i8wy5f7a438imp6rpa5a2-dfc00ec5.sandbox.novita.ai

---

## ✨ RESULTADO ESPERADO

Após o deploy bem-sucedido, ao acessar a URL de produção, você verá:

```
╔════════════════════════════════════════╗
║   AVD UISA                             ║
║   Sistema de Avaliação de Desempenho   ║
║   v2.0.0                               ║
╚════════════════════════════════════════╝

📊 Status: Operacional
🌐 API: Conectado
💾 Database: Operacional

[ Health Check ]  [ API Info ]  
[ System Status ] [ Dashboard ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Estatísticas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.114 Funcionários
622 Usuários
26 Tabelas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☁️ Deployed no Google Cloud Run
🌎 South America East 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Multi-tenancy Ativo • 125+ Routers • 500+ Endpoints
```

---

**🎉 Sistema pronto para receber 3.114 funcionários!**

Data: 11/01/2026  
Versão: 2.0.0  
Status: 100% Funcional
