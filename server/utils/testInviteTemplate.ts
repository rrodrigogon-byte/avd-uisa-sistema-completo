// Template de email para convite de testes psicométricos

export function createTestInviteEmail(data: {
  employeeName: string;
  testType: string;
  testName: string;
  testDescription: string;
  estimatedTime: string;
  testUrl: string;
}) {
  return {
    subject: `Convite: ${data.testName} - Sistema AVD UISA`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #F39200 0%, #FF6B35 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header .icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content { 
              padding: 40px 30px; 
            }
            .content p {
              margin: 15px 0;
              font-size: 16px;
            }
            .test-info {
              background: #FFF8F0;
              border-left: 4px solid #F39200;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .test-info h3 {
              margin: 0 0 10px 0;
              color: #F39200;
              font-size: 20px;
            }
            .test-info p {
              margin: 8px 0;
              font-size: 15px;
            }
            .test-info .label {
              font-weight: 600;
              color: #666;
            }
            .button { 
              display: inline-block; 
              padding: 16px 40px; 
              background: linear-gradient(135deg, #F39200 0%, #FF6B35 100%);
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 30px 0;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(243, 146, 0, 0.3);
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(243, 146, 0, 0.4);
            }
            .benefits {
              background: #F0F9FF;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .benefits h4 {
              margin: 0 0 15px 0;
              color: #1E3A5F;
              font-size: 18px;
            }
            .benefits ul {
              margin: 0;
              padding-left: 20px;
            }
            .benefits li {
              margin: 8px 0;
              color: #555;
            }
            .footer { 
              background: #f8f8f8;
              text-align: center; 
              padding: 30px;
              color: #666; 
              font-size: 13px;
              border-top: 1px solid #e0e0e0;
            }
            .footer p {
              margin: 5px 0;
            }
            .logo {
              color: #F39200;
              font-weight: 700;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🧠</div>
              <h1>Convite para Teste Psicométrico</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.employeeName}</strong>!</p>
              
              <p>Você foi convidado(a) a realizar um teste psicométrico como parte do processo de desenvolvimento profissional da UISA.</p>
              
              <div class="test-info">
                <h3>${data.testName}</h3>
                <p><span class="label">Tipo:</span> ${data.testType}</p>
                <p><span class="label">Tempo estimado:</span> ${data.estimatedTime}</p>
                <p style="margin-top: 15px;">${data.testDescription}</p>
              </div>

              <div class="benefits">
                <h4>📊 Por que fazer este teste?</h4>
                <ul>
                  <li>Conhecer melhor seu perfil comportamental e competências</li>
                  <li>Identificar pontos fortes e oportunidades de desenvolvimento</li>
                  <li>Receber recomendações personalizadas para seu PDI</li>
                  <li>Contribuir para seu crescimento profissional na UISA</li>
                </ul>
              </div>

              <p><strong>⏰ Importante:</strong> Reserve um momento tranquilo para responder com sinceridade. Não há respostas certas ou erradas!</p>
              
              <div style="text-align: center;">
                <a href="${data.testUrl}" class="button">🚀 Iniciar Teste Agora</a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                <strong>Dúvidas?</strong> Entre em contato com o RH pelo email avd@uisa.com.br
              </p>
            </div>
            <div class="footer">
              <p class="logo">Sistema AVD UISA</p>
              <p>Avaliação de Desempenho e Gestão de Talentos</p>
              <p style="margin-top: 15px;">Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Mapeamento de informações dos testes
export const testInfo = {
  disc: {
    name: "Teste DISC",
    type: "Avaliação Comportamental",
    description: "Identifica seu estilo comportamental predominante entre Dominância, Influência, Estabilidade e Conformidade. Ajuda a entender como você se comunica, toma decisões e interage com a equipe.",
    estimatedTime: "10-15 minutos",
    questionCount: 40,
  },
  bigfive: {
    name: "Teste Big Five (OCEAN)",
    type: "Avaliação de Personalidade",
    description: "Avalia as cinco grandes dimensões da personalidade: Abertura, Conscienciosidade, Extroversão, Amabilidade e Neuroticismo. Fornece um perfil completo de suas características pessoais.",
    estimatedTime: "12-18 minutos",
    questionCount: 50,
  },
  mbti: {
    name: "Teste MBTI",
    type: "Indicador de Tipo de Personalidade",
    description: "Identifica seu tipo de personalidade entre 16 possíveis combinações, baseado em quatro dimensões: Extroversão/Introversão, Sensação/Intuição, Pensamento/Sentimento e Julgamento/Percepção.",
    estimatedTime: "8-12 minutos",
    questionCount: 20,
  },
  ie: {
    name: "Teste de Inteligência Emocional",
    type: "Avaliação de Competências Emocionais",
    description: "Mede suas habilidades de Autoconsciência, Autorregulação, Motivação, Empatia e Habilidades Sociais. Baseado no modelo de Daniel Goleman.",
    estimatedTime: "15-20 minutos",
    questionCount: 25,
  },
  vark: {
    name: "Teste VARK",
    type: "Estilos de Aprendizagem",
    description: "Identifica seu estilo preferido de aprendizagem entre Visual, Auditivo, Leitura/Escrita e Cinestésico. Útil para personalizar seu desenvolvimento profissional.",
    estimatedTime: "8-10 minutos",
    questionCount: 20,
  },
  leadership: {
    name: "Teste de Estilos de Liderança",
    type: "Avaliação de Liderança",
    description: "Identifica seus estilos de liderança predominantes entre Autocrático, Democrático, Transformacional, Transacional, Coaching e Laissez-faire. Baseado em teorias de Lewin, Bass e Goleman.",
    estimatedTime: "10-12 minutos",
    questionCount: 30,
  },
  careeranchors: {
    name: "Teste de Âncoras de Carreira",
    type: "Avaliação de Motivação Profissional",
    description: "Identifica suas âncoras de carreira segundo Edgar Schein: Competência Técnica, Competência Gerencial, Autonomia, Segurança, Criatividade Empreendedora, Serviço, Desafio e Estilo de Vida.",
    estimatedTime: "12-15 minutos",
    questionCount: 40,
  },
};
