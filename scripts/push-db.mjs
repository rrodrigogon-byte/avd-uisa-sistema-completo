import { execSync } from 'child_process';

try {
  console.log('🔄 Aplicando alterações no schema do banco de dados...');
  
  // Executar push com flag --force para não pedir confirmação
  execSync('pnpm drizzle-kit push --force', {
    cwd: '/home/ubuntu/avd-uisa-sistema-completo',
    stdio: 'inherit',
    env: { ...process.env, DRIZZLE_SKIP_CONFIRMATION: 'true' }
  });
  
  console.log('✅ Schema do banco atualizado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao atualizar schema:', error.message);
  process.exit(1);
}
