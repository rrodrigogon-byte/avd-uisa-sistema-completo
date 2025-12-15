import { readFileSync } from "fs";
import { sendEmail } from "../server/_core/email.js";

/**
 * Script para enviar emails com credenciais para os usuários criados
 * Execução: node scripts/send-credentials-email.mjs
 */

const APP_URL = process.env.VITE_APP_URL || "https://3000-ipmp0a4ptf6awjhw09efq-4f54ef5c.manusvm.computer";
const APP_TITLE = process.env.VITE_APP_TITLE || "Sistema AVD UISA";

// Ler arquivo de usuários criados
const usersFile = "/home/ubuntu/avd-uisa-sistema-completo/scripts/usuarios-criados.json";
let users;

try {
  const fileContent = readFileSync(usersFile, "utf-8");
  users = JSON.parse(fileContent);
} catch (error) {
  console.error("❌ Erro ao ler arquivo de usuários:", error.message);
  process.exit(1);
}

// Filtrar apenas usuários criados (não existentes)
const newUsers = users.filter((u) => u.status === "created");

if (newUsers.length === 0) {
  console.log("⚠️  Nenhum usuário novo para enviar email.");
  process.exit(0);
}

console.log(`📧 Preparando envio de emails para ${newUsers.length} usuários...\n`);

// Função para criar template de email
function createEmailTemplate(user) {
  const roleLabel = user.role === "admin" ? "Administrador" : "Gestor/Líder";
  const titleText = user.title ? `<p><strong>Cargo:</strong> ${user.title}</p>` : "";

  return {
    subject: `Bem-vindo ao ${APP_TITLE} - Suas Credenciais de Acesso`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credenciais de Acesso</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo ao ${APP_TITLE}!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>${user.name}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Você foi cadastrado no <strong>${APP_TITLE}</strong> como <strong>${roleLabel}</strong>. 
      Abaixo estão suas credenciais de acesso:
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
      <p style="margin: 10px 0;"><strong>📧 Email:</strong> ${user.email}</p>
      <p style="margin: 10px 0;"><strong>🔑 Senha Temporária:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-size: 14px;">${user.password}</code></p>
      <p style="margin: 10px 0;"><strong>👤 Perfil:</strong> ${roleLabel}</p>
      ${titleText}
    </div>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha no primeiro acesso.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        🚀 Acessar Sistema
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #0066cc; margin-top: 0;">📚 Primeiros Passos</h3>
      <ol style="margin: 10px 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Acesse o sistema usando o link acima</li>
        <li style="margin: 8px 0;">Faça login com seu email e senha temporária</li>
        <li style="margin: 8px 0;">Altere sua senha nas configurações</li>
        <li style="margin: 8px 0;">Explore o dashboard e familiarize-se com as funcionalidades</li>
      </ol>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Se você tiver alguma dúvida ou precisar de ajuda, entre em contato com o suporte.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Atenciosamente,<br>
      <strong>Equipe ${APP_TITLE}</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Este é um email automático, por favor não responda.</p>
    <p>&copy; 2024 ${APP_TITLE}. Todos os direitos reservados.</p>
  </div>
</body>
</html>
    `,
    text: `
Bem-vindo ao ${APP_TITLE}!

Olá ${user.name},

Você foi cadastrado no ${APP_TITLE} como ${roleLabel}.

Suas credenciais de acesso:
- Email: ${user.email}
- Senha Temporária: ${user.password}
- Perfil: ${roleLabel}
${user.title ? `- Cargo: ${user.title}` : ""}

⚠️ IMPORTANTE: Por questões de segurança, recomendamos que você altere sua senha no primeiro acesso.

Acesse o sistema em: ${APP_URL}

Primeiros Passos:
1. Acesse o sistema usando o link acima
2. Faça login com seu email e senha temporária
3. Altere sua senha nas configurações
4. Explore o dashboard e familiarize-se com as funcionalidades

Se você tiver alguma dúvida ou precisar de ajuda, entre em contato com o suporte.

Atenciosamente,
Equipe ${APP_TITLE}
    `,
  };
}

// Enviar emails
async function sendCredentialsEmails() {
  const results = [];

  for (const user of newUsers) {
    try {
      const emailContent = createEmailTemplate(user);
      
      console.log(`📤 Enviando email para ${user.name} (${user.email})...`);
      
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
      
      console.log(`✅ Email enviado com sucesso para ${user.email}\n`);
      
      results.push({
        user: user.name,
        email: user.email,
        status: "sent",
      });
    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${user.email}:`, error.message);
      
      results.push({
        user: user.name,
        email: user.email,
        status: "error",
        error: error.message,
      });
    }
  }

  // Resumo
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DO ENVIO DE EMAILS");
  console.log("=".repeat(60) + "\n");

  const sent = results.filter((r) => r.status === "sent");
  const errors = results.filter((r) => r.status === "error");

  console.log(`✅ Enviados: ${sent.length}`);
  console.log(`❌ Erros: ${errors.length}`);
  console.log("");

  if (errors.length > 0) {
    console.log("❌ EMAILS COM ERRO:");
    errors.forEach((r) => {
      console.log(`   - ${r.user} (${r.email}): ${r.error}`);
    });
    console.log("");
  }

  console.log("=".repeat(60));
  console.log("✨ Processo concluído!");
  console.log("=".repeat(60) + "\n");

  process.exit(errors.length > 0 ? 1 : 0);
}

sendCredentialsEmails().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
