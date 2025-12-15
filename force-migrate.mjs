import { execSync } from 'child_process';

console.log('🔄 Aplicando migração do banco de dados (modo forçado)...\n');

try {
  // Usar drizzle-kit push com --force e --verbose
  const output = execSync(
    'pnpm drizzle-kit push --force --verbose',
    {
      cwd: '/home/ubuntu/avd-uisa-sistema-completo',
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    }
  );
  
  console.log(output);
  console.log('\n✅ Migração aplicada com sucesso!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro ao aplicar migração:');
  console.error(error.stdout || error.message);
  console.error(error.stderr);
  process.exit(1);
}
