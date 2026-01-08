import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupWebSocket } from "../websocket";
import { startCronJobs } from "../cron";
import { startEmailQueueProcessor } from "./emailQueue";
import { startEmailScheduler } from "./emailScheduler";
import { startDailyNotificationJob } from "../jobs/pirIntegrityNotifications";
import { getDb } from "../db";

// ============================================================================
// AVD UISA Sistema Completo - Server Entry Point
// ============================================================================
// 
// Sistema de Avaliação de Desempenho com Multi-tenancy
// Features:
// - Dashboard Analytics
// - Multi-tenant Architecture
// - WebSocket real-time updates
// - Cron jobs automáticos
// - Email queue
// - OAuth authentication
// 
// ============================================================================

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Middleware de Multi-tenancy
 * Extrai tenant_id do header ou subdomain
 */
function multiTenantMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Opção 1: Via header (API calls)
  const tenantIdFromHeader = req.headers['x-tenant-id'];
  
  // Opção 2: Via subdomain (ex: uisa.avd-uisa.com.br)
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  
  // Opção 3: Via query parameter (fallback)
  const tenantIdFromQuery = req.query.tenant_id;
  
  // Definir tenant_id (prioridade: header > subdomain > query > default)
  let tenantId = tenantIdFromHeader || tenantIdFromQuery || '1'; // Default: UISA
  
  // Se subdomain não for localhost, www, ou api, usar como tenant
  if (subdomain && !['localhost', 'www', 'api', 'admin'].includes(subdomain)) {
    // Aqui você pode fazer lookup no banco para encontrar tenant_id pelo código
    // Por enquanto, usamos default
  }
  
  // Adicionar tenant_id ao request
  (req as any).tenantId = tenantId;
  
  next();
}

/**
 * Middleware de logging de requisições
 */
function requestLogger(req: express.Request, res: express.Response, next: express.NextFunction) {
  const start = Date.now();
  const tenantId = (req as any).tenantId || 'unknown';
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      tenant: tenantId,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 50),
    };
    
    // Log apenas em desenvolvimento ou erros
    if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
      console.log('[Request]', JSON.stringify(logData));
    }
  });
  
  next();
}

/**
 * Health check endpoint
 */
function setupHealthCheck(app: express.Application) {
  app.get('/health', async (req, res) => {
    try {
      const db = await getDb();
      
      // Testar conexão com banco
      let dbStatus = 'disconnected';
      let employeeCount = 0;
      
      if (db) {
        try {
          const result = await db.execute('SELECT COUNT(*) as count FROM employees');
          const rows = result as any[];
          employeeCount = rows[0]?.count || 0;
          dbStatus = 'connected';
        } catch (err) {
          dbStatus = 'error';
          console.error('[Health] Database error:', err);
        }
      }
      
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0',
        database: {
          status: dbStatus,
          employees: employeeCount,
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        multiTenant: {
          enabled: process.env.MULTI_TENANT_ENABLED === 'true',
          defaultTenant: 'UISA',
        },
      };
      
      res.status(200).json(health);
    } catch (error) {
      console.error('[Health] Error:', error);
      res.status(503).json({
        status: 'error',
        message: 'Service temporarily unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  });
}

/**
 * Sistema de rotas públicas (sem autenticação)
 */
function setupPublicRoutes(app: express.Application) {
  // Rota de boas-vindas (API info)
  app.get('/api', (req, res) => {
    res.json({
      name: 'AVD UISA API',
      version: '2.0.0',
      description: 'Sistema de Avaliação de Desempenho',
      endpoints: {
        health: '/health',
        trpc: '/api/trpc/*',
        oauth: '/api/oauth/*',
        docs: '/api/docs',
      },
      multiTenant: {
        enabled: process.env.MULTI_TENANT_ENABLED === 'true',
        header: 'x-tenant-id',
      },
      status: 'operational',
    });
  });
  
  // Rota de documentação da API
  app.get('/api/docs', (req, res) => {
    res.json({
      title: 'AVD UISA API Documentation',
      version: '2.0.0',
      baseUrl: req.protocol + '://' + req.get('host'),
      authentication: {
        type: 'OAuth 2.0',
        endpoints: {
          authorize: '/api/oauth/authorize',
          callback: '/api/oauth/callback',
          token: '/api/oauth/token',
        },
      },
      multiTenancy: {
        description: 'Sistema suporta múltiplos tenants (empresas)',
        header: 'x-tenant-id',
        default: '1 (UISA)',
        example: 'curl -H "x-tenant-id: 1" https://api.example.com/api/trpc/...',
      },
      endpoints: [
        {
          path: '/api/trpc/employees.getAll',
          method: 'GET',
          description: 'Listar todos os funcionários do tenant',
          auth: 'required',
        },
        {
          path: '/api/trpc/dashboard.getStats',
          method: 'GET',
          description: 'Obter estatísticas do dashboard',
          auth: 'required',
        },
        {
          path: '/api/trpc/evaluations.getByEmployee',
          method: 'GET',
          description: 'Obter avaliações de um funcionário',
          auth: 'required',
        },
      ],
      database: {
        employees: '3.114 registros',
        users: '622 registros',
        tenants: 'Multi-tenant ativo',
      },
    });
  });
  
  // Rota de status do sistema
  app.get('/api/status', async (req, res) => {
    try {
      const db = await getDb();
      let stats = {
        employees: 0,
        users: 0,
        tenants: 0,
      };
      
      if (db) {
        try {
          const [empResult] = await Promise.all([
            db.execute('SELECT COUNT(*) as count FROM employees'),
          ]);
          
          const empRows = empResult as any[];
          stats.employees = empRows[0]?.count || 0;
        } catch (err) {
          console.error('[Status] Database error:', err);
        }
      }
      
      res.json({
        system: 'AVD UISA',
        version: '2.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        cloud: {
          provider: 'Google Cloud Run',
          region: 'southamerica-east1',
          url: 'https://avd-uisa-sistema-281844763676.southamerica-east1.run.app',
        },
        database: {
          status: db ? 'connected' : 'disconnected',
          host: '34.39.223.147:3306',
          database: 'avd_uisa',
        },
        statistics: stats,
        features: {
          multiTenancy: true,
          websocket: true,
          cronJobs: true,
          emailQueue: true,
          oauth: true,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch system status',
      });
    }
  });
}

/**
 * Dashboard Analytics Routes
 */
function setupDashboardRoutes(app: express.Application) {
  // Rota de métricas agregadas do dashboard
  app.get('/api/dashboard/metrics', async (req, res) => {
    try {
      const tenantId = (req as any).tenantId || '1';
      const db = await getDb();
      
      if (!db) {
        return res.status(503).json({ error: 'Database unavailable' });
      }
      
      // Query otimizada para buscar todas as métricas de uma vez
      const [employeeCount] = await db.execute(
        'SELECT COUNT(*) as count FROM employees WHERE status = "ativo"'
      ) as any[];
      
      const [userCount] = await db.execute(
        'SELECT COUNT(*) as count FROM users'
      ) as any[];
      
      const metrics = {
        tenantId,
        employees: {
          total: employeeCount[0]?.count || 0,
          active: employeeCount[0]?.count || 0,
        },
        users: {
          total: userCount[0]?.count || 0,
        },
        evaluations: {
          pending: 0, // TODO: implementar query
          completed: 0,
        },
        timestamp: new Date().toISOString(),
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('[Dashboard] Error fetching metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });
}

/**
 * Middleware de tratamento de erros global
 */
function setupErrorHandling(app: express.Application) {
  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.url} not found`,
      availableRoutes: [
        'GET /health',
        'GET /api',
        'GET /api/status',
        'GET /api/docs',
        'GET /api/dashboard/metrics',
        'POST /api/trpc/*',
      ],
    });
  });
  
  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Error]', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
    
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  console.log('\n🚀 Iniciando AVD UISA Sistema v2.0.0...\n');
  
  // ============================================================================
  // Middlewares Globais
  // ============================================================================
  
  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Body parser com limite maior para uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Request logging
  app.use(requestLogger);
  
  // Multi-tenancy middleware
  app.use(multiTenantMiddleware);
  
  // ============================================================================
  // Rotas Públicas (sem autenticação)
  // ============================================================================
  
  setupHealthCheck(app);
  setupPublicRoutes(app);
  setupDashboardRoutes(app);
  
  // ============================================================================
  // WebSocket Setup
  // ============================================================================
  
  const io = setupWebSocket(server);
  app.set('io', io);
  console.log('✅ WebSocket configurado');
  
  // ============================================================================
  // OAuth Routes
  // ============================================================================
  
  registerOAuthRoutes(app);
  console.log('✅ OAuth routes registradas');
  
  // ============================================================================
  // tRPC API
  // ============================================================================
  
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, type, path, input }) => {
        console.error('[tRPC Error]', {
          type,
          path,
          input,
          error: {
            message: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          },
        });
      },
    })
  );
  console.log('✅ tRPC API configurada');
  
  // ============================================================================
  // Frontend (Vite dev ou static)
  // ============================================================================
  
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
    console.log('✅ Vite dev server configurado');
  } else {
    serveStatic(app);
    console.log('✅ Static files servidos');
  }
  
  // ============================================================================
  // Error Handling
  // ============================================================================
  
  setupErrorHandling(app);
  
  // ============================================================================
  // Start Server
  // ============================================================================
  
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`⚠️  Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 AVD UISA Sistema v2.0.0 - SERVIDOR INICIADO');
    console.log('='.repeat(60));
    console.log('\n📊 Informações do Servidor:');
    console.log(`   🌐 URL Local:     http://localhost:${port}`);
    console.log(`   🌐 URL Produção:  https://avd-uisa-sistema-281844763676.southamerica-east1.run.app`);
    console.log(`   📡 Ambiente:      ${process.env.NODE_ENV || 'development'}`);
    console.log(`   🗄️  Banco:         34.39.223.147:3306/avd_uisa`);
    console.log(`   🏢 Multi-tenant:  ${process.env.MULTI_TENANT_ENABLED === 'true' ? 'Ativo' : 'Desativado'}`);
    console.log('\n📋 Endpoints Disponíveis:');
    console.log('   GET  /health                    → Health check');
    console.log('   GET  /api                       → API info');
    console.log('   GET  /api/status                → System status');
    console.log('   GET  /api/docs                  → API documentation');
    console.log('   GET  /api/dashboard/metrics     → Dashboard metrics');
    console.log('   POST /api/trpc/*                → tRPC endpoints');
    console.log('   GET  /api/oauth/*               → OAuth routes');
    console.log('\n' + '='.repeat(60) + '\n');
    
    // ============================================================================
    // Background Jobs
    // ============================================================================
    
    // Iniciar cron jobs
    startCronJobs();
    console.log('✅ Cron jobs iniciados');
    
    // Iniciar processador de fila de e-mails
    startEmailQueueProcessor();
    console.log('✅ Email queue processor iniciado');
    
    // Iniciar agendador de emails automáticos
    startEmailScheduler();
    console.log('✅ Email scheduler iniciado');
    
    // Iniciar job de notificações PIR Integridade
    startDailyNotificationJob();
    console.log('✅ PIR notifications job iniciado');
    
    console.log('\n✨ Sistema pronto para receber requisições!\n');
  });
  
  // ============================================================================
  // Graceful Shutdown
  // ============================================================================
  
  process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM recebido, encerrando servidor gracefully...');
    server.close(() => {
      console.log('✅ Servidor encerrado');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT recebido, encerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor encerrado');
      process.exit(0);
    });
  });
}

// ============================================================================
// Start Application
// ============================================================================

startServer().catch((error) => {
  console.error('❌ Erro fatal ao iniciar servidor:', error);
  process.exit(1);
});
