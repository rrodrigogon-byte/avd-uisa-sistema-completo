import { emailService } from "../server/utils/emailService";

const recipient = "rodrigo.goncalves@uisa.com.br";
const baseUrl = process.env.VITE_APP_URL || "https://3000-ipmp0a4ptf6awjhw09efq-4f54ef5c.manusvm.computer";

const tests = [
  { type: "disc", name: "DISC", description: "Identifique seu perfil comportamental", time: "10-15 min" },
  { type: "bigfive", name: "Big Five", description: "Avalie suas cinco grandes dimensões de personalidade", time: "15-20 min" },
  { type: "mbti", name: "MBTI", description: "Descubra seu tipo de personalidade Myers-Briggs", time: "10-15 min" },
  { type: "ie", name: "Inteligência Emocional", description: "Avalie suas competências emocionais", time: "15-20 min" },
  { type: "vark", name: "VARK", description: "Descubra seu estilo de aprendizagem preferido", time: "10-15 min" },
];

async function main() {
  console.log("============================================================");
  console.log("📧 ENVIANDO TESTES PSICOMÉTRICOS");
  console.log("============================================================");
  console.log(`Destinatário: ${recipient}`);
  console.log(`Total de testes: ${tests.length}`);
  console.log("============================================================\n");

  let successCount = 0;
  let failureCount = 0;

  for (const test of tests) {
    try {
      console.log(`📤 Enviando ${test.name}...`);
      
      const testUrl = `${baseUrl}/teste-${test.type}`;
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F39200 0%, #FF6B00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .test-info { background: #f8f9fa; padding: 20px; border-left: 4px solid #F39200; margin: 20px 0; }
    .button { display: inline-block; background: #F39200; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎯 Convite para Teste Psicométrico</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      
      <p>Você foi convidado(a) para realizar o teste <strong>${test.name}</strong> como parte do processo de avaliação e desenvolvimento profissional da UISA.</p>
      
      <div class="test-info">
        <h2 style="margin-top: 0; color: #F39200;">${test.name}</h2>
        <p><strong>Descrição:</strong> ${test.description}</p>
        <p><strong>Tempo estimado:</strong> ${test.time}</p>
      </div>
      
      <p><strong>Por que fazer este teste?</strong></p>
      <ul>
        <li>Autoconhecimento e desenvolvimento pessoal</li>
        <li>Identificação de pontos fortes e áreas de melhoria</li>
        <li>Suporte para criação de Plano de Desenvolvimento Individual (PDI)</li>
        <li>Melhor alinhamento com oportunidades de carreira</li>
      </ul>
      
      <p><strong>Instruções:</strong></p>
      <ol>
        <li>Clique no botão abaixo para acessar o teste</li>
        <li>Responda com sinceridade - não existem respostas certas ou erradas</li>
        <li>Complete todas as questões em uma única sessão</li>
        <li>Ao finalizar, você receberá seu resultado imediatamente</li>
      </ol>
      
      <div style="text-align: center;">
        <a href="${testUrl}" class="button">Realizar Teste ${test.name}</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <strong>Link direto:</strong> <a href="${testUrl}">${testUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema AVD UISA</p>
      <p>© 2025 UISA - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
      `;

      const success = await emailService.sendCustomEmail(
        recipient,
        `Convite: Teste ${test.name} - Sistema AVD UISA`,
        htmlContent
      );

      if (success) {
        console.log(`   ✅ ${recipient} - ${test.name} enviado\n`);
        successCount++;
      } else {
        console.log(`   ❌ ${recipient} - Falha ao enviar ${test.name}\n`);
        failureCount++;
      }
    } catch (error) {
      console.log(`   ❌ ${recipient} - Erro ao enviar ${test.name}`);
      console.log(`   Erro: ${error instanceof Error ? error.message : String(error)}\n`);
      failureCount++;
    }

    // Aguardar 2 segundos entre envios
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("============================================================");
  console.log("📊 RESUMO DO ENVIO");
  console.log("============================================================");
  console.log(`✅ Emails enviados com sucesso: ${successCount}`);
  console.log(`❌ Emails com falha: ${failureCount}`);
  console.log(`📧 Total de emails processados: ${successCount + failureCount}`);
  console.log(`🎯 Total esperado: ${tests.length} testes`);
  console.log("============================================================");
}

main().catch(console.error);
