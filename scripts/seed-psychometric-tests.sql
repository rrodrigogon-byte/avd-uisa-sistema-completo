-- Perguntas do Teste DISC (40 perguntas, 10 por dimensão)
-- Dimensões: dominance (D), influence (I), steadiness (S), compliance (C)

-- DOMINÂNCIA (D) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 1, 'Eu gosto de assumir o controle em situações desafiadoras', 'dominance', false),
('disc', 2, 'Prefiro tomar decisões rápidas e assertivas', 'dominance', false),
('disc', 3, 'Sou competitivo e gosto de vencer', 'dominance', false),
('disc', 4, 'Enfrento problemas de frente sem hesitar', 'dominance', false),
('disc', 5, 'Gosto de desafios e situações de alta pressão', 'dominance', false),
('disc', 6, 'Sou direto ao expressar minhas opiniões', 'dominance', false),
('disc', 7, 'Prefiro liderar do que seguir', 'dominance', false),
('disc', 8, 'Tomo iniciativa facilmente', 'dominance', false),
('disc', 9, 'Gosto de definir metas ambiciosas', 'dominance', false),
('disc', 10, 'Sou determinado em alcançar resultados', 'dominance', false);

-- INFLUÊNCIA (I) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 11, 'Gosto de conhecer pessoas novas', 'influence', false),
('disc', 12, 'Sou entusiasta e otimista', 'influence', false),
('disc', 13, 'Prefiro trabalhar em equipe', 'influence', false),
('disc', 14, 'Sou bom em persuadir outras pessoas', 'influence', false),
('disc', 15, 'Gosto de ser o centro das atenções', 'influence', false),
('disc', 16, 'Sou comunicativo e expressivo', 'influence', false),
('disc', 17, 'Gosto de motivar e inspirar outros', 'influence', false),
('disc', 18, 'Prefiro ambientes sociais e dinâmicos', 'influence', false),
('disc', 19, 'Sou criativo em resolver problemas', 'influence', false),
('disc', 20, 'Gosto de compartilhar ideias e experiências', 'influence', false);

-- ESTABILIDADE (S) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 21, 'Prefiro rotinas e processos previsíveis', 'steadiness', false),
('disc', 22, 'Sou paciente e calmo sob pressão', 'steadiness', false),
('disc', 23, 'Valorizo harmonia e cooperação', 'steadiness', false),
('disc', 24, 'Sou leal e confiável', 'steadiness', false),
('disc', 25, 'Prefiro mudanças graduais a mudanças abruptas', 'steadiness', false),
('disc', 26, 'Sou um bom ouvinte', 'steadiness', false),
('disc', 27, 'Gosto de ajudar e apoiar outras pessoas', 'steadiness', false),
('disc', 28, 'Prefiro ambientes estáveis e seguros', 'steadiness', false),
('disc', 29, 'Sou consistente em meu trabalho', 'steadiness', false),
('disc', 30, 'Valorizo relacionamentos de longo prazo', 'steadiness', false);

-- CONFORMIDADE (C) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('disc', 31, 'Sou detalhista e preciso', 'compliance', false),
('disc', 32, 'Prefiro seguir regras e procedimentos', 'compliance', false),
('disc', 33, 'Gosto de analisar dados e informações', 'compliance', false),
('disc', 34, 'Sou organizado e metódico', 'compliance', false),
('disc', 35, 'Valorizo qualidade acima de velocidade', 'compliance', false),
('disc', 36, 'Prefiro ter todas as informações antes de decidir', 'compliance', false),
('disc', 37, 'Sou cuidadoso e evito erros', 'compliance', false),
('disc', 38, 'Gosto de trabalhar com padrões e normas', 'compliance', false),
('disc', 39, 'Sou sistemático em minha abordagem', 'compliance', false),
('disc', 40, 'Valorizo precisão e exatidão', 'compliance', false);

-- Perguntas do Teste Big Five (50 perguntas, 10 por dimensão)
-- Dimensões: openness (O), conscientiousness (C), extraversion (E), agreeableness (A), neuroticism (N)

-- ABERTURA (O) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('bigfive', 1, 'Tenho uma imaginação ativa', 'openness', false),
('bigfive', 2, 'Gosto de explorar novas ideias', 'openness', false),
('bigfive', 3, 'Aprecio arte e beleza', 'openness', false),
('bigfive', 4, 'Sou curioso sobre muitas coisas diferentes', 'openness', false),
('bigfive', 5, 'Gosto de pensar sobre conceitos abstratos', 'openness', false),
('bigfive', 6, 'Prefiro rotina a variedade', 'openness', true),
('bigfive', 7, 'Sou criativo e inovador', 'openness', false),
('bigfive', 8, 'Gosto de experimentar coisas novas', 'openness', false),
('bigfive', 9, 'Tenho interesses variados', 'openness', false),
('bigfive', 10, 'Aprecio discussões filosóficas', 'openness', false);

-- CONSCIENCIOSIDADE (C) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('bigfive', 11, 'Sou organizado e arrumado', 'conscientiousness', false),
('bigfive', 12, 'Faço planos e os sigo', 'conscientiousness', false),
('bigfive', 13, 'Sou confiável e responsável', 'conscientiousness', false),
('bigfive', 14, 'Trabalho duro para alcançar meus objetivos', 'conscientiousness', false),
('bigfive', 15, 'Presto atenção aos detalhes', 'conscientiousness', false),
('bigfive', 16, 'Costumo deixar as coisas para depois', 'conscientiousness', true),
('bigfive', 17, 'Sou disciplinado e focado', 'conscientiousness', false),
('bigfive', 18, 'Cumpro prazos consistentemente', 'conscientiousness', false),
('bigfive', 19, 'Sou eficiente em meu trabalho', 'conscientiousness', false),
('bigfive', 20, 'Penso antes de agir', 'conscientiousness', false);

-- EXTROVERSÃO (E) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('bigfive', 21, 'Sou a alma da festa', 'extraversion', false),
('bigfive', 22, 'Gosto de estar cercado de pessoas', 'extraversion', false),
('bigfive', 23, 'Inicio conversas facilmente', 'extraversion', false),
('bigfive', 24, 'Sou energético e ativo', 'extraversion', false),
('bigfive', 25, 'Gosto de ser o centro das atenções', 'extraversion', false),
('bigfive', 26, 'Prefiro ficar em casa a sair', 'extraversion', true),
('bigfive', 27, 'Sou assertivo e confiante', 'extraversion', false),
('bigfive', 28, 'Gosto de atividades em grupo', 'extraversion', false),
('bigfive', 29, 'Sou sociável e comunicativo', 'extraversion', false),
('bigfive', 30, 'Tenho muita energia', 'extraversion', false);

-- AMABILIDADE (A) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('bigfive', 31, 'Sou gentil e compassivo', 'agreeableness', false),
('bigfive', 32, 'Confio nas pessoas', 'agreeableness', false),
('bigfive', 33, 'Gosto de ajudar os outros', 'agreeableness', false),
('bigfive', 34, 'Sou cooperativo e colaborativo', 'agreeableness', false),
('bigfive', 35, 'Evito conflitos', 'agreeableness', false),
('bigfive', 36, 'Costumo ser crítico com os outros', 'agreeableness', true),
('bigfive', 37, 'Sou empático e compreensivo', 'agreeableness', false),
('bigfive', 38, 'Gosto de fazer as pessoas felizes', 'agreeableness', false),
('bigfive', 39, 'Sou tolerante e paciente', 'agreeableness', false),
('bigfive', 40, 'Valorizo harmonia nos relacionamentos', 'agreeableness', false);

-- NEUROTICISMO (N) - 10 perguntas
INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES
('bigfive', 41, 'Fico estressado facilmente', 'neuroticism', false),
('bigfive', 42, 'Me preocupo muito com as coisas', 'neuroticism', false),
('bigfive', 43, 'Meu humor muda frequentemente', 'neuroticism', false),
('bigfive', 44, 'Fico ansioso em situações novas', 'neuroticism', false),
('bigfive', 45, 'Sou sensível a críticas', 'neuroticism', false),
('bigfive', 46, 'Sou calmo e relaxado', 'neuroticism', true),
('bigfive', 47, 'Fico irritado facilmente', 'neuroticism', false),
('bigfive', 48, 'Tenho dificuldade em lidar com estresse', 'neuroticism', false),
('bigfive', 49, 'Sinto-me inseguro frequentemente', 'neuroticism', false),
('bigfive', 50, 'Fico triste facilmente', 'neuroticism', false);
