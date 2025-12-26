-- Importação de Dados da Diretoria TAI
-- Gerado em: 2025-12-26 15:04:40
-- Total de registros: 154

START TRANSACTION;


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003671',
    '8003671',
    'KAUAN DOMINGOS SAMPAIO',
    'kauan.sampaio@uisa.com.br',
    '5565992334104',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002971',
    '8002971',
    'TALITA PAOLA RAMALHO E SILVA',
    'talita.silva@uisa.com.br',
    '5565996936981',
    'Assistente Administrativo',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Assistente',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '2430',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003968',
    '8003968',
    'VICENTE PAULO FERNANDES VIEIRA',
    'vicentepaulovieira1997@gmail.com',
    '5565998088409',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2564',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003647',
    '8003647',
    'MARIA RITA BOTELHO QUINHONE',
    'quinhonerita@gmail.com',
    '5565999813406',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003672',
    '8003672',
    'LUIZ OCTAVIO DA SILVA COELHO',
    'luizoctaviosilvacoelho@gmail.com',
    '5565999329204',
    'Auxiliar de Manutenção Automotiva',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '4484',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003939',
    '8003939',
    'ALANO NAPOLEAO DE SANTANA NETO',
    'albrechtalana2@gmail.com',
    '5565999328362',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2564',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003967',
    '8003967',
    'JOSE THALISSON DA SILVA SOUZA',
    'josethallyssondasilvasouza@gmail.com',
    '5565981191991',
    'Auxiliar de Almoxarifado',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '3668',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002230',
    '8002230',
    'JOSE WILSON DA SILVA',
    'djosewilson28@gmail.com',
    '5565998179439',
    'Pedreiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Pedreiro',
    'Ativo',
    'Engenharia e Manutenção Civil - Facilities',
    '1.00.17.04.110051201.00.0',
    '2494',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003088',
    '8003088',
    'JOSE JACKSON PEREIRA DA SILVA',
    'ninosilvanino0@gmail.com',
    '5565998504882',
    'Auxiliar de Pedreiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Engenharia e Manutenção Civil - Facilities',
    '1.00.17.04.110051201.00.0',
    '3156',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '46590',
    '46590',
    'GONCALO MENDES DA TRINDADE',
    'goncalomendesdatrindade@gmail.com',
    '5565981173333',
    'Encarregado Casa da Sede',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Lider',
    'Ativo',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '2175',
    1,
    'supervisao',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '46558',
    '46558',
    'CLEUSA MARIA GOBBO DA TRINDADE',
    NULL,
    '556533323566',
    'Governanta',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Governanta',
    'Ativo',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '2218',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002103',
    '8002103',
    'CRISTOFFER BASSIOLLANE RODRIGUES',
    'cristofferrodrigues1995@gmail.com',
    '5565996042365',
    'Pintor Industrial',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Pintor',
    'Ativo',
    'Engenharia e Manutenção Civil - Facilities',
    '1.00.17.04.110051201.00.0',
    '3429',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003602',
    '8003602',
    'ALISON ANDRE RODRIGUES DO NASCIMENTO',
    'alisonandrerodrigues@gmail.com',
    '5565996925392',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003620',
    '8003620',
    'WILLIAN RICARDO DE OLIVEIRA LIMA',
    'willianlima1809@gmail.com',
    '5565998018824',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003941',
    '8003941',
    'KAUA SATURNINO DE JESUS E SILVA',
    'kennedysaturnino1965@mail.com',
    '5565999015495',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003976',
    '8003976',
    'MAYSA PINTO GONCALVES',
    'marydol@hotmail.com',
    '5565999873885',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2564',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '892203',
    '892203',
    'ZENILDA TEIXEIRA',
    'zenilda.tei1977@gmail.com',
    '5565999831704',
    'Cozinheiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Ajudante',
    'Ativo',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '3238',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002727',
    '8002727',
    'HENRIQUE MESSIAS DA SILVA',
    'messiashenrique422@gmail.com',
    '5565996183250',
    'Auxiliar de Pedreiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Engenharia e Manutenção Civil - Facilities',
    '1.00.17.04.110051201.00.0',
    '3156',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003611',
    '8003611',
    'UELLINGTON DA CRUZ SILVA',
    'Gabrielshakespeare180@gmail.com',
    '5565996360788',
    'Auxiliar de Almoxarifado',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '3668',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003652',
    '8003652',
    'THYERRISON MARIO SALU DA SILVA',
    'thyerrison.maurio@gmail.com',
    '5565996721054',
    'Lavador',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Lavador',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2410',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003817',
    '8003817',
    'RYAN MARCIONILO PIMENTEL MENESES',
    'ryanmarciolino560@gmail.com',
    '5565999196060',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '902101',
    '902101',
    'MICHAEL ISMAEL DOS SANTOS',
    'michael.ismaelzinho33@gmail.com',
    '5565999179913',
    'Pedreiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Pedreiro',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '2494',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001484',
    '8001484',
    'LEANDRO LIMA DOS SANTOS',
    'lsantos9620@gmail.com',
    '5565996581961',
    'Pedreiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Pedreiro',
    'Ativo',
    'Engenharia e Manutenção Civil - Facilities',
    '1.00.17.04.110051201.00.0',
    '2494',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003064',
    '8003064',
    'FLAVIA ALESSANDRA ROMAO SILVA',
    'flavia.silva@uisa.com.br',
    '5565998128387',
    'Auxiliar de Tecnologia da Informação',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Projetos e Processos de TI',
    '1.00.17.01.110051408.00.0',
    '3728',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003603',
    '8003603',
    'ELAINE DIAS COSTA',
    'elaine.dias@uisa.com.br',
    '5565999449713',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003605',
    '8003605',
    'GECILDO DA SILVA SANTOS',
    'gecildo.silva21@gmail.com',
    '5565999243821',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003606',
    '8003606',
    'JESSICLEY SOUZA CONCEICAO',
    'souzajessicley@gmail.com',
    '5565998053503',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003942',
    '8003942',
    'VALMIR DE ALMEIDA SILVA',
    'valmir.almeida@uisa.com.br',
    '5565996795084',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003969',
    '8003969',
    'BRUNNO RICARDO ADRIANO',
    'adrianobrunno1909@gmail.com',
    '5565998123602',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2564',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003970',
    '8003970',
    'JOSIAS DE OLIVEIRA PAES',
    'josiasoliveirapaes478@gmail.com',
    '5565996591349',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2564',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004715',
    '8004715',
    'ALEXSUAN DA SILVA BRITO',
    'alexsuan.brito@uisa.com.br',
    '5565996087768',
    'Auxiliar de Almoxarifado',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '3668',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003058',
    '8003058',
    'VITOR GUILHERME OLIVEIRA CRUZ',
    'vitor.cruz@uisa.com.br',
    '5565996762397',
    'Auxiliar de Tecnologia da Informação',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ferias',
    'Automação',
    '1.00.17.02.110051405.00.0',
    '3728',
    0,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003059',
    '8003059',
    'ADNA ELLEN ARAUJO DA SILVA',
    'adna.silva@uisa.com.br',
    '5565999341552',
    'Auxiliar de Tecnologia da Informação',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ferias',
    'Projetos e Processos de TI',
    '1.00.17.01.110051408.00.0',
    '3728',
    0,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003607',
    '8003607',
    'JOAO HENRIQUE PAULO DE OLIVEIRA',
    'Santanakeize4@gmail.com',
    '5565984760463',
    'Lavador',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Lavador',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2410',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003610',
    '8003610',
    'JOSE CARLOS DA SILVA SOARES',
    'thaynasilva2021.com@gmail.com',
    '5565996421580',
    'Auxiliar de Almoxarifado',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '3668',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003645',
    '8003645',
    'CARLOS ALEXANDRE SILVA DE ARAUJO',
    'carlos.asilva@uisa.com.br',
    '5585981244983',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003646',
    '8003646',
    'IVONETE BARBOSA DA SILVA',
    'ivonete.silva@uisa.com.br',
    '5565996054161',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003796',
    '8003796',
    'DANIEL LUCAS SILVA ROCHA',
    'daniellucasrocha2006@gmail.com',
    '5565998075836',
    'Auxiliar de Viveiro Florestal',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '3589',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003940',
    '8003940',
    'HELENA PAES BARBOSA',
    'helena.paes@uisa.com.br',
    '5565996953135',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '649198',
    '649198',
    'ERALDO PEDRO DA SILVA JUNIOR',
    'pedro.silva76@outlook.com',
    '5565993216905',
    'Motorista Administração',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Motorista',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '2247',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '747823',
    '747823',
    'TANIA APARECIDA GIORGETTI',
    'tania.giorgetti@uisa.com.br',
    '5511996568722',
    'Secretária Executiva',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Secretaria',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '3451',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '751260',
    '751260',
    'MARCOS APARECIDO GOMES DE OLIVEIRA',
    'marcos.gomes@uisa.com.br',
    '5565996046407',
    'Técnico de Instrumentação III',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4381',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '751278',
    '751278',
    'GENILSON LUIZ DOS SANTOS',
    'genilson.santos@uisa.com.br',
    '5565999418598',
    'Técnico de Instrumentação III',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4381',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '763144',
    '763144',
    'MAURO SERGIO DOS SANTOS',
    'mauro.santos@uisa.com.br',
    '5565996175475',
    'Técnico de Instrumentação Líder',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Lider',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4382',
    1,
    'supervisao',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '845591',
    '845591',
    'LEONARDO HERMOGENES DOS SANTOS',
    'leonardo.santos@uisa.com.br',
    '5565996427234',
    'Supervisor de Instrumentação',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Supervisor',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '3457',
    1,
    'supervisao',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004682',
    '8004682',
    'WESLEY DE OLIVEIRA VITAL',
    'jonysilvat15@gmail.com',
    '5565999925520',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '2564',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004783',
    '8004783',
    'IRIS SAMARA AMERICO BERTOSO',
    'irissamara722@gmail.com',
    '5565999539009',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '2564',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001605',
    '8001605',
    'MARIA JOSE DO NASCIMENTO',
    'antoniosilva41373@gmail.com',
    '5565999422771',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ferias',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '2564',
    0,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003454',
    '8003454',
    'VALMIR DA SILVA SALVADOR',
    'valmir.silva@uisa.com.br',
    '5566984577767',
    'Técnico Segurança do Trabalho PL',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ferias',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3131',
    0,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003608',
    '8003608',
    'JOAO PAULO DA SILVA',
    'joao.silva@uisa.com.br',
    '5565999552479',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ferias',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    0,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003685',
    '8003685',
    'WISLLEN GONCALVES MORAIS',
    'wisllengoncalves1@icloud.com',
    '5569992306093',
    'Auxiliar de Pedreiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Engenharia e Manutenção Civil - Facilities',
    '1.00.17.04.110051201.00.0',
    '3156',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003800',
    '8003800',
    'DANIEL SILVA DE OLIVEIRA',
    'daniel.no.12@hotmail.com',
    '5565999672424',
    'Auxiliar Laboratório Industrial',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '3474',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003818',
    '8003818',
    'HITAMAR GOMES DA SILVA',
    'hitamar.silva@uisa.com.br',
    '5565981185531',
    'Bombeiro Civil',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Bombeiro',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '4589',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003977',
    '8003977',
    'ROMUALDO LUIZ PELEGRINI KUHN',
    'romualdolpkuhn@gmail.com',
    '5565999784555',
    'Auxiliar de Manutenção Automotiva',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '4484',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004417',
    '8004417',
    'MARIA APARECIDA NOGUEIRA RAMOS',
    'MNOGUEIRARAMOS002@gmail.com',
    '5565996206768',
    'Auxiliar de Limpeza',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Alojamentos',
    '1.00.17.04.110051206.00.0',
    '3667',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004588',
    '8004588',
    'LEANDRO PEREIRA ANTUNES',
    'leandro.antunes@uisa.com.br',
    '5565993628898',
    'Técnico Segurança do Trabalho SR',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3132',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003601',
    '8003601',
    'ADENILSON STRADA',
    'adenilson.strada@uisa.com.br',
    '5565993078424',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003609',
    '8003609',
    'JOSAFA TRINDADE DA CRUZ',
    'josafa1919@hotmail.com',
    '5565999258379',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003653',
    '8003653',
    'KEYSON KELVE SOUZA LIMA',
    'keyson.lima@uisa.com.br',
    '5565996503051',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003668',
    '8003668',
    'GABRIELLY DE ALMEIDA RABASCO',
    'gabrielly.rabasco@uisa.com.br',
    '5565996400158',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003669',
    '8003669',
    'GUILHERME RODRIGUES DE MELO',
    'guilherme.melo@uisa.com.br',
    '5565999466364',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003670',
    '8003670',
    'ALEXA RODRIGUES DA SILVA',
    'alexa.silva@uisa.com.br',
    '5567991232132',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003062',
    '8003062',
    'FABRICIO DOS SANTOS SILVA DE CARVALHO',
    'fabricio.carvalho@uisa.com.br',
    '5565996345425',
    'Assistente de Tecnologia da Informação',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Assistente',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '2449',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003066',
    '8003066',
    'LUANY VIEIRA SILVA',
    'luany.silva@uisa.com.br',
    '5565996437391',
    'Auxiliar de Tecnologia da Informação',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3728',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003067',
    '8003067',
    'LUCAS GOUVEIA DE OLIVEIRA',
    'lucas.oliveira@uisa.com.br',
    '5565996235076',
    'Assistente de Tecnologia da Informação',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Assistente',
    'Ativo',
    'Cyber Security',
    '1.00.17.01.110051406.00.0',
    '2449',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003068',
    '8003068',
    'MYRELLA LORRAINNY ROBERTO TEODORO',
    'myrella.teodoro@uisa.com.br',
    '5565996312594',
    'Auxiliar de Tecnologia da Informação',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Administração de Pessoal',
    '1.00.17.04.110051007.00.0',
    '3728',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003069',
    '8003069',
    'DORGIVAL BERTULINO GUIMARAES NETO',
    'dorgival.guimaraes@uisa.com.br',
    '5565996989983',
    'Auxiliar de Tecnologia da Informação',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3728',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003453',
    '8003453',
    'DUCIENE LUCIANO DO SANTOS',
    'duciene.santos@uisa.com.br',
    '5565996401198',
    'Técnico Segurança do Trabalho PL',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3131',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002482',
    '8002482',
    'LENON DE FREITAS LEITE',
    'Tecnicolenon16@hotmail.com',
    '5545998135573',
    'Técnico de Instrumentação III',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4381',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002754',
    '8002754',
    'CARLOS BRUNO DA SILVA ALVES',
    'Carlosbruno6896@gmail.com',
    '5565998108643',
    'Pintor Industrial',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Pintor',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '3429',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002843',
    '8002843',
    'CLEBER OLIVEIRA ALMEIDA',
    'cleber.almeida@uisa.com.br',
    '5565999937009',
    'Instrutor Treinamentos',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Instrutor',
    'Ativo',
    'Desenvolvimento Humano',
    '1.00.17.04.110051004.00.0',
    '3236',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002893',
    '8002893',
    'EDIANE NASCIMENTO PEREIRA',
    'ediane.pereira@uisa.com.br',
    '5565999273159',
    'Técnico de Enfermagem do Trabalho I',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Saúde Ocupacional',
    '1.00.17.05.110051103.00.0',
    '4423',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002933',
    '8002933',
    'JONAS DA SILVA FONSECA',
    'jonas.fonseca@uisa.com.br',
    '5565996361897',
    'Analista de Infraestrutura PL',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Projetos e Processos de TI',
    '1.00.17.01.110051408.00.0',
    '3285',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003060',
    '8003060',
    'SAMYRA DA SILVA PERALTA',
    'samyra.peralta@uisa.com.br',
    '5565999494035',
    'Assistente Administrativo',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Assistente',
    'Ativo',
    'Saúde Ocupacional',
    '1.00.17.05.110051103.00.0',
    '2430',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001459',
    '8001459',
    'EDER AUGUSTO MORISCO',
    'eder.morisco@uisa.com.br',
    '5544998804719',
    'Técnico de Instrumentação Líder',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Lider',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4382',
    1,
    'supervisao',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001898',
    '8001898',
    'GABRIEL SILVA DE CASAGRANDE PREZOTTO',
    'gabrielsilvadecasagrande20@gmail.com',
    '5565999531820',
    'Técnico de Instrumentação I',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4377',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001901',
    '8001901',
    'ALEX SANDRO SILVA MARIANO DOS SANTOS',
    'alexmariano687@gmail.com',
    '5565998026362',
    'Técnico de Instrumentação I',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4377',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002068',
    '8002068',
    'DIEGO MAMANI DA COSTA',
    'diego.costa@uisa.com.br',
    '5565999204813',
    'Desenvolvedor JR',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3461',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002328',
    '8002328',
    'ERIKA RAQUEL COSTA PORTO',
    'erika.porto@uisa.com.br',
    '5565996593563',
    'Especialista de Segurança do Trabalho',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Especialista',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '4577',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002330',
    '8002330',
    'MATEUS BUCIANELLI OLIVEIRA',
    'mateus.oliveira@uisa.com.br',
    '5565996987482',
    'Técnico de Enfermagem do Trabalho II',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Saúde Ocupacional',
    '1.00.17.05.110051103.00.0',
    '4424',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '895342',
    '895342',
    'ELSON GREIK FERREIRA',
    'greik341@gmail.com',
    '5565996832553',
    'Motorista Administração',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Motorista',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '2247',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '897078',
    '897078',
    'CAMILO CIOL',
    'camilo.ciol@uisa.com.br',
    '5565996623114',
    'Especialista TI - SAP',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Especialista',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3201',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '899283',
    '899283',
    'MATEUS SILVA DOS SANTOS',
    'mateusilvasantos31@gmail.com',
    '5565999678186',
    'Técnico de Instrumentação II',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4378',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000061',
    '8000061',
    'GISELE FERNANDES ARRUDA DE LIMA',
    'gisele.lima@uisa.com.br',
    '5565996745557',
    'Analista de Comunicação Interna PL',
    '17.00-Diretoria de Gente, Inovação e Administração',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Comunicação Corporativa',
    '1.00.17.00.110050202.00.0',
    '3632',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000457',
    '8000457',
    'EDNALDA DA SILVA',
    'guimaraesedna036@gmail.com',
    '5565981362584',
    'Auxiliar de Serviços Gerais',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '2564',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001179',
    '8001179',
    'ALESSANDRA SANTOS BARBOSA GAMA',
    'alessandra.gama@uisa.com.br',
    '5566999612409',
    'Técnico de Enfermagem do Trabalho II',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Saúde Ocupacional',
    '1.00.17.05.110051103.00.0',
    '4424',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '888303',
    '888303',
    'GEFFERSON DOS SANTOS AURELUK',
    'gefferson.aureluk@uisa.com.br',
    '5565996200674',
    'Cientista de Dados PL',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Projetos e Processos de TI',
    '1.00.17.01.110051408.00.0',
    '3649',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '888460',
    '888460',
    'EDUARDO LEATTI DOS SANTOS',
    'eduardo.santos@uisa.com.br',
    '5565998060110',
    'Técnico Automação III',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Automação',
    '1.00.17.02.110051405.00.0',
    '4385',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '888826',
    '888826',
    'MARIA APARECIDA FERREIRA GUIMARAES',
    'maria.guimaraes@uisa.com.br',
    '65996198603',
    'Técnico Segurança do Trabalho JR',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3130',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '891690',
    '891690',
    'GUSTAVO BARBOSA PEREIRA',
    'gustavo.pereira@uisa.com.br',
    '5565996267700',
    'Especialista de Infraestrutura',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Especialista',
    'Ativo',
    'Operações de TI',
    '1.00.17.01.110051402.00.0',
    '3535',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '892181',
    '892181',
    'MARIA JOSE DE OLIVEIRA MINERVINO',
    'mriajose12oliveira@gmail.com',
    '5565999230572',
    'Cozinheiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Ajudante',
    'Ativo',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '3238',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '892190',
    '892190',
    'RAQUEL BATISTA PEREIRA',
    'raquelbatistapereire@gmail.com',
    '5565996023035',
    'Cozinheiro',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Ajudante',
    'Ativo',
    'Casa da Sede',
    '1.00.17.04.110050203.00.0',
    '3238',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '850748',
    '850748',
    'ALEX SANDRO PEREIRA DE LIMA',
    'Alex.lima@uisa.com.br',
    '5565999364516',
    'Líder de Facilities',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Lider',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '3806',
    1,
    'supervisao',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '874302',
    '874302',
    'MARCELO SANTOS PRATES',
    'marcelo.prates@uisa.com.br',
    '5565996297136',
    'Técnico Segurança do Trabalho PL',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3131',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '876241',
    '876241',
    'FELIPE MANOEL SILVA',
    'felipemanoelsilva72@gmail.com',
    '5565999310281',
    'Técnico de Instrumentação II',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4378',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '877000',
    '877000',
    'MATHEUS DO NASCIMENTO BATISTA',
    'matheus.batista@uisa.com.br',
    '5565996697197',
    'Coordenador de Sistemas',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3368',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '881660',
    '881660',
    'JOSE JACILDO MACEDO SILVA JUNIOR',
    'jose.jacildo@uisa.com.br',
    '5565996949016',
    'Técnico Segurança do Trabalho PL',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3131',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '884375',
    '884375',
    'LUCAS SANTOS SOUSA',
    'lukinhas@hotmail.com',
    '5565999251455',
    'Técnico de Instrumentação II',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4378',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '876526',
    '876526',
    'ANA PAULA BARBOSA FERREIRA RAMOS',
    'ana.ramos@uisa.com.br',
    '5565998027126',
    'Analista Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '3499',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '888836',
    '888836',
    'DILAMAR JUNIOR BUSNELLO',
    'dilamar.busnello@uisa.com.br',
    '5565999812416',
    'Analista de Segurança da Informação JR',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Cyber Security',
    '1.00.17.01.110051406.00.0',
    '2448',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '899071',
    '899071',
    'DELAIS SILVA SOUZA DE OLIVEIRA',
    'delais.oliveira@uisa.com.br',
    '5565999933837',
    'Analista de Comunicação e Eventos Corporativos JR',
    '17.00-Diretoria de Gente, Inovação e Administração',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Comunicação Corporativa',
    '1.00.17.00.110050202.00.0',
    '5824',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000062',
    '8000062',
    'NATANAEL CHAGAS FURTADO FERREIRA',
    'natanael.ferreira@uisa.com.br',
    '5565999279386',
    'Analista de Design JR',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '4613',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000513',
    '8000513',
    'CAMILA LAYANE DA SILVA',
    'camila.layane@uisa.com.br',
    '5565999960515',
    'Analista Administração de Pessoal PL',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Benefícios',
    '1.00.17.04.110051101.00.0',
    '3049',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000580',
    '8000580',
    'GILVAN DA SILVA SANTOS',
    'gil_vivosan@live.com',
    '5565999540305',
    'Técnico de Instrumentação III',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4381',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004717',
    '8004717',
    'NATHAN RENNER DE AZEVEDO',
    'nathan.azevedo@uisa.com.br',
    '5565996204906',
    'Desenvolvedor JR',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3461',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004752',
    '8004752',
    'BRENDO FERREIRA E SILVA',
    'brendo.ferrerira@uisa.com.br',
    '5591993767767',
    'Analista de Segurança do Trabalho',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '4580',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003648',
    '8003648',
    'CAMILE VITORIA DOS SANTOS SOUZA',
    'camile.souza@uisa.com.br',
    '5565996902034',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003651',
    '8003651',
    'JOSE EDVALDO ALVES',
    'jose.alves@uisa.com.br',
    '5565984499563',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001147',
    '8001147',
    'RAUL GONÇALVES MULLER',
    'raul.muller@uisa.com.br',
    '5565999483872',
    'Desenvolvedor JR',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3461',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001256',
    '8001256',
    'EDUARDO UBARA RODRIGUES DO NASCIMENTO',
    'eduardo.nascimento@uisa.com.br',
    '5565999210297',
    'Auxiliar de Tecnologia da Informação',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Auxiliar',
    'Ativo',
    'Cyber Security',
    '1.00.17.01.110051406.00.0',
    '3728',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002181',
    '8002181',
    'LUCAS SANTOS JESUS FIGUEREDO',
    'lucas.figueredo@uisa.com.br',
    '5565996271056',
    'Técnico Segurança do Trabalho PL',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3131',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002406',
    '8002406',
    'VIVIANE DOS SANTOS BEZERRA',
    'viviane.bezerra@uisa.com.br',
    '5565996196248',
    'Analista Administração de Pessoal JR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Pessoal',
    '1.00.17.04.110051007.00.0',
    '3092',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '72702',
    '72702',
    'NIVALDO NUNES DE MOURA DE NETO',
    'nivaldo.neto@uisa.com.br',
    '5565999075045',
    'Coordenador de Planejamento e Custos Industriais',
    '17.03-Gerência de IA e Performance',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ativo',
    'Inteligência Artificial e Performance',
    '1.00.17.03.110051407.00.0',
    '3707',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '827843',
    '827843',
    'FRANCISCA GOMES DA LUZ',
    'francisca.luz@uisa.com.br',
    '5565996721608',
    'Analista Administração de Pessoal JR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Pessoal',
    '1.00.17.04.110051007.00.0',
    '3092',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '861596',
    '861596',
    'MARCOS ANTONIO VICENTE E SILVA',
    'marcos.silva@uisa.com.br',
    '5565999859058',
    'Analista de Logística PL',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '3381',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '876828',
    '876828',
    'CRISTIANO VIEIRA DA COSTA',
    'cristiano.costa@uisa.com.br',
    '5565999551767',
    'Técnico Automação II',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Automação',
    '1.00.17.02.110051405.00.0',
    '4384',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '877034',
    '877034',
    'CRISTIANE BATISTA DE SOUZA',
    'cristiane.souza@uisa.com.br',
    '5565999329348',
    'Analista de Governança em Tecnologia PL',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Facilities',
    '1.00.17.04.110051202.00.0',
    '5826',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '898805',
    '898805',
    'DAIELLY DOMINGUES ARCANJO',
    'daielly.domingues@uisa.com.br',
    '5565999545146',
    'Analista Administração de Pessoal PL',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Pessoal',
    '1.00.17.04.110051007.00.0',
    '3049',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '898813',
    '898813',
    'IGOR ARAUJO GARCIA',
    'igor.garcia@uisa.com.br',
    '5565999145902',
    'Coordenador de Sistemas',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ferias',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3368',
    0,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001060',
    '8001060',
    'WILLAN DOS SANTOS LIMA',
    'willan.lima@uisa.com.br',
    '5565992534762',
    'Analista de Comunicação Interna PL',
    '17.00-Diretoria de Gente, Inovação e Administração',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ferias',
    'Comunicação Corporativa',
    '1.00.17.00.110050202.00.0',
    '3632',
    0,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003973',
    '8003973',
    'ALINE DUARTE SOARES',
    'aline.duarte@uisa.com.br',
    '5516997096121',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003993',
    '8003993',
    'PEDRO HENRIQUE SOUZA SILVA',
    'pedro.henrique@uisa.com.br',
    '5565999826125',
    'Analista de Atração e Seleção JR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Atração e Seleção',
    '1.00.17.04.110051006.00.0',
    '3715',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004425',
    '8004425',
    'FABIO DE SOUZA LEITE',
    'fabio.leite@uisa.com.br',
    '5511971471054',
    'Coordenador Estrutura, Remuneração e Administração de Pessoal',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ativo',
    'Cargos e Salários',
    '1.00.17.04.110051003.00.0',
    '4482',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004685',
    '8004685',
    'AMANDA PINHEIRO RODRIGUES',
    'amanda.rodrigues@uisa.com.br',
    '5591984952903',
    'Especialista de Segurança do Trabalho',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Especialista',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '4577',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004686',
    '8004686',
    'ADRIELY SANCHES PARANA',
    'adriely.parana@uisa.com.br',
    '5565996418951',
    'Técnico Segurança do Trabalho PL',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3131',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004687',
    '8004687',
    'WELLINGTON TORRES NASCIMENTO',
    'wellington.nascimento@uisa.com.br',
    '5591993384928',
    'Técnico Segurança do Trabalho SR',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3132',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001425',
    '8001425',
    'DAVID DE SOUZA FONTAINHA',
    'david.fontainha@uisa.com.br',
    '5532991431940',
    'Especialista de Automação',
    '17.03-Gerência de IA e Performance',
    'Diretoria de Gente, Inovação e Administração',
    'Especialista',
    'Ativo',
    'Inteligência Artificial e Performance',
    '1.00.17.03.110051407.00.0',
    '3277',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002232',
    '8002232',
    'SILVIA DA SILVA SOBRINHO',
    'silvia.silva@uisa.com.br',
    '5565981186087',
    'Supervisor de Saúde Ocupacional',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Supervisor',
    'Ativo',
    'Saúde Ocupacional',
    '1.00.17.05.110051103.00.0',
    '4560',
    1,
    'supervisao',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002392',
    '8002392',
    'DARLECRISCIA ANDRADE CARDOSO',
    'darlecriscia.cardoso@uisa.com.br',
    '5565999401593',
    'Técnico Segurança do Trabalho PL',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3131',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002491',
    '8002491',
    'EDELAINE DA SILVA ASSUNCAO',
    'edelaine.assuncao@uisa.com.br',
    '5565992347050',
    'Analista de Atração e Seleção PL',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Atração e Seleção',
    '1.00.17.04.110051006.00.0',
    '3716',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003857',
    '8003857',
    'VICTOR GABRIEL OLIVEIRA DAL POSSO',
    'victor.posso@uisa.com.br',
    '5565999633729',
    'Técnico Automação I',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Automação',
    '1.00.17.02.110051405.00.0',
    '4383',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003943',
    '8003943',
    'ROBERTA KEMES DA SILVA',
    'roberta.silva@uisa.com.br',
    '5565999669932',
    'Técnico Segurança do Trabalho SR',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3132',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '899674',
    '899674',
    'CAROLINE ANDRESSA MENDES SILVA',
    'caroline.silva@uisa.com.br',
    '5565999784670',
    'Coordenador de Atração, Seleção e Desenvolvimento',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ativo',
    'Desenvolvimento Humano',
    '1.00.17.04.110051004.00.0',
    '4510',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '899682',
    '899682',
    'GENILSON RIBEIRO DA FONSECA',
    'gerbgr.14@gmail.com',
    '5563999348424',
    'Técnico de Instrumentação III',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4381',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '899836',
    '899836',
    'RITA DE CASSIA COSTA FRUTUOSO',
    'rita.frutuoso@uisa.com.br',
    '5565996437706',
    'Analista Gestão de Benefícios JR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Benefícios',
    '1.00.17.04.110051101.00.0',
    '3800',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '902055',
    '902055',
    'JULIA SILVA DE OLIVEIRA',
    'julia.oliveira@uisa.com.br',
    '5565984650512',
    'Analista Administração de Pessoal SR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Pessoal',
    '1.00.17.04.110051007.00.0',
    '3093',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000272',
    '8000272',
    'RODRIGO DA SILVA DIAS',
    'rodrigo.dias@uisa.com.br',
    '5521995455019',
    'Coordenador de Governança em Tecnologia',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ativo',
    'Cyber Security',
    '1.00.17.01.110051406.00.0',
    '4485',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8001334',
    '8001334',
    'MANOEL CICERO DOS SANTOS FILHO',
    'manoelcicero.1@hotmail.com',
    '5564999965961',
    'Técnico de Instrumentação III',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Tecnico',
    'Ativo',
    'Instrumentação',
    '1.00.17.02.110020904.00.0',
    '4381',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '836702',
    '836702',
    'ADSON ALENCAR ALVES',
    'adson.alves@uisa.com.br',
    '5565996867096',
    'Especialista TI - SAP',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Especialista',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3201',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '869309',
    '869309',
    'ALEXSANDRA TAVARES SOBRAL DE OLIVEIRA',
    'alexsandra.oliveira@uisa.com.br',
    '5565996103982',
    'Analista Estrutura e Remuneração SR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Cargos e Salários',
    '1.00.17.04.110051003.00.0',
    '3684',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '871541',
    '871541',
    'DANILO MIRANDOLA BERALDI',
    'danilo.beraldi@uisa.com.br',
    '5565999501386',
    'Coordenador de Planejamento e Controle Industrial',
    '17.03-Gerência de IA e Performance',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ativo',
    'Inteligência Artificial e Performance',
    '1.00.17.03.110051407.00.0',
    '3693',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '873934',
    '873934',
    'CLAUDIONOR DA SILVA SOARES JUNIOR',
    'CLAUDIONOR.SOARES@UISA.COM.BR',
    '5565999864979',
    'Analista Administração de Pessoal SR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Administração de Pessoal',
    '1.00.17.04.110051007.00.0',
    '3093',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '881031',
    '881031',
    'MARCIA SILVA DE MELO',
    'marcia.melo@uisa.com.br',
    '5565999106940',
    'Analista de Desenvolvimento Humano JR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Desenvolvimento Humano',
    '1.00.17.04.110051004.00.0',
    '3717',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '892343',
    '892343',
    'LUCAS DOS PASSOS SILVA',
    'lucas.silva@uisa.com.br',
    '5534992110666',
    'Gerente Tecnologia da Informação',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Gerente',
    'Ativo',
    'Projetos e Processos de TI',
    '1.00.17.01.110051408.00.0',
    '2012',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003438',
    '8003438',
    'EVELYN LORRAINE MACEDO DA SILVA',
    'evelyn.silva@uisa.com.br',
    '5565996749013',
    'Analista de Atração e Seleção JR',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Atração e Seleção',
    '1.00.17.04.110051006.00.0',
    '3715',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8003975',
    '8003975',
    'ERICA ANGOLA MACHADO',
    'erica.angola@uisa.com.br',
    '5565996097421',
    'Auxiliar Administrativo',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Aux. Administrativo',
    'Ativo',
    'Programa + Possibilidades',
    '1.00.17.04.110051010.00.0',
    '2109',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004441',
    '8004441',
    'MARCIO BORTOLOTTO',
    'marcio.bortolotto@uisa.com.br',
    '5518981175910',
    'Gerente de Saúde e Segurança do Trabalho',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Gerente',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '3330',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8004668',
    '8004668',
    'ANDRE ROGERIO SBARDELLINI CARDOSO',
    'andre.sbardellini@uisa.com.br',
    '5538999820110',
    'Gerente Executivo de Recursos Humanos',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Gerente Exec',
    'Ativo',
    'Administração de RH',
    '1.00.17.04.110051001.00.0',
    '3260',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000266',
    '8000266',
    'JAIANI GODRIM DOS SANTOS',
    'jaiani.santos@uisa.com.br',
    '5565996021618',
    'Analista de Desenvolvimento Humano PL',
    '17.04-Gerência de Recursos Humanos',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Desenvolvimento Humano',
    '1.00.17.04.110051004.00.0',
    '3718',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000355',
    '8000355',
    'JOSEMEIRE AVELINO CAPISTRANO',
    'josemeire.capistrano@uisa.com.br',
    '5565996061885',
    'Especialista TI - SAP',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Especialista',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '3201',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000446',
    '8000446',
    'BERNARDO GUIMARAES MENDES',
    'bernardo.mendes@uisa.com.br',
    '5565984056123',
    'Coordenador de Comunicação Corporativa',
    '17.00-Diretoria de Gente, Inovação e Administração',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ativo',
    'Comunicação Corporativa',
    '1.00.17.00.110050202.00.0',
    '5823',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8000465',
    '8000465',
    'EDE WILSON OGUSUKU',
    'ede.ogusuku@uisa.com.br',
    '5565992988301',
    'Gerente de Automação',
    '17.02-Gerência de Automação',
    'Diretoria de Gente, Inovação e Administração',
    'Gerente',
    'Ativo',
    'Automação',
    '1.00.17.02.110051405.00.0',
    '3628',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002100',
    '8002100',
    'ERICA CRUZ DA SILVA',
    'erica.silva@uisa.com.br',
    '5565999488733',
    'Coordenador Segurança Trabalho',
    '17.05-Gerência de Saúde e Segurança do Trabalho',
    'Diretoria de Gente, Inovação e Administração',
    'Coordenador',
    'Ativo',
    'Segurança do Trabalho',
    '1.00.17.05.110051002.00.0',
    '2612',
    1,
    'gerencia',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '8002932',
    '8002932',
    'MATHEUS CARMO DE MATOS PINHO',
    'matheus.pinho@uisa.com.br',
    '5565996749462',
    'Analista de Sistemas JR',
    '17.01-Gerência de Tecnologia da Informação',
    'Diretoria de Gente, Inovação e Administração',
    'Analista',
    'Ativo',
    'Sistemas',
    '1.00.17.01.110051404.00.0',
    '2444',
    1,
    'operacional',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    telefone = VALUES(telefone),
    funcao = VALUES(funcao),
    gerencia = VALUES(gerencia),
    diretoria = VALUES(diretoria),
    cargo = VALUES(cargo),
    situacao = VALUES(situacao),
    secao = VALUES(secao),
    codSecao = VALUES(codSecao),
    codFuncao = VALUES(codFuncao),
    active = VALUES(active),
    hierarchyLevel = VALUES(hierarchyLevel),
    updatedAt = NOW();


COMMIT;
