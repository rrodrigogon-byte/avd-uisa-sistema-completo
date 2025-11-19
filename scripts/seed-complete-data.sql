-- Script de Seed Completo para Sistema AVD UISA
-- Popula banco com dados realistas de teste

-- ============================================
-- 1. ADICIONAR MARCOS (MILESTONES) ÀS METAS
-- ============================================

-- Meta 30001: Aumentar receita em 15%
INSERT INTO goalMilestones (goalId, title, description, dueDate, status, progress) VALUES
(30001, 'Análise de mercado completa', 'Realizar pesquisa de mercado e identificar oportunidades', '2025-03-31', 'completed', 100),
(30001, 'Implementar estratégia de pricing', 'Definir nova estratégia de precificação', '2025-06-30', 'in_progress', 60),
(30001, 'Lançar campanha de marketing', 'Executar campanha de marketing digital', '2025-09-30', 'pending', 0);

-- Meta 30002: Reduzir turnover em 20%
INSERT INTO goalMilestones (goalId, title, description, dueDate, status, progress) VALUES
(30002, 'Pesquisa de clima organizacional', 'Aplicar pesquisa e analisar resultados', '2025-04-30', 'completed', 100),
(30002, 'Implementar programa de benefícios', 'Lançar novo pacote de benefícios', '2025-07-31', 'in_progress', 45),
(30002, 'Programa de desenvolvimento de líderes', 'Treinar gestores em liderança', '2025-10-31', 'pending', 0);

-- Meta 30003: Melhorar NPS em 25 pontos
INSERT INTO goalMilestones (goalId, title, description, dueDate, status, progress) VALUES
(30003, 'Mapear jornada do cliente', 'Identificar pontos de dor na experiência', '2025-03-15', 'completed', 100),
(30003, 'Implementar melhorias no atendimento', 'Treinar equipe e otimizar processos', '2025-06-15', 'in_progress', 70),
(30003, 'Lançar programa de fidelidade', 'Criar e lançar programa de recompensas', '2025-09-15', 'pending', 0);

-- Meta 30004: Concluir certificação PMP
INSERT INTO goalMilestones (goalId, title, description, dueDate, status, progress) VALUES
(30004, 'Completar curso preparatório', 'Finalizar 35 horas de treinamento', '2025-05-31', 'completed', 100),
(30004, 'Realizar simulados', 'Fazer 5 simulados completos', '2025-07-31', 'in_progress', 80),
(30004, 'Agendar e realizar prova', 'Fazer exame de certificação', '2025-08-31', 'pending', 0);

-- Meta 30005: Liderar projeto de transformação digital
INSERT INTO goalMilestones (goalId, title, description, dueDate, status, progress) VALUES
(30005, 'Definir escopo e roadmap', 'Planejar fases do projeto', '2025-04-30', 'completed', 100),
(30005, 'Implementar fase 1 (CRM)', 'Migrar para novo sistema de CRM', '2025-08-31', 'in_progress', 55),
(30005, 'Implementar fase 2 (ERP)', 'Integrar sistemas de gestão', '2025-12-31', 'pending', 0);

-- ============================================
-- 2. CRIAR EVIDÊNCIAS (GOALEVID ENCES) PARA METAS
-- ============================================

INSERT INTO goalEvidences (goalId, employeeId, title, description, fileUrl, fileType, uploadedAt) VALUES
(30001, 120001, 'Relatório de Análise de Mercado Q1', 'Pesquisa completa com 500 respondentes', 'https://storage.uisa.com.br/evidences/market-research-q1-2025.pdf', 'pdf', NOW()),
(30001, 120001, 'Dashboard de Receita', 'Acompanhamento mensal de receita vs meta', 'https://storage.uisa.com.br/evidences/revenue-dashboard.xlsx', 'excel', NOW()),
(30002, 120001, 'Pesquisa de Clima 2025', 'Resultados da pesquisa com 95% de participação', 'https://storage.uisa.com.br/evidences/clima-2025.pdf', 'pdf', NOW()),
(30003, 120001, 'Mapa de Jornada do Cliente', 'Análise de touchpoints e pain points', 'https://storage.uisa.com.br/evidences/customer-journey.pdf', 'pdf', NOW()),
(30004, 120001, 'Certificado de Conclusão do Curso', 'Curso preparatório PMP - 35 horas', 'https://storage.uisa.com.br/evidences/pmp-certificate.pdf', 'pdf', NOW()),
(30005, 120001, 'Roadmap de Transformação Digital', 'Plano detalhado com 3 fases', 'https://storage.uisa.com.br/evidences/digital-roadmap.pdf', 'pdf', NOW());

-- ============================================
-- 3. POPULAR AVALIAÇÕES 360° COM DADOS REAIS
-- ============================================

-- Criar 3 avaliações 360° em diferentes estágios
INSERT INTO evaluations360 (employeeId, cycleId, status, selfScore, managerScore, peersScore, subordinatesScore, finalScore, workflowStatus, createdAt) VALUES
(120001, 1, 'em_andamento', 4.2, 4.5, NULL, NULL, NULL, 'pending_peers', '2025-01-15'),
(120002, 1, 'em_andamento', 3.8, 4.0, 4.1, NULL, NULL, 'pending_subordinates', '2025-01-10'),
(120003, 1, 'concluida', 4.5, 4.3, 4.4, 4.2, 4.35, 'completed', '2025-01-05');

-- Adicionar respostas para avaliação concluída (ID 3)
INSERT INTO evaluation360Responses (evaluationId, questionId, evaluatorType, score, createdAt) VALUES
-- Autoavaliação
(3, 1, 'self', 5, '2025-01-05'),
(3, 2, 'self', 4, '2025-01-05'),
(3, 3, 'self', 5, '2025-01-05'),
(3, 4, 'self', 4, '2025-01-05'),
(3, 5, 'self', 5, '2025-01-05'),
-- Gestor
(3, 1, 'manager', 4, '2025-01-06'),
(3, 2, 'manager', 4, '2025-01-06'),
(3, 3, 'manager', 5, '2025-01-06'),
(3, 4, 'manager', 4, '2025-01-06'),
(3, 5, 'manager', 4, '2025-01-06'),
-- Pares
(3, 1, 'peer', 4, '2025-01-07'),
(3, 2, 'peer', 5, '2025-01-07'),
(3, 3, 'peer', 4, '2025-01-07'),
(3, 4, 'peer', 5, '2025-01-07'),
(3, 5, 'peer', 4, '2025-01-07'),
-- Subordinados
(3, 1, 'subordinate', 4, '2025-01-08'),
(3, 2, 'subordinate', 4, '2025-01-08'),
(3, 3, 'subordinate', 4, '2025-01-08'),
(3, 4, 'subordinate', 5, '2025-01-08'),
(3, 5, 'subordinate', 4, '2025-01-08');

-- ============================================
-- 4. POPULAR PDI INTELIGENTE COM AÇÕES
-- ============================================

-- Criar 3 PDIs ativos
INSERT INTO pdiIntelligent (employeeId, currentPositionId, targetPositionId, duration, objectives, status, createdAt) VALUES
(120001, 1, 5, 12, 'Desenvolver habilidades de liderança estratégica e gestão de projetos complexos', 'em_andamento', '2025-01-01'),
(120002, 2, 6, 18, 'Aprimorar conhecimentos técnicos em IA e Machine Learning', 'em_andamento', '2025-01-15'),
(120003, 3, 7, 24, 'Desenvolver visão de negócios e habilidades de gestão financeira', 'aprovado', '2025-02-01');

-- Adicionar ações ao PDI 1 (modelo 70-20-10)
INSERT INTO pdiActions (pdiId, type, title, description, dueDate, status, priority, progress) VALUES
-- 70% Experiência Prática
(1, 'pratica', 'Liderar projeto de transformação digital', 'Assumir liderança do projeto estratégico de digitalização', '2025-06-30', 'em_andamento', 'alta', 45),
(1, 'pratica', 'Gerenciar equipe multifuncional', 'Coordenar time de 15 pessoas de diferentes áreas', '2025-09-30', 'em_andamento', 'alta', 30),
(1, 'pratica', 'Apresentar resultados para diretoria', 'Preparar e apresentar relatórios mensais de progresso', '2025-12-31', 'nao_iniciado', 'media', 0),
-- 20% Mentoria e Networking
(1, 'mentoria', 'Mentoria com Diretor de Operações', 'Reuniões quinzenais para discussão de estratégia', '2025-12-31', 'em_andamento', 'alta', 50),
(1, 'mentoria', 'Participar de comitê executivo', 'Assistir reuniões mensais do comitê', '2025-12-31', 'em_andamento', 'media', 40),
-- 10% Treinamento Formal
(1, 'curso', 'MBA em Gestão Estratégica', 'Curso de 360 horas em universidade renomada', '2025-12-31', 'em_andamento', 'alta', 25),
(1, 'curso', 'Certificação PMP', 'Project Management Professional', '2025-08-31', 'em_andamento', 'alta', 80);

-- Adicionar ações ao PDI 2
INSERT INTO pdiActions (pdiId, type, title, description, dueDate, status, priority, progress) VALUES
(2, 'pratica', 'Desenvolver modelo de ML para previsão de vendas', 'Criar e implementar modelo preditivo', '2025-07-31', 'em_andamento', 'alta', 35),
(2, 'pratica', 'Automatizar processos com IA', 'Identificar e automatizar 5 processos manuais', '2025-10-31', 'nao_iniciado', 'media', 0),
(2, 'mentoria', 'Mentoria com especialista em IA', 'Reuniões semanais para discussão técnica', '2025-12-31', 'em_andamento', 'alta', 60),
(2, 'curso', 'Curso de Deep Learning', 'Especialização em redes neurais profundas', '2025-09-30', 'em_andamento', 'alta', 40),
(2, 'curso', 'Certificação TensorFlow Developer', 'Certificação oficial do Google', '2025-11-30', 'nao_iniciado', 'media', 0);

-- ============================================
-- 5. POPULAR NINE BOX COM POSICIONAMENTOS
-- ============================================

-- Adicionar 20 posicionamentos Nine Box
INSERT INTO nineBoxPositions (employeeId, performance, potential, quadrant, lastReviewDate, reviewedBy) VALUES
(120001, 3, 3, 'Alto Desempenho / Alto Potencial', '2025-01-15', 1),
(120002, 3, 2, 'Alto Desempenho / Potencial Moderado', '2025-01-15', 1),
(120003, 2, 3, 'Desempenho Moderado / Alto Potencial', '2025-01-15', 1),
(120004, 3, 3, 'Alto Desempenho / Alto Potencial', '2025-01-15', 1),
(120005, 2, 2, 'Desempenho Moderado / Potencial Moderado', '2025-01-15', 1),
(120006, 3, 2, 'Alto Desempenho / Potencial Moderado', '2025-01-15', 1),
(120007, 2, 3, 'Desempenho Moderado / Alto Potencial', '2025-01-15', 1),
(120008, 3, 3, 'Alto Desempenho / Alto Potencial', '2025-01-15', 1),
(120009, 1, 2, 'Baixo Desempenho / Potencial Moderado', '2025-01-15', 1),
(120010, 2, 2, 'Desempenho Moderado / Potencial Moderado', '2025-01-15', 1);

-- ============================================
-- 6. POPULAR FEEDBACKS CONTÍNUOS
-- ============================================

INSERT INTO feedbacks (fromEmployeeId, toEmployeeId, type, category, message, isAnonymous, createdAt) VALUES
(1, 120001, 'positivo', 'lideranca', 'Excelente condução da reunião de planejamento estratégico. Demonstrou clareza na comunicação e capacidade de engajar a equipe.', false, '2025-01-10'),
(1, 120001, 'construtivo', 'comunicacao', 'Sugiro melhorar a frequência de updates sobre o projeto. A equipe precisa de mais visibilidade sobre o progresso.', false, '2025-01-12'),
(120002, 120001, 'positivo', 'trabalho_equipe', 'Ótima colaboração no projeto de transformação digital. Sempre disponível para ajudar e compartilhar conhecimento.', false, '2025-01-15'),
(120003, 120001, 'positivo', 'resultados', 'Parabéns pela entrega do relatório de mercado. Análise profunda e insights valiosos para a estratégia.', false, '2025-01-18'),
(1, 120002, 'positivo', 'inovacao', 'Implementação do modelo de ML superou expectativas. Redução de 30% no tempo de processamento.', false, '2025-01-20');

-- ============================================
-- 7. POPULAR BADGES E CONQUISTAS
-- ============================================

-- Conceder badges aos colaboradores
INSERT INTO employeeBadges (employeeId, badgeId, earnedAt, reason) VALUES
(120001, 1, '2025-01-15', 'Concluiu primeira meta SMART com 100% de progresso'),
(120001, 2, '2025-01-18', 'Recebeu 5 feedbacks positivos em um mês'),
(120001, 3, '2025-01-20', 'PDI aprovado com nota máxima'),
(120002, 1, '2025-01-16', 'Concluiu meta de desenvolvimento técnico'),
(120002, 4, '2025-01-22', 'Completou 3 ações do PDI antes do prazo'),
(120003, 2, '2025-01-19', 'Recebeu 5 feedbacks positivos em um mês'),
(120003, 5, '2025-01-21', 'Avaliação 360° concluída com média 4.35');

-- ============================================
-- 8. ATUALIZAR PONTOS DE GAMIFICAÇÃO
-- ============================================

UPDATE employees SET gamificationPoints = 150 WHERE id = 120001;
UPDATE employees SET gamificationPoints = 120 WHERE id = 120002;
UPDATE employees SET gamificationPoints = 100 WHERE id = 120003;
UPDATE employees SET gamificationPoints = 80 WHERE id = 120004;
UPDATE employees SET gamificationPoints = 60 WHERE id = 120005;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

SELECT 'Seed completo executado com sucesso!' AS status;
SELECT COUNT(*) AS total_milestones FROM goalMilestones;
SELECT COUNT(*) AS total_evidences FROM goalEvidences;
SELECT COUNT(*) AS total_evaluations FROM evaluations360;
SELECT COUNT(*) AS total_pdis FROM pdiIntelligent;
SELECT COUNT(*) AS total_pdi_actions FROM pdiActions;
SELECT COUNT(*) AS total_nine_box FROM nineBoxPositions;
SELECT COUNT(*) AS total_feedbacks FROM feedbacks;
SELECT COUNT(*) AS total_badges FROM employeeBadges;
