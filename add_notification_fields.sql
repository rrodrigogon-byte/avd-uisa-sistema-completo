-- Adicionar campo notified à tabela testResults se não existir
ALTER TABLE testResults 
ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;

-- Adicionar campo reminderSent à tabela testInvitations se não existir
ALTER TABLE testInvitations 
ADD COLUMN IF NOT EXISTS reminderSent BOOLEAN DEFAULT FALSE;
