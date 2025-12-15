-- Padronizar dimensões DISC para D, I, S, C

UPDATE testQuestions SET dimension = 'D' WHERE testType = 'disc' AND dimension = 'dominance';
UPDATE testQuestions SET dimension = 'I' WHERE testType = 'disc' AND dimension = 'influence';
UPDATE testQuestions SET dimension = 'S' WHERE testType = 'disc' AND dimension = 'steadiness';
UPDATE testQuestions SET dimension = 'C' WHERE testType = 'disc' AND dimension = 'compliance';

-- Verificar resultado
SELECT testType, dimension, COUNT(*) as total 
FROM testQuestions 
WHERE testType='disc' 
GROUP BY testType, dimension 
ORDER BY dimension;
