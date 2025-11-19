import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Buscar configuração SMTP
const result = await connection.query(
  "SELECT settingValue FROM systemSettings WHERE settingKey = 'smtp_config'"
);

if (!result[0] || result[0].length === 0) {
  console.error('❌ Configuração SMTP não encontrada');
  process.exit(1);
}

const smtpConfig = JSON.parse(result[0][0].settingValue);
console.log('📧 Configuração SMTP carregada:', {
  host: smtpConfig.host,
  port: smtpConfig.port,
  user: smtpConfig.user,
  from: smtpConfig.fromEmail
});

// Criar transporter
const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure || false,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass
  }
});

// Enviar e-mail de teste
const mailOptions = {
  from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
  to: 'rodrigo.goncalves@uisa.com.br',
  subject: '✅ Teste de E-mail - Sistema AVD UISA',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #F39200 0%, #FF6B00 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Sistema AVD UISA</h1>
        <p style="color: white; margin: 10px 0 0 0;">Avaliação de Desempenho e Gestão de Talentos</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1E3A5F;">✅ E-mail de Teste Enviado com Sucesso!</h2>
        
        <p>Olá,</p>
        
        <p>Este é um e-mail de teste do <strong>Sistema AVD UISA</strong> para confirmar que a configuração SMTP está funcionando corretamente.</p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid #F39200; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #F39200;">📋 Informações do Teste</h3>
          <ul style="list-style: none; padding: 0;">
            <li>📧 <strong>Servidor SMTP:</strong> ${smtpConfig.host}</li>
            <li>🔌 <strong>Porta:</strong> ${smtpConfig.port}</li>
            <li>👤 <strong>Usuário:</strong> ${smtpConfig.user}</li>
            <li>📤 <strong>Remetente:</strong> ${smtpConfig.fromEmail}</li>
            <li>📅 <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
          </ul>
        </div>
        
        <p>Se você recebeu este e-mail, significa que o sistema está pronto para enviar notificações automáticas de:</p>
        <ul>
          <li>✅ Metas SMART criadas e atualizadas</li>
          <li>✅ Avaliações 360° pendentes</li>
          <li>✅ PDIs aprovados e em andamento</li>
          <li>✅ Lembretes de prazos e ações</li>
          <li>✅ Badges conquistados</li>
        </ul>
        
        <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe Sistema AVD UISA</strong></p>
      </div>
      
      <div style="background: #1E3A5F; padding: 20px; text-align: center; color: white; font-size: 12px;">
        <p style="margin: 0;">© 2025 UISA - Usina Itamarati S/A</p>
        <p style="margin: 5px 0 0 0;">Sistema de Avaliação de Desempenho e Gestão de Talentos</p>
      </div>
    </div>
  `
};

console.log('\n📤 Enviando e-mail de teste para rodrigo.goncalves@uisa.com.br...');

try {
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ E-mail enviado com sucesso!');
  console.log('📬 Message ID:', info.messageId);
  console.log('📨 Response:', info.response);
  
  // Registrar no banco
  await connection.query(
    `INSERT INTO emailMetrics (recipientEmail, emailType, status, sentAt, metadata) 
     VALUES (?, ?, ?, NOW(), ?)`,
    ['rodrigo.goncalves@uisa.com.br', 'test', 'sent', JSON.stringify({ messageId: info.messageId })]
  );
  
  console.log('✅ Métrica registrada no banco de dados');
} catch (error) {
  console.error('❌ Erro ao enviar e-mail:', error.message);
  
  // Registrar falha no banco
  await connection.query(
    `INSERT INTO emailMetrics (recipientEmail, emailType, status, sentAt, errorMessage) 
     VALUES (?, ?, ?, NOW(), ?)`,
    ['rodrigo.goncalves@uisa.com.br', 'test', 'failed', error.message]
  );
}

await connection.end();
