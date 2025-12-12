#!/bin/bash
# Script para aplicar migrações automaticamente

# Gerar migrações
pnpm drizzle-kit generate --config=drizzle.config.ts

# Aplicar migrações diretamente no banco
pnpm drizzle-kit migrate --config=drizzle.config.ts
