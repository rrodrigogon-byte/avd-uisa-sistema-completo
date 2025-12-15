import axios from "axios";

// TOTVS RM API Configuration
const TOTVS_CONFIG = {
  baseURL: process.env.TOTVS_RM_BASE_URL || "https://api.totvs.com.br/rm",
  appKey: process.env.TOTVS_RM_APP_KEY || "",
  appSecret: process.env.TOTVS_RM_APP_SECRET || "",
  tenant: process.env.TOTVS_RM_TENANT || "",
};

interface TotvsEmployee {
  CHAPA: string; // Employee ID
  NOME: string; // Name
  CPF: string; // CPF
  EMAIL: string; // Email
  CODSECAO: string; // Department code
  SECAO: string; // Department name
  CODFUNCAO: string; // Position code
  FUNCAO: string; // Position title
  DATAADMISSAO: string; // Admission date
  SITUACAO: string; // Status (A=Active, D=Dismissed)
}

interface TotvsDepartment {
  CODIGO: string;
  DESCRICAO: string;
  CODCOLIGADA: number;
}

interface TotvsPosition {
  CODIGO: string;
  NOME: string;
  CODCOLIGADA: number;
}

class TotvsIntegrationService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Authenticate with TOTVS RM API
   */
  private async authenticate(): Promise<string> {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      const response = await axios.post(
        `${TOTVS_CONFIG.baseURL}/oauth/token`,
        {
          grant_type: "client_credentials",
          client_id: TOTVS_CONFIG.appKey,
          client_secret: TOTVS_CONFIG.appSecret,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token || null;
      // Token expires in 1 hour (3600 seconds)
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);

      console.log("[TOTVS] Authentication successful");
      return this.accessToken!;
    } catch (error) {
      console.error("[TOTVS] Authentication failed:", error);
      throw new Error("Failed to authenticate with TOTVS RM");
    }
  }

  /**
   * Make authenticated request to TOTVS API
   */
  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const token = await this.authenticate();

    try {
      const response = await axios.get(`${TOTVS_CONFIG.baseURL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          ...params,
          tenant: TOTVS_CONFIG.tenant,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`[TOTVS] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Sync employees from TOTVS RM
   */
  async syncEmployees(): Promise<{
    success: boolean;
    synced: number;
    errors: number;
    details: any[];
  }> {
    console.log("[TOTVS] Starting employee sync...");

    try {
      // Fetch employees from TOTVS
      const employees = await this.request<TotvsEmployee[]>("/api/framework/v1/funcionarios", {
        $filter: "SITUACAO eq 'A'", // Only active employees
      });

      console.log(`[TOTVS] Found ${employees.length} active employees`);

      const results = {
        success: true,
        synced: 0,
        errors: 0,
        details: [] as any[],
      };

      // Process each employee
      for (const emp of employees) {
        try {
          // Map TOTVS data to AVD format
          const employeeData = {
            externalId: emp.CHAPA,
            name: emp.NOME,
            cpf: emp.CPF,
            email: emp.EMAIL,
            departmentCode: emp.CODSECAO,
            departmentName: emp.SECAO,
            positionCode: emp.CODFUNCAO,
            positionTitle: emp.FUNCAO,
            admissionDate: new Date(emp.DATAADMISSAO),
            status: emp.SITUACAO === "A" ? "active" : "inactive",
          };

          // TODO: Call AVD API to upsert employee
          // await db.upsertEmployee(employeeData);

          results.synced++;
          results.details.push({
            id: emp.CHAPA,
            name: emp.NOME,
            status: "synced",
          });
        } catch (error) {
          console.error(`[TOTVS] Error syncing employee ${emp.CHAPA}:`, error);
          results.errors++;
          results.details.push({
            id: emp.CHAPA,
            name: emp.NOME,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      console.log(
        `[TOTVS] Employee sync completed: ${results.synced} synced, ${results.errors} errors`
      );

      return results;
    } catch (error) {
      console.error("[TOTVS] Employee sync failed:", error);
      return {
        success: false,
        synced: 0,
        errors: 1,
        details: [
          {
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
  }

  /**
   * Sync departments from TOTVS RM
   */
  async syncDepartments(): Promise<{
    success: boolean;
    synced: number;
    errors: number;
  }> {
    console.log("[TOTVS] Starting department sync...");

    try {
      const departments = await this.request<TotvsDepartment[]>(
        "/api/framework/v1/secoes"
      );

      console.log(`[TOTVS] Found ${departments.length} departments`);

      let synced = 0;
      let errors = 0;

      for (const dept of departments) {
        try {
          // TODO: Call AVD API to upsert department
          // await db.upsertDepartment({
          //   externalId: dept.CODIGO,
          //   name: dept.DESCRICAO,
          // });

          synced++;
        } catch (error) {
          console.error(`[TOTVS] Error syncing department ${dept.CODIGO}:`, error);
          errors++;
        }
      }

      console.log(`[TOTVS] Department sync completed: ${synced} synced, ${errors} errors`);

      return { success: true, synced, errors };
    } catch (error) {
      console.error("[TOTVS] Department sync failed:", error);
      return { success: false, synced: 0, errors: 1 };
    }
  }

  /**
   * Sync positions from TOTVS RM
   */
  async syncPositions(): Promise<{
    success: boolean;
    synced: number;
    errors: number;
  }> {
    console.log("[TOTVS] Starting position sync...");

    try {
      const positions = await this.request<TotvsPosition[]>(
        "/api/framework/v1/funcoes"
      );

      console.log(`[TOTVS] Found ${positions.length} positions`);

      let synced = 0;
      let errors = 0;

      for (const pos of positions) {
        try {
          // TODO: Call AVD API to upsert position
          // await db.upsertPosition({
          //   externalId: pos.CODIGO,
          //   title: pos.NOME,
          // });

          synced++;
        } catch (error) {
          console.error(`[TOTVS] Error syncing position ${pos.CODIGO}:`, error);
          errors++;
        }
      }

      console.log(`[TOTVS] Position sync completed: ${synced} synced, ${errors} errors`);

      return { success: true, synced, errors };
    } catch (error) {
      console.error("[TOTVS] Position sync failed:", error);
      return { success: false, synced: 0, errors: 1 };
    }
  }

  /**
   * Full sync: departments, positions, and employees
   */
  async fullSync(): Promise<{
    success: boolean;
    departments: { synced: number; errors: number };
    positions: { synced: number; errors: number };
    employees: { synced: number; errors: number };
    duration: number;
  }> {
    const startTime = Date.now();
    console.log("[TOTVS] Starting full sync...");

    try {
      // Sync in order: departments → positions → employees
      const deptResult = await this.syncDepartments();
      const posResult = await this.syncPositions();
      const empResult = await this.syncEmployees();

      const duration = Date.now() - startTime;

      console.log(`[TOTVS] Full sync completed in ${duration}ms`);

      return {
        success: true,
        departments: { synced: deptResult.synced, errors: deptResult.errors },
        positions: { synced: posResult.synced, errors: posResult.errors },
        employees: { synced: empResult.synced, errors: empResult.errors },
        duration,
      };
    } catch (error) {
      console.error("[TOTVS] Full sync failed:", error);
      return {
        success: false,
        departments: { synced: 0, errors: 0 },
        positions: { synced: 0, errors: 0 },
        employees: { synced: 0, errors: 0 },
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Test connection to TOTVS RM
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticate();
      return {
        success: true,
        message: "Connection to TOTVS RM successful",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}

// Export singleton instance
export const totvsIntegration = new TotvsIntegrationService();

// Export types
export type { TotvsEmployee, TotvsDepartment, TotvsPosition };
