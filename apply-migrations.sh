#!/bin/bash

# Script para aplicar migrations automaticamente
# Responde "create table" para todas as perguntas

cd /home/ubuntu/avd-uisa-sistema-completo

# Gerar migrations respondendo automaticamente com Enter (primeira opção)
yes "" | pnpm drizzle-kit generate 2>&1

echo "Migrations geradas com sucesso!"

# Aplicar migrations
pnpm drizzle-kit migrate 2>&1

echo "Migrations aplicadas com sucesso!"
