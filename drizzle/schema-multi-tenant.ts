import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  unique,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * ============================================================================
 * MULTI-TENANCY - Sistema de Isolamento por Empresa (Tenant)
 * ============================================================================
 * 
 * Cada empresa (tenant) possui dados completamente isolados.
 * Todas as tabelas principais possuem tenant_id para garantir isolamento.
 * Suporte para até 100 empresas simultâneas.
 */

// Tabela de Tenants (Empresas)
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  code: varchar("code", { length: 50 }).notNull().unique(), // Código único (ex: "UISA", "EMPRESA_2")
  name: varchar("name", { length: 255 }).notNull(), // Nome da empresa
  legalName: varchar("legalName", { length: 255 }), // Razão social
  cnpj: varchar("cnpj", { length: 18 }).unique(), // CNPJ (formatado)
  
  // Configurações
  active: boolean("active").default(true).notNull(),
  settings: json("settings").$type<{
    logo?: string;
    primaryColor?: string;
    timezone?: string;
    language?: string;
    maxEmployees?: number;
    features?: string[]; // Features habilitadas para este tenant
  }>(),
  
  // Limites e Quotas
  maxUsers: int("maxUsers").default(1000).notNull(),
  maxEmployees: int("maxEmployees").default(5000).notNull(),
  
  // Contato
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  
  // Endereço
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  
  // Plano e Billing
  planType: mysqlEnum("planType", ["trial", "basic", "professional", "enterprise"]).default("trial").notNull(),
  trialEndsAt: datetime("trialEndsAt"),
  subscriptionExpiresAt: datetime("subscriptionExpiresAt"),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"), // Usuário que criou o tenant
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// Tabela de Usuários de Tenants (relacionamento muitos-para-muitos)
export const tenantUsers = mysqlTable("tenantUsers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  
  // Role específico para este tenant
  role: mysqlEnum("role", ["super_admin", "admin", "manager", "user"]).default("user").notNull(),
  
  // Permissões específicas
  permissions: json("permissions").$type<string[]>(),
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  // Metadados
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastAccessAt: timestamp("lastAccessAt"),
}, (table) => ({
  // Constraint de unicidade: um usuário não pode estar duplicado no mesmo tenant
  uniqueTenantUser: unique().on(table.tenantId, table.userId),
}));

export type TenantUser = typeof tenantUsers.$inferSelect;
export type InsertTenantUser = typeof tenantUsers.$inferInsert;

// Tabela de Auditoria de Tenants
export const tenantAuditLogs = mysqlTable("tenantAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // "created", "updated", "deleted", "accessed", etc.
  entityType: varchar("entityType", { length: 100 }), // Tipo de entidade afetada
  entityId: int("entityId"), // ID da entidade
  details: json("details"), // Detalhes adicionais da ação
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TenantAuditLog = typeof tenantAuditLogs.$inferSelect;
export type InsertTenantAuditLog = typeof tenantAuditLogs.$inferInsert;

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  tenantUsers: many(tenantUsers),
  auditLogs: many(tenantAuditLogs),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
}));
