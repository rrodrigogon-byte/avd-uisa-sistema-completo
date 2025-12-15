-- Script de Seed para Questões do Teste DISC
-- 24 questões (6 por dimensão: Dominância, Influência, Estabilidade, Conformidade)

-- Limpar questões existentes do DISC
DELETE FROM testQuestions WHERE testType = 'disc';

-- Questões de Dominância (D)
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 1, 'Eu gosto de assumir o controle de situações e liderar projetos.', 'dominance', false),
('disc', 2, 'Prefiro tomar decisões rápidas e agir imediatamente.', 'dominance', false),
('disc', 3, 'Sou competitivo(a) e gosto de desafios.', 'dominance', false),
('disc', 4, 'Tenho facilidade em confrontar problemas diretamente.', 'dominance', false),
('disc', 5, 'Prefiro resultados rápidos a processos longos.', 'dominance', false),
('disc', 6, 'Sou assertivo(a) e direto(a) na comunicação.', 'dominance', false);

-- Questões de Influência (I)
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 7, 'Gosto de trabalhar em equipe e colaborar com outras pessoas.', 'influence', false),
('disc', 8, 'Sou entusiasta e otimista em relação a novos projetos.', 'influence', false),
('disc', 9, 'Tenho facilidade em persuadir e motivar outras pessoas.', 'influence', false),
('disc', 10, 'Prefiro ambientes sociais e interativos.', 'influence', false),
('disc', 11, 'Sou expressivo(a) e demonstro minhas emoções facilmente.', 'influence', false),
('disc', 12, 'Gosto de criar relacionamentos e fazer networking.', 'influence', false);

-- Questões de Estabilidade (S)
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 13, 'Prefiro rotinas previsíveis e ambientes estáveis.', 'steadiness', false),
('disc', 14, 'Sou paciente e calmo(a) em situações de pressão.', 'steadiness', false),
('disc', 15, 'Gosto de ajudar e apoiar outras pessoas.', 'steadiness', false),
('disc', 16, 'Prefiro trabalhar em um ritmo constante e sem pressa.', 'steadiness', false),
('disc', 17, 'Sou leal e valorizo relacionamentos de longo prazo.', 'steadiness', false),
('disc', 18, 'Evito conflitos e busco harmonia no ambiente.', 'steadiness', false);

-- Questões de Conformidade (C)
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 19, 'Sou detalhista e gosto de seguir procedimentos.', 'compliance', false),
('disc', 20, 'Prefiro analisar dados antes de tomar decisões.', 'compliance', false),
('disc', 21, 'Valorizo precisão e qualidade no trabalho.', 'compliance', false),
('disc', 22, 'Gosto de trabalhar de forma organizada e sistemática.', 'compliance', false),
('disc', 23, 'Prefiro ter regras claras e padrões definidos.', 'compliance', false),
('disc', 24, 'Sou cauteloso(a) e evito riscos desnecessários.', 'compliance', false);

-- Verificar inserção
SELECT testType, dimension, COUNT(*) as total 
FROM testQuestions 
WHERE testType = 'disc' 
GROUP BY testType, dimension;

SELECT 'Questões DISC inseridas com sucesso!' AS status;
