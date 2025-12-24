-- ============================================================================
-- PERGUNTAS DE AVALIAÇÃO 360°
-- Sistema AVD - Avaliação de Desempenho
-- ============================================================================

-- PERGUNTAS DE AUTOAVALIAÇÃO
INSERT INTO evaluationQuestions (code, question, category, type, weight, active) VALUES
('AUTO_001', 'Como você avalia seu desempenho geral no período?', 'autoavaliacao_desempenho', 'escala', 10, true),
('AUTO_002', 'Você atingiu as metas estabelecidas para o período?', 'autoavaliacao_metas', 'escala', 10, true),
('AUTO_003', 'Como você avalia sua capacidade de trabalhar em equipe?', 'autoavaliacao_competencias', 'escala', 8, true),
('AUTO_004', 'Como você avalia sua comunicação com colegas e gestores?', 'autoavaliacao_competencias', 'escala', 8, true),
('AUTO_005', 'Você demonstrou iniciativa e proatividade no período?', 'autoavaliacao_competencias', 'escala', 7, true),
('AUTO_006', 'Como você avalia sua capacidade de resolver problemas?', 'autoavaliacao_competencias', 'escala', 7, true),
('AUTO_007', 'Você buscou desenvolvimento profissional no período?', 'autoavaliacao_desenvolvimento', 'escala', 6, true),
('AUTO_008', 'Quais foram suas principais conquistas no período?', 'autoavaliacao_qualitativa', 'texto', 5, true),
('AUTO_009', 'Quais foram seus principais desafios e como os enfrentou?', 'autoavaliacao_qualitativa', 'texto', 5, true),
('AUTO_010', 'Quais áreas você identifica como oportunidades de melhoria?', 'autoavaliacao_desenvolvimento', 'texto', 5, true);

-- PERGUNTAS PARA AVALIAÇÃO DO GESTOR
INSERT INTO evaluationQuestions (code, question, category, type, weight, active) VALUES
('GEST_001', 'Como você avalia o desempenho geral do colaborador no período?', 'gestor_desempenho', 'escala', 10, true),
('GEST_002', 'O colaborador atingiu as metas estabelecidas?', 'gestor_metas', 'escala', 10, true),
('GEST_003', 'Como você avalia a qualidade do trabalho entregue?', 'gestor_desempenho', 'escala', 9, true),
('GEST_004', 'O colaborador demonstra comprometimento com os objetivos da equipe?', 'gestor_competencias', 'escala', 8, true),
('GEST_005', 'Como você avalia a capacidade de trabalho em equipe do colaborador?', 'gestor_competencias', 'escala', 8, true),
('GEST_006', 'O colaborador demonstra iniciativa e proatividade?', 'gestor_competencias', 'escala', 8, true),
('GEST_007', 'Como você avalia a capacidade de comunicação do colaborador?', 'gestor_competencias', 'escala', 7, true),
('GEST_008', 'O colaborador demonstra capacidade de resolver problemas de forma autônoma?', 'gestor_competencias', 'escala', 7, true),
('GEST_009', 'O colaborador demonstra potencial para assumir novas responsabilidades?', 'gestor_potencial', 'escala', 7, true),
('GEST_010', 'Como você avalia a adaptabilidade do colaborador a mudanças?', 'gestor_competencias', 'escala', 6, true),
('GEST_011', 'O colaborador busca desenvolvimento profissional e aprendizado contínuo?', 'gestor_desenvolvimento', 'escala', 6, true),
('GEST_012', 'Quais são os principais pontos fortes do colaborador?', 'gestor_qualitativa', 'texto', 5, true),
('GEST_013', 'Quais são as principais oportunidades de desenvolvimento do colaborador?', 'gestor_desenvolvimento', 'texto', 5, true),
('GEST_014', 'O colaborador está pronto para promoção ou movimentação lateral?', 'gestor_potencial', 'escala', 5, true);

-- PERGUNTAS PARA AVALIAÇÃO DE PARES
INSERT INTO evaluationQuestions (code, question, category, type, weight, active) VALUES
('PAR_001', 'Como você avalia a colaboração deste colega com a equipe?', 'par_competencias', 'escala', 8, true),
('PAR_002', 'Este colega demonstra respeito e ética profissional?', 'par_competencias', 'escala', 8, true),
('PAR_003', 'Como você avalia a comunicação deste colega?', 'par_competencias', 'escala', 7, true),
('PAR_004', 'Este colega compartilha conhecimentos e apoia os colegas?', 'par_competencias', 'escala', 7, true),
('PAR_005', 'Este colega demonstra comprometimento com os objetivos da equipe?', 'par_competencias', 'escala', 7, true),
('PAR_006', 'Como você avalia a capacidade deste colega de resolver conflitos?', 'par_competencias', 'escala', 6, true);

-- PERGUNTAS PARA AVALIAÇÃO DE SUBORDINADOS
INSERT INTO evaluationQuestions (code, question, category, type, weight, active) VALUES
('SUB_001', 'Como você avalia a liderança do seu gestor?', 'subordinado_lideranca', 'escala', 10, true),
('SUB_002', 'Seu gestor fornece feedback claro e construtivo?', 'subordinado_lideranca', 'escala', 9, true),
('SUB_003', 'Seu gestor apoia seu desenvolvimento profissional?', 'subordinado_desenvolvimento', 'escala', 9, true),
('SUB_004', 'Como você avalia a comunicação do seu gestor?', 'subordinado_competencias', 'escala', 8, true),
('SUB_005', 'Seu gestor reconhece e valoriza o trabalho da equipe?', 'subordinado_lideranca', 'escala', 8, true),
('SUB_006', 'Seu gestor demonstra transparência nas decisões?', 'subordinado_lideranca', 'escala', 7, true),
('SUB_007', 'Seu gestor cria um ambiente de trabalho positivo e colaborativo?', 'subordinado_lideranca', 'escala', 7, true),
('SUB_008', 'Seu gestor delega responsabilidades de forma adequada?', 'subordinado_lideranca', 'escala', 6, true),
('SUB_009', 'Seu gestor está disponível quando você precisa de suporte?', 'subordinado_lideranca', 'escala', 6, true),
('SUB_010', 'Como você avalia a capacidade do seu gestor de resolver conflitos?', 'subordinado_lideranca', 'escala', 5, true);

-- PERGUNTAS PARA CONSENSO
INSERT INTO evaluationQuestions (code, question, category, type, weight, active) VALUES
('CONS_001', 'Após a discussão, qual a avaliação consensual do desempenho geral?', 'consenso_desempenho', 'escala', 10, true),
('CONS_002', 'Quais foram as principais conquistas reconhecidas em consenso?', 'consenso_qualitativa', 'texto', 8, true),
('CONS_003', 'Quais são os pontos de melhoria acordados?', 'consenso_desenvolvimento', 'texto', 8, true),
('CONS_004', 'Quais metas foram acordadas para o próximo período?', 'consenso_metas', 'texto', 8, true),
('CONS_005', 'Quais ações de desenvolvimento foram acordadas?', 'consenso_desenvolvimento', 'texto', 7, true),
('CONS_006', 'Há alinhamento sobre o potencial e próximos passos na carreira?', 'consenso_potencial', 'escala', 7, true);

-- PERGUNTAS PARA CALIBRAÇÃO (DIRETORES)
INSERT INTO evaluationQuestions (code, question, category, type, weight, active) VALUES
('CALIB_001', 'Após calibração, qual a avaliação final de desempenho?', 'calibracao_desempenho', 'escala', 10, true),
('CALIB_002', 'Qual o posicionamento do colaborador na Matriz 9-Box?', 'calibracao_potencial', 'multipla_escolha', 10, true),
('CALIB_003', 'O colaborador é elegível para promoção?', 'calibracao_potencial', 'escala', 8, true),
('CALIB_004', 'O colaborador é elegível para bônus/PLR diferenciado?', 'calibracao_desempenho', 'escala', 8, true),
('CALIB_005', 'O colaborador deve ser incluído em plano de sucessão?', 'calibracao_potencial', 'escala', 7, true),
('CALIB_006', 'Há necessidade de ações corretivas ou plano de melhoria?', 'calibracao_desenvolvimento', 'escala', 7, true);
