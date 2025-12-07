import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./emailService";

/**
 * Serviço para envio de emails em massa para todos os administradores do sistema
 */

export interface BroadcastEmailOptions {
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
}

export interface BroadcastResult {
  success: boolean;
  totalAdmins: number;
  sentCount: number;
  failedCount: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Envia um email para todos os usuários com role 'admin'
 */
export async function sendEmailToAllAdmins(
  options: BroadcastEmailOptions
): Promise<BroadcastResult> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Buscar todos os usuários admin com email válido
  const adminUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, "admin"));

  // Filtrar apenas admins com email válido
  const adminsWithEmail = adminUsers.filter(
    (admin) => admin.email && admin.email.trim() !== ""
  );

  const result: BroadcastResult = {
    success: true,
    totalAdmins: adminsWithEmail.length,
    sentCount: 0,
    failedCount: 0,
    errors: [],
  };

  // Se não houver admins com email, retornar erro
  if (adminsWithEmail.length === 0) {
    result.success = false;
    result.errors.push({
      email: "N/A",
      error: "Nenhum administrador com email válido encontrado no sistema",
    });
    return result;
  }

  // Enviar email para cada admin
  for (const admin of adminsWithEmail) {
    try {
      // Personalizar conteúdo com o nome do admin
      const personalizedHtml = options.htmlContent.replace(
        /\{name\}/g,
        admin.name || "Administrador"
      );
      const personalizedText = options.textContent?.replace(
        /\{name\}/g,
        admin.name || "Administrador"
      );

      await sendEmail({
        to: admin.email!,
        subject: options.subject,
        html: personalizedHtml,
        text: personalizedText,
        from: options.from,
      });

      result.sentCount++;
    } catch (error) {
      result.failedCount++;
      result.errors.push({
        email: admin.email!,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Se todos falharam, marcar como não sucesso
  if (result.failedCount === result.totalAdmins) {
    result.success = false;
  }

  return result;
}

/**
 * Template de email para comunicados gerais aos administradores
 */
export function createAdminBroadcastTemplate(params: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #555;
      margin-bottom: 20px;
    }
    .message {
      font-size: 15px;
      color: #666;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    .action-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      transition: transform 0.2s;
    }
    .action-button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 13px;
      color: #999;
      border-top: 1px solid #e9ecef;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 ${params.title}</h1>
    </div>
    <div class="content">
      <div class="badge">ADMINISTRADOR</div>
      <div class="greeting">Olá, {name}!</div>
      <div class="message">
        ${params.message}
      </div>
      ${
        params.actionUrl && params.actionText
          ? `
      <div style="text-align: center; margin-top: 30px;">
        <a href="${params.actionUrl}" class="action-button">${params.actionText}</a>
      </div>
      `
          : ""
      }
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema AVD UISA.</p>
      <p>© ${new Date().getFullYear()} AVD UISA - Sistema de Avaliação de Desempenho</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Template de texto simples para comunicados gerais
 */
export function createAdminBroadcastTextTemplate(params: {
  title: string;
  message: string;
  actionUrl?: string;
}): string {
  let text = `
${params.title}

Olá, {name}!

${params.message}
`;

  if (params.actionUrl) {
    text += `\n\nAcesse: ${params.actionUrl}`;
  }

  text += `

---
Este é um email automático do Sistema AVD UISA.
© ${new Date().getFullYear()} AVD UISA - Sistema de Avaliação de Desempenho
  `.trim();

  return text;
}
