-- Adicionar 16 perguntas DISC faltantes (total deve ser 40: 10 por dimensão)

-- Dominância (D) - adicionar 4 perguntas (questionNumber 7-10)
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 7, 'Eu gosto de assumir o controle das situações', 'D', 0),
('disc', 8, 'Prefiro trabalhar em ambientes competitivos', 'D', 0),
('disc', 9, 'Tenho facilidade em tomar decisões rápidas', 'D', 0),
('disc', 10, 'Gosto de liderar projetos desafiadores', 'D', 0);

-- Influência (I) - adicionar 4 perguntas (questionNumber 17-20)
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 17, 'Adoro conhecer pessoas novas', 'I', 0),
('disc', 18, 'Prefiro trabalhar em equipe do que sozinho', 'I', 0),
('disc', 19, 'Sou otimista na maioria das situações', 'I', 0),
('disc', 20, 'Gosto de compartilhar ideias e experiências', 'I', 0);

-- Estabilidade (S) - adicionar 4 perguntas (questionNumber 27-30)
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 27, 'Valorizo a harmonia no ambiente de trabalho', 'S', 0),
('disc', 28, 'Prefiro rotinas previsíveis', 'S', 0),
('disc', 29, 'Sou paciente com processos lentos', 'S', 0),
('disc', 30, 'Gosto de ajudar os outros', 'S', 0);

-- Conformidade (C) - adicionar 4 perguntas (questionNumber 37-40)
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 37, 'Presto atenção aos detalhes', 'C', 0),
('disc', 38, 'Prefiro seguir procedimentos estabelecidos', 'C', 0),
('disc', 39, 'Gosto de analisar dados antes de decidir', 'C', 0),
('disc', 40, 'Valorizo a precisão no trabalho', 'C', 0);
