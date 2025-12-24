import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config();

console.log('Testing OAuth callback simulation...\n');
console.log('Environment variables:');
console.log('- OAUTH_SERVER_URL:', process.env.OAUTH_SERVER_URL);
console.log('- VITE_APP_ID:', process.env.VITE_APP_ID);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('\n');

// Simular o que acontece no callback
const testCode = 'code_4mHXsNgKCpNQfQLsP42tdK';
const testState = 'aHR0cHM6Ly8zMDAwLWlla3FnZml5NTVwYWYyMmc4eWFocS1kYjE3NjA1Mi5tYW51c3ZtLmNvbXB1dGVyL2FwaS9vYXV0aC9jYWxsYmFjaw==';

console.log('Test parameters:');
console.log('- code:', testCode);
console.log('- state:', testState);
console.log('- decoded state:', Buffer.from(testState, 'base64').toString());
console.log('\n');

// Tentar importar e testar o SDK
try {
  const sdkModule = await import('./server/_core/sdk.ts');
  const sdk = sdkModule.sdk;
  
  console.log('SDK imported successfully');
  console.log('Attempting to exchange code for token...\n');
  
  const tokenResponse = await sdk.exchangeCodeForToken(testCode, testState);
  console.log('✓ Token exchange successful!');
  console.log('Token response:', tokenResponse);
  
} catch (error) {
  console.error('✗ Error during OAuth flow:');
  console.error('Message:', error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', JSON.stringify(error.response.data, null, 2));
  }
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
}
