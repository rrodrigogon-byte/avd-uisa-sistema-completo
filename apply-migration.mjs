import { spawn } from 'child_process';

console.log('Aplicando migração do banco de dados...');

const drizzle = spawn('pnpm', ['drizzle-kit', 'push', '--force'], {
  cwd: '/home/ubuntu/avd-uisa-sistema-completo',
  stdio: 'inherit'
});

drizzle.on('close', (code) => {
  if (code === 0) {
    console.log('✓ Migração aplicada com sucesso!');
  } else {
    console.error(`✗ Erro ao aplicar migração (código ${code})`);
    process.exit(code);
  }
});
