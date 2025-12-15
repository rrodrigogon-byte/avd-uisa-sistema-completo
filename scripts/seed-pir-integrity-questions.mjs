import mysql from 'mysql2/promise';

// Questões adicionais para cada dimensão
const additionalQuestions = {
  // HONESTIDADE (dimensionId: 1) - já tem 3, precisa de mais 7
  1: [
    {
      title: "Currículo Exagerado de Colega",
      scenario: "Você descobre que um colega de trabalho exagerou significativamente suas qualificações no currículo para conseguir a vaga atual. Ele está desempenhando bem suas funções, mas tecnicamente não possui as certificações que alegou ter.",
      question: "Como você lidaria com essa situação?",
      options: [
        { value: "A", label: "Não faria nada, pois ele está desempenhando bem", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Conversaria com o colega sugerindo que ele regularize sua situação", score: 60, moralLevel: "conventional" },
        { value: "C", label: "Reportaria ao RH imediatamente", score: 80, moralLevel: "post_conventional" },
        { value: "D", label: "Usaria essa informação como vantagem pessoal", score: 0, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Relatório de Horas Extras",
      scenario: "Seu gestor pede que você registre horas extras que não foram realmente trabalhadas para compensar um orçamento que sobrou no departamento.",
      question: "Qual seria sua reação?",
      options: [
        { value: "A", label: "Registraria as horas, pois é uma ordem do gestor", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Recusaria educadamente explicando os riscos", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Registraria mas guardaria provas para se proteger", score: 20, moralLevel: "pre_conventional" },
        { value: "D", label: "Reportaria a situação ao compliance ou RH", score: 90, moralLevel: "post_conventional" }
      ]
    },
    {
      title: "Erro em Nota Fiscal",
      scenario: "Você recebe uma nota fiscal de um fornecedor com valor menor do que o serviço realmente prestado. O erro é claramente do fornecedor.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Pagaria o valor menor e não diria nada", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Informaria o fornecedor sobre o erro", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Consultaria seu gestor sobre o que fazer", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Guardaria a diferença como reserva do departamento", score: 0, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Informação Privilegiada",
      scenario: "Em uma reunião confidencial, você descobre que a empresa vai fazer uma grande aquisição que certamente valorizará as ações. Você tem a oportunidade de comprar ações antes do anúncio público.",
      question: "Como você agiria?",
      options: [
        { value: "A", label: "Compraria as ações, pois a informação chegou naturalmente", score: 0, moralLevel: "pre_conventional" },
        { value: "B", label: "Não compraria e manteria a confidencialidade", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Compartilharia a dica com familiares próximos", score: 0, moralLevel: "pre_conventional" },
        { value: "D", label: "Consultaria o compliance sobre o que é permitido", score: 70, moralLevel: "conventional" }
      ]
    },
    {
      title: "Feedback de Cliente",
      scenario: "Um cliente importante dá um feedback muito negativo sobre seu trabalho. Seu gestor pede que você edite o relatório de satisfação para mostrar resultados melhores.",
      question: "Qual seria sua posição?",
      options: [
        { value: "A", label: "Editaria o relatório conforme solicitado", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Recusaria e explicaria a importância da integridade dos dados", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Proporia apresentar os dados reais com um plano de melhoria", score: 80, moralLevel: "post_conventional" },
        { value: "D", label: "Editaria parcialmente, minimizando os pontos negativos", score: 20, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Presente de Fornecedor",
      scenario: "Um fornecedor com quem você negocia contratos envia um presente caro para sua casa (um smartphone de última geração) com um cartão agradecendo pela 'parceria'.",
      question: "Como você procederia?",
      options: [
        { value: "A", label: "Aceitaria o presente, pois é uma cortesia comercial", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Devolveria o presente e informaria seu gestor", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Aceitaria mas declararia ao compliance", score: 50, moralLevel: "conventional" },
        { value: "D", label: "Aceitaria e retribuiria com tratamento preferencial", score: 0, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Atestado Médico Falso",
      scenario: "Um colega próximo pede que você confirme que ele estava doente em um dia que você sabe que ele foi a uma entrevista de emprego em outra empresa.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Confirmaria para ajudar o colega", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Recusaria educadamente e explicaria seus princípios", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Diria que não sabe de nada, sem confirmar nem negar", score: 40, moralLevel: "conventional" },
        { value: "D", label: "Reportaria a situação ao RH", score: 60, moralLevel: "conventional" }
      ]
    }
  ],
  
  // CONFIABILIDADE (dimensionId: 2) - já tem 2, precisa de mais 8
  2: [
    {
      title: "Compromisso com Deadline",
      scenario: "Você prometeu entregar um relatório importante até sexta-feira, mas percebe na quarta que não conseguirá cumprir o prazo sem comprometer a qualidade.",
      question: "Como você agiria?",
      options: [
        { value: "A", label: "Entregaria no prazo mesmo com qualidade inferior", score: 30, moralLevel: "pre_conventional" },
        { value: "B", label: "Comunicaria imediatamente e negociaria novo prazo", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Esperaria até sexta para avisar do atraso", score: 10, moralLevel: "pre_conventional" },
        { value: "D", label: "Pediria ajuda a colegas para cumprir o prazo", score: 70, moralLevel: "conventional" }
      ]
    },
    {
      title: "Informação Confidencial do Cliente",
      scenario: "Um cliente compartilhou informações estratégicas confidenciais para que você pudesse atendê-lo melhor. Um concorrente desse cliente oferece uma boa quantia por essas informações.",
      question: "Qual seria sua decisão?",
      options: [
        { value: "A", label: "Venderia as informações, pois o cliente nunca saberia", score: 0, moralLevel: "pre_conventional" },
        { value: "B", label: "Recusaria e reportaria a tentativa de suborno", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Recusaria mas não reportaria para evitar problemas", score: 50, moralLevel: "conventional" },
        { value: "D", label: "Negociaria um valor maior antes de decidir", score: 0, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Backup de Dados",
      scenario: "Você é responsável por fazer backups diários de dados críticos. Num dia muito corrido, você considera pular o backup pois 'nunca acontece nada mesmo'.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Pularia o backup só dessa vez", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Faria o backup mesmo atrasando outras tarefas", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Delegaria a tarefa para outra pessoa", score: 50, moralLevel: "conventional" },
        { value: "D", label: "Automatizaria o processo para evitar esse dilema", score: 90, moralLevel: "post_conventional" }
      ]
    },
    {
      title: "Reunião Importante",
      scenario: "Você tem uma reunião importante agendada com um cliente, mas recebe um convite de última hora para um evento social com executivos da empresa que poderia beneficiar sua carreira.",
      question: "Como você decidiria?",
      options: [
        { value: "A", label: "Cancelaria a reunião com o cliente inventando uma desculpa", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Manteria o compromisso com o cliente", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Tentaria remarcar a reunião com antecedência", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Enviaria um substituto para a reunião", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Projeto em Equipe",
      scenario: "Você está em um projeto de equipe e percebe que um colega não está cumprindo sua parte. O prazo está próximo e você poderia fazer o trabalho dele sem que ninguém soubesse.",
      question: "Qual seria sua abordagem?",
      options: [
        { value: "A", label: "Faria o trabalho dele para garantir a entrega", score: 30, moralLevel: "pre_conventional" },
        { value: "B", label: "Conversaria com o colega sobre a situação", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Reportaria ao gestor do projeto", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Deixaria o projeto falhar para expor o colega", score: 0, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Senha Compartilhada",
      scenario: "Um colega de confiança pede sua senha de acesso ao sistema porque a dele expirou e ele precisa urgentemente finalizar um trabalho.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Compartilharia a senha por ser urgente", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Recusaria e ajudaria a resolver pelo canal correto", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Compartilharia mas pediria para trocar depois", score: 20, moralLevel: "pre_conventional" },
        { value: "D", label: "Faria o login e deixaria ele usar sua máquina", score: 30, moralLevel: "conventional" }
      ]
    },
    {
      title: "Promessa de Confidencialidade",
      scenario: "Um colega te conta em sigilo que está procurando emprego. Seu gestor pergunta diretamente se você sabe de alguém da equipe que está insatisfeito.",
      question: "Como você responderia?",
      options: [
        { value: "A", label: "Contaria sobre o colega para ganhar pontos com o gestor", score: 0, moralLevel: "pre_conventional" },
        { value: "B", label: "Manteria o sigilo e diria que não sabe", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Sugeriria ao gestor fazer uma pesquisa de clima", score: 70, moralLevel: "conventional" },
        { value: "D", label: "Daria dicas indiretas sem mencionar nomes", score: 20, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Documento Perdido",
      scenario: "Você perdeu um documento importante que deveria ter arquivado. Ninguém sabe que você era o responsável por ele.",
      question: "Qual seria sua atitude?",
      options: [
        { value: "A", label: "Ficaria quieto e esperaria que ninguém notasse", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Assumiria o erro e buscaria soluções", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Tentaria recriar o documento sem contar a ninguém", score: 40, moralLevel: "conventional" },
        { value: "D", label: "Culparia outro setor pela perda", score: 0, moralLevel: "pre_conventional" }
      ]
    }
  ],
  
  // RESILIÊNCIA ÉTICA (dimensionId: 3) - já tem 2, precisa de mais 8
  3: [
    {
      title: "Meta Inalcançável",
      scenario: "Seu gestor estabelece uma meta de vendas impossível de atingir de forma ética. Colegas estão usando táticas questionáveis para alcançá-la.",
      question: "Como você procederia?",
      options: [
        { value: "A", label: "Usaria as mesmas táticas dos colegas", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Manteria práticas éticas mesmo não atingindo a meta", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Questionaria a meta com argumentos sólidos", score: 80, moralLevel: "post_conventional" },
        { value: "D", label: "Procuraria outro emprego", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Pressão do Cliente VIP",
      scenario: "Um cliente VIP exige que você quebre regras internas para atendê-lo, ameaçando cancelar um contrato milionário.",
      question: "Qual seria sua posição?",
      options: [
        { value: "A", label: "Quebraria as regras para manter o cliente", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Manteria as regras e explicaria ao cliente", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Escalaria para seu gestor decidir", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Buscaria alternativas dentro das regras", score: 80, moralLevel: "post_conventional" }
      ]
    },
    {
      title: "Cultura de Atalhos",
      scenario: "Você entra em uma nova empresa e percebe que a cultura local aceita 'pequenos atalhos' que você considera antiéticos, como arredondar números em relatórios.",
      question: "Como você se adaptaria?",
      options: [
        { value: "A", label: "Se adaptaria à cultura local", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Manteria seus padrões éticos mesmo sendo diferente", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Tentaria mudar a cultura gradualmente", score: 80, moralLevel: "post_conventional" },
        { value: "D", label: "Sairia da empresa imediatamente", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Chefe Antiético",
      scenario: "Seu chefe direto regularmente pede que você faça coisas que você considera antiéticas, como manipular dados de desempenho.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Obedeceria para manter o emprego", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Recusaria e documentaria os pedidos", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Reportaria ao canal de denúncias", score: 90, moralLevel: "post_conventional" },
        { value: "D", label: "Faria parcialmente para não criar conflito", score: 20, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Crise Financeira",
      scenario: "A empresa está em crise financeira e seu gestor sugere que você 'esqueça' de pagar alguns fornecedores menores para priorizar os grandes.",
      question: "Qual seria sua reação?",
      options: [
        { value: "A", label: "Seguiria a orientação do gestor", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Proporia um plano de pagamento transparente para todos", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Negociaria prazos com os fornecedores menores", score: 70, moralLevel: "conventional" },
        { value: "D", label: "Escalaria a decisão para níveis superiores", score: 60, moralLevel: "conventional" }
      ]
    },
    {
      title: "Competição Interna",
      scenario: "Em uma disputa por promoção, você descobre que seu concorrente está sabotando seu trabalho. Você tem a oportunidade de fazer o mesmo.",
      question: "Como você agiria?",
      options: [
        { value: "A", label: "Retaliaria da mesma forma", score: 0, moralLevel: "pre_conventional" },
        { value: "B", label: "Manteria sua integridade e focaria em seu trabalho", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Reportaria a sabotagem ao RH", score: 70, moralLevel: "conventional" },
        { value: "D", label: "Confrontaria o colega diretamente", score: 50, moralLevel: "conventional" }
      ]
    },
    {
      title: "Demissão em Massa",
      scenario: "Você é informado confidencialmente sobre uma demissão em massa que afetará colegas próximos. Eles poderiam se preparar se soubessem.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Contaria para os colegas se prepararem", score: 30, moralLevel: "conventional" },
        { value: "B", label: "Manteria a confidencialidade apesar do dilema", score: 70, moralLevel: "post_conventional" },
        { value: "C", label: "Questionaria a empresa sobre o processo", score: 80, moralLevel: "post_conventional" },
        { value: "D", label: "Usaria a informação para sua própria vantagem", score: 0, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Produto com Defeito",
      scenario: "Você descobre que um produto da empresa tem um defeito que não é perigoso, mas afeta a qualidade. Corrigir atrasaria o lançamento e custaria muito.",
      question: "Qual seria sua recomendação?",
      options: [
        { value: "A", label: "Lançar assim mesmo e corrigir depois", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Atrasar o lançamento para corrigir", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Lançar com aviso sobre a limitação", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Deixar a decisão para a diretoria", score: 40, moralLevel: "conventional" }
      ]
    }
  ],
  
  // RESPONSABILIDADE (dimensionId: 4) - já tem 2, precisa de mais 8
  4: [
    {
      title: "Erro de Cálculo",
      scenario: "Você percebe que cometeu um erro de cálculo em um orçamento já aprovado. O erro é pequeno mas pode crescer ao longo do projeto.",
      question: "Como você procederia?",
      options: [
        { value: "A", label: "Corrigiria silenciosamente sem avisar ninguém", score: 30, moralLevel: "pre_conventional" },
        { value: "B", label: "Reportaria o erro imediatamente e proporia correção", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Esperaria para ver se alguém nota", score: 10, moralLevel: "pre_conventional" },
        { value: "D", label: "Compensaria o erro em outras áreas do orçamento", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Impacto Ambiental",
      scenario: "Você descobre que um processo da empresa está causando impacto ambiental maior do que o declarado. Corrigir seria caro.",
      question: "Qual seria sua atitude?",
      options: [
        { value: "A", label: "Ignoraria, pois não é sua responsabilidade direta", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Reportaria e proporia soluções sustentáveis", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Documentaria para se proteger no futuro", score: 30, moralLevel: "pre_conventional" },
        { value: "D", label: "Consultaria a área de compliance", score: 60, moralLevel: "conventional" }
      ]
    },
    {
      title: "Treinamento de Novato",
      scenario: "Você foi designado para treinar um novo funcionário, mas está sobrecarregado com suas próprias tarefas.",
      question: "Como você lidaria com isso?",
      options: [
        { value: "A", label: "Faria um treinamento superficial para economizar tempo", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Dedicaria tempo adequado mesmo atrasando outras tarefas", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Negociaria prazos ou recursos adicionais", score: 90, moralLevel: "post_conventional" },
        { value: "D", label: "Delegaria o treinamento para outro colega", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Segurança no Trabalho",
      scenario: "Você nota que um equipamento de segurança está com defeito, mas reportar pode atrasar a produção e afetar bônus da equipe.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Continuaria usando e reportaria depois", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Pararia imediatamente e reportaria", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Usaria com cuidado extra", score: 20, moralLevel: "pre_conventional" },
        { value: "D", label: "Avisaria os colegas mas não pararia a produção", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Recursos da Empresa",
      scenario: "Você tem acesso a recursos da empresa (impressora, material de escritório) que poderia usar para fins pessoais sem que ninguém soubesse.",
      question: "Como você se comportaria?",
      options: [
        { value: "A", label: "Usaria moderadamente, pois todos fazem isso", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Nunca usaria para fins pessoais", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Pediria autorização quando necessário", score: 80, moralLevel: "post_conventional" },
        { value: "D", label: "Usaria apenas em emergências", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Trabalho Remoto",
      scenario: "Trabalhando de casa, você tem a oportunidade de fazer tarefas pessoais durante o horário de trabalho sem que ninguém perceba.",
      question: "Qual seria sua conduta?",
      options: [
        { value: "A", label: "Aproveitaria para resolver assuntos pessoais", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Manteria o mesmo nível de dedicação do presencial", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Compensaria o tempo pessoal trabalhando mais tarde", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Faria apenas o mínimo necessário", score: 20, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Feedback Negativo",
      scenario: "Você precisa dar um feedback negativo para um subordinado que é amigo pessoal. O feedback pode afetar a promoção dele.",
      question: "Como você agiria?",
      options: [
        { value: "A", label: "Amenizaria o feedback para não prejudicá-lo", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Daria o feedback honesto e construtivo", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Pediria para outro gestor fazer a avaliação", score: 40, moralLevel: "conventional" },
        { value: "D", label: "Adiaria o feedback esperando melhora", score: 30, moralLevel: "conventional" }
      ]
    },
    {
      title: "Conhecimento Crítico",
      scenario: "Você é o único que domina um processo crítico da empresa. Documentar esse conhecimento reduziria sua 'indispensabilidade'.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Manteria o conhecimento só para si", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Documentaria e treinaria outros proativamente", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Documentaria apenas se solicitado", score: 50, moralLevel: "conventional" },
        { value: "D", label: "Compartilharia parcialmente para manter vantagem", score: 20, moralLevel: "pre_conventional" }
      ]
    }
  ],
  
  // JUSTIÇA (dimensionId: 5) - já tem 2, precisa de mais 8
  5: [
    {
      title: "Seleção de Candidatos",
      scenario: "Você está participando de um processo seletivo e um dos candidatos é filho de um diretor. Ele é qualificado, mas há candidatos melhores.",
      question: "Como você avaliaria?",
      options: [
        { value: "A", label: "Favoreceria o filho do diretor para ganhar pontos", score: 0, moralLevel: "pre_conventional" },
        { value: "B", label: "Avaliaria todos pelos mesmos critérios objetivos", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Se absteria da decisão por conflito de interesse", score: 70, moralLevel: "conventional" },
        { value: "D", label: "Consultaria o RH sobre como proceder", score: 60, moralLevel: "conventional" }
      ]
    },
    {
      title: "Distribuição de Tarefas",
      scenario: "Você precisa distribuir tarefas entre sua equipe. Algumas são interessantes e outras são tediosas.",
      question: "Como você faria a distribuição?",
      options: [
        { value: "A", label: "Daria as melhores tarefas para seus favoritos", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Distribuiria de forma equitativa e rotativa", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Basearia na competência de cada um", score: 70, moralLevel: "conventional" },
        { value: "D", label: "Deixaria a equipe escolher", score: 50, moralLevel: "conventional" }
      ]
    },
    {
      title: "Reconhecimento de Ideia",
      scenario: "Uma ideia que você apresentou em reunião foi originalmente de um estagiário da sua equipe. A ideia foi muito elogiada pela diretoria.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Aceitaria os elogios sem mencionar o estagiário", score: 0, moralLevel: "pre_conventional" },
        { value: "B", label: "Daria o crédito ao estagiário publicamente", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Mencionaria que foi um trabalho de equipe", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Agradeceria ao estagiário em particular", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Conflito entre Colegas",
      scenario: "Dois colegas estão em conflito e pedem que você tome partido. Um deles é seu amigo pessoal.",
      question: "Como você se posicionaria?",
      options: [
        { value: "A", label: "Apoiaria seu amigo independente de quem tem razão", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Ouviria ambos os lados e seria imparcial", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Evitaria se envolver no conflito", score: 40, moralLevel: "conventional" },
        { value: "D", label: "Encaminharia para o RH resolver", score: 50, moralLevel: "conventional" }
      ]
    },
    {
      title: "Acesso a Oportunidades",
      scenario: "Você sabe de uma oportunidade de treinamento internacional. Poderia indicar apenas pessoas do seu círculo ou divulgar para toda a equipe.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Indicaria apenas pessoas próximas", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Divulgaria para toda a equipe ter chance igual", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Indicaria os mais qualificados que conhece", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Se candidataria primeiro e depois divulgaria", score: 30, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Avaliação de Desempenho",
      scenario: "Na avaliação de desempenho, você percebe que um colega de outra equipe está sendo avaliado injustamente por seu gestor.",
      question: "Qual seria sua atitude?",
      options: [
        { value: "A", label: "Não se envolveria, pois não é da sua equipe", score: 30, moralLevel: "pre_conventional" },
        { value: "B", label: "Reportaria a situação ao RH ou canal apropriado", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Conversaria com o gestor do colega", score: 60, moralLevel: "conventional" },
        { value: "D", label: "Apoiaria o colega a se defender", score: 70, moralLevel: "post_conventional" }
      ]
    },
    {
      title: "Política de Remuneração",
      scenario: "Você descobre que colegas com a mesma função e desempenho ganham salários muito diferentes por questões históricas.",
      question: "Como você reagiria?",
      options: [
        { value: "A", label: "Usaria a informação para negociar seu próprio salário", score: 30, moralLevel: "pre_conventional" },
        { value: "B", label: "Levantaria a questão com o RH de forma construtiva", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Não faria nada para não criar problemas", score: 20, moralLevel: "pre_conventional" },
        { value: "D", label: "Comentaria com os colegas afetados", score: 40, moralLevel: "conventional" }
      ]
    },
    {
      title: "Terceirizados vs Efetivos",
      scenario: "Você gerencia uma equipe mista de funcionários efetivos e terceirizados. Os terceirizados fazem o mesmo trabalho mas têm menos benefícios.",
      question: "Como você trataria essa situação?",
      options: [
        { value: "A", label: "Trataria os efetivos melhor por serem 'da casa'", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Trataria todos com igual respeito e oportunidades", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Seguiria as políticas da empresa sem questionar", score: 40, moralLevel: "conventional" },
        { value: "D", label: "Advogaria por melhores condições para terceirizados", score: 80, moralLevel: "post_conventional" }
      ]
    }
  ],
  
  // CORAGEM MORAL (dimensionId: 6) - já tem 2, precisa de mais 8
  6: [
    {
      title: "Reunião com Diretoria",
      scenario: "Em uma reunião com a diretoria, você percebe que uma decisão importante está sendo tomada com base em dados incorretos que você conhece.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Ficaria quieto para não se expor", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Interromperia e apresentaria os dados corretos", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Falaria com seu gestor depois da reunião", score: 50, moralLevel: "conventional" },
        { value: "D", label: "Enviaria um e-mail depois com as correções", score: 60, moralLevel: "conventional" }
      ]
    },
    {
      title: "Piada Ofensiva",
      scenario: "Em um almoço de equipe, um colega sênior faz uma piada preconceituosa. Todos riem, mas você percebe que uma pessoa ficou desconfortável.",
      question: "Como você reagiria?",
      options: [
        { value: "A", label: "Riria junto para não criar clima ruim", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Expressaria desconforto com a piada", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Mudaria de assunto discretamente", score: 40, moralLevel: "conventional" },
        { value: "D", label: "Apoiaria a pessoa desconfortável depois", score: 60, moralLevel: "conventional" }
      ]
    },
    {
      title: "Projeto Fadado ao Fracasso",
      scenario: "Você percebe que um projeto importante está fadado ao fracasso, mas ninguém quer ser o portador de más notícias para a liderança.",
      question: "Qual seria sua atitude?",
      options: [
        { value: "A", label: "Esperaria o projeto falhar para não se queimar", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Apresentaria uma análise honesta dos riscos", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Sugeriria ajustes sem mencionar o fracasso iminente", score: 50, moralLevel: "conventional" },
        { value: "D", label: "Documentaria suas preocupações por escrito", score: 60, moralLevel: "conventional" }
      ]
    },
    {
      title: "Assédio Moral",
      scenario: "Você presencia um gestor de outra área tratando um subordinado de forma humilhante em público.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Não faria nada, pois não é da sua área", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Interviria no momento para proteger a pessoa", score: 80, moralLevel: "post_conventional" },
        { value: "C", label: "Reportaria ao RH ou canal de denúncias", score: 90, moralLevel: "post_conventional" },
        { value: "D", label: "Ofereceria apoio à vítima depois", score: 60, moralLevel: "conventional" }
      ]
    },
    {
      title: "Decisão Impopular",
      scenario: "Você precisa tomar uma decisão que é correta mas será muito impopular com sua equipe.",
      question: "Como você procederia?",
      options: [
        { value: "A", label: "Evitaria a decisão para manter a popularidade", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Tomaria a decisão e explicaria os motivos", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Buscaria consenso mesmo que demore mais", score: 50, moralLevel: "conventional" },
        { value: "D", label: "Delegaria a decisão para outro", score: 20, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Erro do Chefe",
      scenario: "Seu chefe cometeu um erro grave que está afetando os resultados da equipe. Ele não percebeu e ninguém quer apontar.",
      question: "O que você faria?",
      options: [
        { value: "A", label: "Deixaria ele descobrir sozinho", score: 20, moralLevel: "pre_conventional" },
        { value: "B", label: "Conversaria com ele em particular sobre o erro", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Corrigiria o erro discretamente sem mencionar", score: 40, moralLevel: "conventional" },
        { value: "D", label: "Mencionaria em reunião de forma indireta", score: 50, moralLevel: "conventional" }
      ]
    },
    {
      title: "Defesa de Colega",
      scenario: "Um colega está sendo injustamente culpado por um erro que você sabe que foi de outra pessoa.",
      question: "Qual seria sua atitude?",
      options: [
        { value: "A", label: "Não se envolveria para não criar inimizades", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Defenderia o colega e esclareceria a verdade", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Falaria com o colega em particular para apoiá-lo", score: 50, moralLevel: "conventional" },
        { value: "D", label: "Esperaria que a verdade aparecesse naturalmente", score: 20, moralLevel: "pre_conventional" }
      ]
    },
    {
      title: "Política Injusta",
      scenario: "Uma nova política da empresa é claramente injusta com um grupo de funcionários. Você é o único que parece se importar.",
      question: "Como você agiria?",
      options: [
        { value: "A", label: "Aceitaria a política sem questionar", score: 10, moralLevel: "pre_conventional" },
        { value: "B", label: "Levantaria a questão formalmente com argumentos", score: 90, moralLevel: "post_conventional" },
        { value: "C", label: "Reclamaria informalmente com colegas", score: 30, moralLevel: "conventional" },
        { value: "D", label: "Buscaria aliados antes de se manifestar", score: 60, moralLevel: "conventional" }
      ]
    }
  ]
};

async function seedQuestions() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Iniciando inserção de questões PIR Integridade...\n');
    
    let totalInserted = 0;
    
    for (const [dimensionId, questions] of Object.entries(additionalQuestions)) {
      console.log(`\nDimensão ${dimensionId}:`);
      
      // Buscar a maior ordem atual para essa dimensão
      const [maxOrderResult] = await connection.execute(
        'SELECT COALESCE(MAX(displayOrder), 0) as maxOrder FROM pirIntegrityQuestions WHERE dimensionId = ?',
        [dimensionId]
      );
      let currentOrder = Number(maxOrderResult[0].maxOrder) + 1;
      
      for (const q of questions) {
        try {
          await connection.execute(
            `INSERT INTO pirIntegrityQuestions 
             (dimensionId, questionType, title, scenario, question, options, requiresJustification, difficulty, displayOrder, active)
             VALUES (?, 'scenario', ?, ?, ?, ?, 0, 'medium', ?, 1)`,
            [
              dimensionId,
              q.title,
              q.scenario,
              q.question,
              JSON.stringify(q.options),
              currentOrder++
            ]
          );
          console.log(`  ✓ ${q.title}`);
          totalInserted++;
        } catch (error) {
          console.log(`  ✗ ${q.title}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Total de questões inseridas: ${totalInserted}`);
    
    // Verificar contagem final
    const [finalCount] = await connection.execute(`
      SELECT d.code, d.name, COUNT(q.id) as question_count 
      FROM pirIntegrityDimensions d 
      LEFT JOIN pirIntegrityQuestions q ON d.id = q.dimensionId AND q.active = 1
      GROUP BY d.id, d.code, d.name 
      ORDER BY d.displayOrder
    `);
    
    console.log('\n=== Contagem Final ===\n');
    for (const dim of finalCount) {
      console.log(`${dim.code}: ${dim.question_count} questões`);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

seedQuestions();
