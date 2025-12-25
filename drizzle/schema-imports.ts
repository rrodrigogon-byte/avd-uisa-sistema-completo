import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Tabela para rastrear importações de dados
 */
export const dataImports = mysqlTable("dataImports", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // Tamanho em bytes
  importType: mysqlEnum("importType", ["employees", "hierarchy", "full"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  
  // Estatísticas da importação
  totalRecords: int("totalRecords").default(0),
  successfulRecords: int("successfulRecords").default(0),
  failedRecords: int("failedRecords").default(0),
  skippedRecords: int("skippedRecords").default(0),
  
  // Detalhes e erros
  summary: json("summary").$type<{
    newEmployees?: number;
    updatedEmployees?: number;
    inactiveEmployees?: number;
    errors?: Array<{ row: number; field: string; message: string }>;
    warnings?: Array<{ row: number; field: string; message: string }>;
  }>(),
  
  errorLog: text("errorLog"), // Log de erros detalhado
  
  // Metadados
  importedBy: int("importedBy").notNull(), // ID do usuário que fez a importação
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DataImport = typeof dataImports.$inferSelect;
export type InsertDataImport = typeof dataImports.$inferInsert;
