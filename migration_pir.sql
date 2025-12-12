-- ============================================================================
-- MIGRATION: Adicionar Teste PIR ao Sistema AVD UISA
-- Data: 12/12/2025
-- Descrição: Adiciona suporte completo ao Teste PIR (Perfil de Interesses e Reações)
-- ============================================================================

-- PASSO 1: Modificar enum testType para incluir 'pir'
-- Nota: MySQL não suporta ALTER ENUM diretamente, então precisamos recriar as colunas

-- 1.1: Adicionar coluna temporária em psychometricTests
ALTER TABLE `psychometricTests` 
ADD COLUMN `testType_new` ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors', 'pir') NOT NULL AFTER `testType`;

-- 1.2: Copiar dados da coluna antiga para a nova
UPDATE `psychometricTests` SET `testType_new` = `testType`;

-- 1.3: Remover coluna antiga e renomear a nova
ALTER TABLE `psychometricTests` DROP COLUMN `testType`;
ALTER TABLE `psychometricTests` CHANGE COLUMN `testType_new` `testType` ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors', 'pir') NOT NULL;

-- 1.4: Repetir para testQuestions
ALTER TABLE `testQuestions` 
ADD COLUMN `testType_new` ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors', 'pir') NOT NULL AFTER `testType`;

UPDATE `testQuestions` SET `testType_new` = `testType`;

ALTER TABLE `testQuestions` DROP COLUMN `testType`;
ALTER TABLE `testQuestions` CHANGE COLUMN `testType_new` `testType` ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors', 'pir') NOT NULL;

-- 1.5: Repetir para testInvitations
ALTER TABLE `testInvitations` 
ADD COLUMN `testType_new` ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors', 'pir') NOT NULL AFTER `testType`;

UPDATE `testInvitations` SET `testType_new` = `testType`;

ALTER TABLE `testInvitations` DROP COLUMN `testType`;
ALTER TABLE `testInvitations` CHANGE COLUMN `testType_new` `testType` ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors', 'pir') NOT NULL;

-- 1.6: Repetir para testResults
ALTER TABLE `testResults` 
ADD COLUMN `testType_new` ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors', 'pir') NOT NULL AFTER `testType`;

UPDATE `testResults` SET `testType_new` = `testType`;

ALTER TABLE `testResults` DROP COLUMN `testType`;
ALTER TABLE `testResults` CHANGE COLUMN `testType_new` `testType` ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors', 'pir') NOT NULL;

-- ============================================================================
-- PASSO 2: Adicionar campos para candidatos externos em testInvitations
-- ============================================================================

-- 2.1: Tornar employeeId nullable
ALTER TABLE `testInvitations` 
MODIFY COLUMN `employeeId` INT NULL;

-- 2.2: Adicionar campos para candidatos externos
ALTER TABLE `testInvitations` 
ADD COLUMN `isExternalCandidate` BOOLEAN NOT NULL DEFAULT FALSE AFTER `employeeId`,
ADD COLUMN `candidateName` VARCHAR(255) NULL AFTER `isExternalCandidate`,
ADD COLUMN `candidateEmail` VARCHAR(320) NULL AFTER `candidateName`;

-- ============================================================================
-- PASSO 3: Tornar employeeId nullable em testResults
-- ============================================================================

ALTER TABLE `testResults` 
MODIFY COLUMN `employeeId` INT NULL;

-- ============================================================================
-- PASSO 4: Inserir as 60 questões do Teste PIR
-- ============================================================================

-- Dimensão 1: Interesse em Pessoas (IP) - Questões 1-10
INSERT INTO `testQuestions` (`testType`, `questionNumber`, `questionText`, `dimension`, `reverse`) VALUES
('pir', 1, 'Gosto de trabalhar em equipe e colaborar com outras pessoas', 'IP', 0),
('pir', 2, 'Prefiro atividades que envolvem contato direto com clientes ou usuários', 'IP', 0),
('pir', 3, 'Me sinto energizado(a) após interagir com muitas pessoas', 'IP', 0),
('pir', 4, 'Tenho facilidade para entender as emoções e necessidades dos outros', 'IP', 0),
('pir', 5, 'Prefiro trabalhar sozinho(a) a trabalhar em grupo', 'IP', 1),
('pir', 6, 'Gosto de ajudar outras pessoas a resolverem seus problemas', 'IP', 0),
('pir', 7, 'Me sinto confortável ao falar em público ou conduzir reuniões', 'IP', 0),
('pir', 8, 'Prefiro atividades que não exigem muita interação social', 'IP', 1),
('pir', 9, 'Tenho facilidade para fazer networking e criar novas conexões', 'IP', 0),
('pir', 10, 'Me sinto motivado(a) quando posso ensinar ou treinar outras pessoas', 'IP', 0);

-- Dimensão 2: Interesse em Dados (ID) - Questões 11-20
INSERT INTO `testQuestions` (`testType`, `questionNumber`, `questionText`, `dimension`, `reverse`) VALUES
('pir', 11, 'Gosto de trabalhar com números, estatísticas e análises', 'ID', 0),
('pir', 12, 'Prefiro tarefas que exigem organização e atenção aos detalhes', 'ID', 0),
('pir', 13, 'Me sinto confortável ao analisar grandes volumes de informação', 'ID', 0),
('pir', 14, 'Tenho facilidade para identificar padrões e tendências em dados', 'ID', 0),
('pir', 15, 'Prefiro atividades práticas a atividades analíticas', 'ID', 1),
('pir', 16, 'Gosto de criar planilhas, relatórios e documentos estruturados', 'ID', 0),
('pir', 17, 'Me sinto motivado(a) ao resolver problemas usando lógica e raciocínio', 'ID', 0),
('pir', 18, 'Prefiro trabalhar com conceitos abstratos a trabalhar com dados concretos', 'ID', 1),
('pir', 19, 'Tenho facilidade para trabalhar com sistemas e ferramentas tecnológicas', 'ID', 0),
('pir', 20, 'Me sinto satisfeito(a) ao organizar e categorizar informações', 'ID', 0);

-- Dimensão 3: Interesse em Coisas (IC) - Questões 21-30
INSERT INTO `testQuestions` (`testType`, `questionNumber`, `questionText`, `dimension`, `reverse`) VALUES
('pir', 21, 'Gosto de trabalhar com as mãos e criar coisas físicas', 'IC', 0),
('pir', 22, 'Prefiro atividades práticas a atividades teóricas', 'IC', 0),
('pir', 23, 'Me sinto confortável ao operar máquinas, equipamentos ou ferramentas', 'IC', 0),
('pir', 24, 'Tenho facilidade para consertar ou montar objetos', 'IC', 0),
('pir', 25, 'Prefiro trabalhar com ideias abstratas a trabalhar com objetos concretos', 'IC', 1),
('pir', 26, 'Gosto de atividades que envolvem construção, montagem ou fabricação', 'IC', 0),
('pir', 27, 'Me sinto motivado(a) ao ver resultados tangíveis do meu trabalho', 'IC', 0),
('pir', 28, 'Prefiro trabalhar em ambientes fechados a trabalhar em campo', 'IC', 1),
('pir', 29, 'Tenho interesse por mecânica, eletrônica ou tecnologia física', 'IC', 0),
('pir', 30, 'Me sinto satisfeito(a) ao realizar tarefas manuais e práticas', 'IC', 0);

-- Dimensão 4: Reação a Mudanças (RM) - Questões 31-40
INSERT INTO `testQuestions` (`testType`, `questionNumber`, `questionText`, `dimension`, `reverse`) VALUES
('pir', 31, 'Me adapto facilmente a novas situações e ambientes', 'RM', 0),
('pir', 32, 'Gosto de experimentar novas formas de fazer as coisas', 'RM', 0),
('pir', 33, 'Me sinto confortável com mudanças inesperadas na rotina', 'RM', 0),
('pir', 34, 'Prefiro seguir procedimentos estabelecidos a improvisar', 'RM', 1),
('pir', 35, 'Me sinto motivado(a) por desafios e situações inéditas', 'RM', 0),
('pir', 36, 'Tenho facilidade para aprender novas habilidades rapidamente', 'RM', 0),
('pir', 37, 'Prefiro ambientes estáveis e previsíveis', 'RM', 1),
('pir', 38, 'Me sinto confortável ao trabalhar em projetos inovadores', 'RM', 0),
('pir', 39, 'Gosto de variedade e mudança na minha rotina de trabalho', 'RM', 0),
('pir', 40, 'Me sinto ansioso(a) quando preciso mudar meus hábitos', 'RM', 1);

-- Dimensão 5: Reação a Pressão (RP) - Questões 41-50
INSERT INTO `testQuestions` (`testType`, `questionNumber`, `questionText`, `dimension`, `reverse`) VALUES
('pir', 41, 'Mantenho a calma em situações de alta pressão', 'RP', 0),
('pir', 42, 'Consigo tomar boas decisões mesmo sob estresse', 'RP', 0),
('pir', 43, 'Me sinto motivado(a) por prazos apertados e desafios urgentes', 'RP', 0),
('pir', 44, 'Prefiro trabalhar em ambientes tranquilos e sem pressão', 'RP', 1),
('pir', 45, 'Tenho facilidade para priorizar tarefas em momentos críticos', 'RP', 0),
('pir', 46, 'Me sinto sobrecarregado(a) quando tenho muitas demandas simultâneas', 'RP', 1),
('pir', 47, 'Consigo manter a qualidade do meu trabalho mesmo sob pressão', 'RP', 0),
('pir', 48, 'Prefiro evitar situações que exigem decisões rápidas', 'RP', 1),
('pir', 49, 'Me sinto energizado(a) em ambientes dinâmicos e acelerados', 'RP', 0),
('pir', 50, 'Tenho dificuldade para relaxar quando estou sob pressão', 'RP', 1);

-- Dimensão 6: Autonomia (AU) - Questões 51-60
INSERT INTO `testQuestions` (`testType`, `questionNumber`, `questionText`, `dimension`, `reverse`) VALUES
('pir', 51, 'Prefiro trabalhar de forma independente, sem supervisão constante', 'AU', 0),
('pir', 52, 'Tenho facilidade para me organizar e gerenciar meu próprio tempo', 'AU', 0),
('pir', 53, 'Me sinto confortável ao tomar decisões sem consultar outras pessoas', 'AU', 0),
('pir', 54, 'Prefiro receber orientações claras sobre o que fazer', 'AU', 1),
('pir', 55, 'Me sinto motivado(a) quando tenho liberdade para definir meus métodos', 'AU', 0),
('pir', 56, 'Tenho facilidade para trabalhar sem feedback constante', 'AU', 0),
('pir', 57, 'Prefiro trabalhar em equipe a trabalhar sozinho(a)', 'AU', 1),
('pir', 58, 'Me sinto confortável ao assumir responsabilidade total por projetos', 'AU', 0),
('pir', 59, 'Gosto de ter controle sobre meu trabalho e minhas decisões', 'AU', 0),
('pir', 60, 'Me sinto inseguro(a) quando não tenho orientação clara', 'AU', 1);

-- ============================================================================
-- VERIFICAÇÃO: Contar questões inseridas
-- ============================================================================

-- Deve retornar 60
SELECT COUNT(*) as total_questoes_pir FROM `testQuestions` WHERE `testType` = 'pir';

-- Verificar distribuição por dimensão (deve retornar 10 para cada)
SELECT `dimension`, COUNT(*) as total 
FROM `testQuestions` 
WHERE `testType` = 'pir' 
GROUP BY `dimension` 
ORDER BY `dimension`;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
