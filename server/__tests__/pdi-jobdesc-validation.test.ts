import { describe, it, expect } from 'vitest';

/**
 * Teste de validação das rotas e procedures de PDI e Job Descriptions
 * Valida que todos os componentes necessários estão implementados
 */

describe('PDI e Job Descriptions - Validação de Implementação', () => {
  describe('PDI Router', () => {
    it('deve ter todas as procedures principais implementadas', () => {
      const requiredProcedures = ['list', 'getById', 'create', 'update', 'delete'];
      const pdiRouterPath = '/home/ubuntu/avd-uisa-sistema-completo/server/routers/pdiRouter.ts';
      
      // Verificar que o arquivo existe
      const fs = require('fs');
      expect(fs.existsSync(pdiRouterPath)).toBe(true);
      
      // Ler conteúdo do arquivo
      const content = fs.readFileSync(pdiRouterPath, 'utf-8');
      
      // Verificar que todas as procedures estão presentes
      requiredProcedures.forEach(proc => {
        expect(content).toContain(`${proc}:`);
      });
    });

    it('deve exportar pdiRouter corretamente', () => {
      const fs = require('fs');
      const pdiRouterPath = '/home/ubuntu/avd-uisa-sistema-completo/server/routers/pdiRouter.ts';
      const content = fs.readFileSync(pdiRouterPath, 'utf-8');
      
      expect(content).toContain('export const pdiRouter');
      expect(content).toContain('router({');
    });
  });

  describe('Job Descriptions Router', () => {
    it('deve ter todas as procedures principais implementadas', () => {
      const requiredProcedures = ['list', 'getById', 'create', 'update', 'approve', 'reject'];
      const jobDescRouterPath = '/home/ubuntu/avd-uisa-sistema-completo/server/routers/jobDescriptionsRouter.ts';
      
      const fs = require('fs');
      expect(fs.existsSync(jobDescRouterPath)).toBe(true);
      
      const content = fs.readFileSync(jobDescRouterPath, 'utf-8');
      
      requiredProcedures.forEach(proc => {
        expect(content).toContain(`${proc}:`);
      });
    });

    it('deve exportar jobDescriptionsRouter corretamente', () => {
      const fs = require('fs');
      const jobDescRouterPath = '/home/ubuntu/avd-uisa-sistema-completo/server/routers/jobDescriptionsRouter.ts';
      const content = fs.readFileSync(jobDescRouterPath, 'utf-8');
      
      expect(content).toContain('export const jobDescriptionsRouter');
      expect(content).toContain('router({');
    });
  });

  describe('Rotas Frontend', () => {
    it('deve ter rotas de PDI registradas no App.tsx', () => {
      const fs = require('fs');
      const appPath = '/home/ubuntu/avd-uisa-sistema-completo/client/src/App.tsx';
      const content = fs.readFileSync(appPath, 'utf-8');
      
      const requiredRoutes = [
        '/pdi/visualizar/:id',
        '/pdi/editar/:id',
        '/pdi/criar'
      ];
      
      requiredRoutes.forEach(route => {
        expect(content).toContain(route);
      });
    });

    it('deve ter rotas de Job Descriptions UISA registradas no App.tsx', () => {
      const fs = require('fs');
      const appPath = '/home/ubuntu/avd-uisa-sistema-completo/client/src/App.tsx';
      const content = fs.readFileSync(appPath, 'utf-8');
      
      const requiredRoutes = [
        '/descricao-cargos-uisa',
        '/descricao-cargos-uisa/criar',
        '/descricao-cargos-uisa/:id'
      ];
      
      requiredRoutes.forEach(route => {
        expect(content).toContain(route);
      });
    });
  });

  describe('Componentes Frontend', () => {
    it('deve ter componente PDIVisualizar implementado', () => {
      const fs = require('fs');
      const componentPath = '/home/ubuntu/avd-uisa-sistema-completo/client/src/pages/PDIVisualizar.tsx';
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('export default function PDIVisualizar');
      expect(content).toContain('trpc.pdi.getById.useQuery');
    });

    it('deve ter componente DescricaoCargosUISA implementado', () => {
      const fs = require('fs');
      const componentPath = '/home/ubuntu/avd-uisa-sistema-completo/client/src/pages/DescricaoCargosUISA.tsx';
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('export default function DescricaoCargosUISA');
      expect(content).toContain('trpc.jobDescriptions.list.useQuery');
    });

    it('deve ter componente CriarDescricaoCargo implementado', () => {
      const fs = require('fs');
      const componentPath = '/home/ubuntu/avd-uisa-sistema-completo/client/src/pages/CriarDescricaoCargo.tsx';
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    it('deve ter componente DetalhesDescricaoCargo implementado', () => {
      const fs = require('fs');
      const componentPath = '/home/ubuntu/avd-uisa-sistema-completo/client/src/pages/DetalhesDescricaoCargo.tsx';
      expect(fs.existsSync(componentPath)).toBe(true);
    });
  });

  describe('Routers Registrados', () => {
    it('deve ter pdiRouter registrado no routers.ts principal', () => {
      const fs = require('fs');
      const routersPath = '/home/ubuntu/avd-uisa-sistema-completo/server/routers.ts';
      const content = fs.readFileSync(routersPath, 'utf-8');
      
      expect(content).toContain("import { pdiRouter }");
      expect(content).toContain("pdi:");
    });

    it('deve ter jobDescriptionsRouter registrado no routers.ts principal', () => {
      const fs = require('fs');
      const routersPath = '/home/ubuntu/avd-uisa-sistema-completo/server/routers.ts';
      const content = fs.readFileSync(routersPath, 'utf-8');
      
      expect(content).toContain("import { jobDescriptionsRouter }");
      expect(content).toContain("jobDescriptions:");
    });
  });

  describe('Schema do Banco de Dados', () => {
    it('deve ter tabelas PDI no schema', () => {
      const fs = require('fs');
      const schemaPath = '/home/ubuntu/avd-uisa-sistema-completo/drizzle/schema.ts';
      const content = fs.readFileSync(schemaPath, 'utf-8');
      
      const requiredTables = ['pdiPlans', 'pdiKpis', 'pdiActionPlan702010', 'pdiTimeline'];
      
      requiredTables.forEach(table => {
        expect(content).toContain(`export const ${table}`);
      });
    });

    it('deve ter tabelas Job Descriptions no schema', () => {
      const fs = require('fs');
      const schemaPath = '/home/ubuntu/avd-uisa-sistema-completo/drizzle/schema.ts';
      const content = fs.readFileSync(schemaPath, 'utf-8');
      
      const requiredTables = ['jobDescriptions', 'jobResponsibilities', 'jobKnowledge', 'jobCompetencies'];
      
      requiredTables.forEach(table => {
        expect(content).toContain(`export const ${table}`);
      });
    });
  });
});
