import nodemailer from 'nodemailer';

// Configurações SMTP do Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'avd@uisa.com.br',
    pass: 'hcmsjglzurabtaus', // Senha de aplicativo do Gmail (sem espaços)
  },
});

// Email de teste
const mailOptions = {
  from: '"Sistema AVD UISA" <avd@uisa.com.br>',
  to: 'rodrigo.goncalves@uisa.com.br',
  subject: '✅ Teste de Configuração SMTP - Sistema AVD UISA',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F39200;">🎉 Sistema AVD UISA - Teste de Email</h2>
      
      <p>Olá Rodrigo,</p>
      
      <p>Este é um email de teste para confirmar que o sistema de notificações automáticas do <strong>Sistema AVD UISA</strong> está funcionando corretamente.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #F39200; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">✅ Configuração SMTP Validada</h3>
        <ul>
          <li>Servidor SMTP: Gmail (smtp.gmail.com)</li>
          <li>Conta: avd@uisa.com.br</li>
          <li>Status: <strong style="color: green;">Conectado e Funcional</strong></li>
        </ul>
      </div>
      
      <p>A partir de agora, você receberá notificações automáticas sobre:</p>
      <ul>
        <li>📊 Aprovações de metas SMART pendentes</li>
        <li>🎯 Lembretes de metas próximas do vencimento</li>
        <li>👥 Solicitações de calibração de avaliações</li>
        <li>💰 Workflows de aprovação de bônus</li>
        <li>📈 Relatórios e alertas de performance</li>
      </ul>
      
      <p style="margin-top: 30px;">
        <strong>Atenciosamente,</strong><br>
        <span style="color: #F39200;">Sistema AVD UISA</span><br>
        <small style="color: #666;">Avaliação de Desempenho</small>
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999;">
        Este é um email automático do Sistema AVD UISA. Por favor, não responda a esta mensagem.
      </p>
    </div>
  `,
};

// Enviar email
console.log('🚀 Enviando email de teste...');
console.log('📧 Destinatário: rodrigo.goncalves@uisa.com.br');

try {
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email enviado com sucesso!');
  console.log('📬 Message ID:', info.messageId);
  console.log('📨 Response:', info.response);
  console.log('\n🎉 Teste concluído! Verifique a caixa de entrada de rodrigo.goncalves@uisa.com.br');
} catch (error) {
  console.error('❌ Erro ao enviar email:', error);
  process.exit(1);
}
