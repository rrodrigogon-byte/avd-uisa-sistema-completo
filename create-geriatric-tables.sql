-- Tabelas de Testes Geriátricos para o Sistema AVD UISA

-- Tabela de Pacientes
CREATE TABLE IF NOT EXISTS geriatricPatients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  dataNascimento DATE NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  sexo ENUM('masculino', 'feminino', 'outro'),
  telefone VARCHAR(20),
  email VARCHAR(320),
  endereco TEXT,
  escolaridade ENUM('analfabeto', 'fundamental_incompleto', 'fundamental_completo', 'medio_incompleto', 'medio_completo', 'superior_incompleto', 'superior_completo', 'pos_graduacao'),
  historicoMedico TEXT,
  medicamentosEmUso TEXT,
  nomeResponsavel VARCHAR(255),
  telefoneResponsavel VARCHAR(20),
  parentescoResponsavel VARCHAR(100),
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  observacoes TEXT,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de Testes de Katz
CREATE TABLE IF NOT EXISTS katzTests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pacienteId INT NOT NULL,
  dataAvaliacao DATETIME NOT NULL,
  banho INT NOT NULL,
  vestir INT NOT NULL,
  higienePessoal INT NOT NULL,
  transferencia INT NOT NULL,
  continencia INT NOT NULL,
  alimentacao INT NOT NULL,
  pontuacaoTotal INT NOT NULL,
  classificacao ENUM('independente', 'dependencia_parcial', 'dependencia_total') NOT NULL,
  observacoes TEXT,
  avaliadorId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (pacienteId) REFERENCES geriatricPatients(id) ON DELETE CASCADE,
  FOREIGN KEY (avaliadorId) REFERENCES users(id)
);

-- Tabela de Testes de Lawton
CREATE TABLE IF NOT EXISTS lawtonTests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pacienteId INT NOT NULL,
  dataAvaliacao DATETIME NOT NULL,
  usarTelefone INT NOT NULL,
  fazerCompras INT NOT NULL,
  prepararRefeicoes INT NOT NULL,
  cuidarCasa INT NOT NULL,
  lavarRoupa INT NOT NULL,
  usarTransporte INT NOT NULL,
  controlarMedicacao INT NOT NULL,
  controlarFinancas INT NOT NULL,
  pontuacaoTotal INT NOT NULL,
  classificacao ENUM('independente', 'dependencia_parcial', 'dependencia_total') NOT NULL,
  observacoes TEXT,
  avaliadorId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (pacienteId) REFERENCES geriatricPatients(id) ON DELETE CASCADE,
  FOREIGN KEY (avaliadorId) REFERENCES users(id)
);

-- Tabela de Testes Minimental
CREATE TABLE IF NOT EXISTS miniMentalTests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pacienteId INT NOT NULL,
  dataAvaliacao DATETIME NOT NULL,
  orientacaoTemporal INT NOT NULL,
  orientacaoEspacial INT NOT NULL,
  memoriaImediata INT NOT NULL,
  atencaoCalculo INT NOT NULL,
  evocacao INT NOT NULL,
  linguagem INT NOT NULL,
  praxiaConstrutiva INT NOT NULL,
  pontuacaoTotal INT NOT NULL,
  classificacao ENUM('normal', 'comprometimento_leve', 'comprometimento_moderado', 'comprometimento_grave') NOT NULL,
  observacoes TEXT,
  avaliadorId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (pacienteId) REFERENCES geriatricPatients(id) ON DELETE CASCADE,
  FOREIGN KEY (avaliadorId) REFERENCES users(id)
);

-- Tabela de Testes GDS (Escala de Depressão Geriátrica)
CREATE TABLE IF NOT EXISTS gdsTests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pacienteId INT NOT NULL,
  dataAvaliacao DATETIME NOT NULL,
  q1_satisfeitoVida INT NOT NULL,
  q2_abandonouAtividades INT NOT NULL,
  q3_vidaVazia INT NOT NULL,
  q4_aborrece INT NOT NULL,
  q5_bomHumor INT NOT NULL,
  q6_medoCoisaRuim INT NOT NULL,
  q7_felizMaiorTempo INT NOT NULL,
  q8_desamparado INT NOT NULL,
  q9_prefereFicarCasa INT NOT NULL,
  q10_problemasMemoria INT NOT NULL,
  q11_bomEstarVivo INT NOT NULL,
  q12_inutil INT NOT NULL,
  q13_cheioEnergia INT NOT NULL,
  q14_situacaoSemEsperanca INT NOT NULL,
  q15_outrosMelhorSituacao INT NOT NULL,
  pontuacaoTotal INT NOT NULL,
  classificacao ENUM('normal', 'depressao_leve', 'depressao_grave') NOT NULL,
  observacoes TEXT,
  avaliadorId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (pacienteId) REFERENCES geriatricPatients(id) ON DELETE CASCADE,
  FOREIGN KEY (avaliadorId) REFERENCES users(id)
);

-- Tabela de Testes do Relógio
CREATE TABLE IF NOT EXISTS clockTests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pacienteId INT NOT NULL,
  dataAvaliacao DATETIME NOT NULL,
  imagemUrl VARCHAR(512),
  pontuacaoCirculo INT NOT NULL,
  pontuacaoNumeros INT NOT NULL,
  pontuacaoPonteiros INT NOT NULL,
  pontuacaoTotal INT NOT NULL,
  classificacao ENUM('normal', 'comprometimento_leve', 'comprometimento_moderado', 'comprometimento_grave') NOT NULL,
  observacoes TEXT,
  avaliadorId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (pacienteId) REFERENCES geriatricPatients(id) ON DELETE CASCADE,
  FOREIGN KEY (avaliadorId) REFERENCES users(id)
);

-- Tabela de Fila de E-mails
CREATE TABLE IF NOT EXISTS emailQueue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destinatario VARCHAR(320) NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  corpo TEXT NOT NULL,
  tipoEmail VARCHAR(100) NOT NULL,
  prioridade ENUM('baixa', 'normal', 'alta', 'urgente') DEFAULT 'normal' NOT NULL,
  status ENUM('pendente', 'enviando', 'enviado', 'falhou', 'cancelado') DEFAULT 'pendente' NOT NULL,
  tentativas INT DEFAULT 0 NOT NULL,
  maxTentativas INT DEFAULT 3 NOT NULL,
  proximaTentativa DATETIME,
  erroMensagem TEXT,
  metadados TEXT,
  enviadoEm DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_status (status),
  INDEX idx_proximaTentativa (proximaTentativa),
  INDEX idx_prioridade (prioridade)
);

-- Tabela de Logs de E-mails
CREATE TABLE IF NOT EXISTS emailLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emailQueueId INT,
  destinatario VARCHAR(320) NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  tipoEmail VARCHAR(100) NOT NULL,
  status ENUM('sucesso', 'falha', 'bounce', 'spam') NOT NULL,
  tentativa INT NOT NULL,
  erroMensagem TEXT,
  tempoResposta INT,
  smtpResponse TEXT,
  metadados TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (emailQueueId) REFERENCES emailQueue(id) ON DELETE SET NULL,
  INDEX idx_destinatario (destinatario),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
);
