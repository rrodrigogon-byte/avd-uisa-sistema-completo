-- ============================================================================
-- COMPETÊNCIAS ORGANIZACIONAIS DA UISA
-- Sistema AVD - Avaliação de Desempenho
-- ============================================================================

-- COMPETÊNCIAS COMPORTAMENTAIS (CORE)
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_001', 'Trabalho em Equipe', 'comportamental', 'Capacidade de colaborar efetivamente com colegas, compartilhar conhecimentos e contribuir para objetivos comuns.', true),
('COMP_002', 'Comunicação Eficaz', 'comportamental', 'Habilidade de transmitir informações de forma clara, objetiva e assertiva, tanto verbalmente quanto por escrito.', true),
('COMP_003', 'Liderança', 'lideranca', 'Capacidade de inspirar, motivar e orientar pessoas para alcançar resultados, desenvolvendo talentos e promovendo engajamento.', true),
('COMP_004', 'Resolução de Problemas', 'comportamental', 'Habilidade de identificar problemas, analisar causas e propor soluções eficazes de forma ágil e estruturada.', true),
('COMP_005', 'Orientação para Resultados', 'comportamental', 'Foco em alcançar metas e objetivos com qualidade, cumprindo prazos e superando expectativas.', true),
('COMP_006', 'Adaptabilidade', 'comportamental', 'Capacidade de se ajustar a mudanças, novas situações e desafios com flexibilidade e resiliência.', true),
('COMP_007', 'Inovação e Criatividade', 'comportamental', 'Habilidade de propor ideias inovadoras, questionar processos e buscar melhorias contínuas.', true),
('COMP_008', 'Ética e Integridade', 'comportamental', 'Conduta pautada em valores éticos, transparência, honestidade e responsabilidade profissional.', true),
('COMP_009', 'Visão Estratégica', 'lideranca', 'Capacidade de compreender o contexto organizacional, antecipar cenários e tomar decisões alinhadas aos objetivos estratégicos.', true),
('COMP_010', 'Desenvolvimento de Pessoas', 'lideranca', 'Habilidade de identificar potenciais, promover capacitação e apoiar o crescimento profissional da equipe.', true);

-- COMPETÊNCIAS TÉCNICAS - PRODUÇÃO INDUSTRIAL
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_011', 'Operação de Equipamentos Industriais', 'tecnica', 'Conhecimento e habilidade para operar equipamentos e máquinas do processo produtivo com segurança e eficiência.', true),
('COMP_012', 'Controle de Qualidade', 'tecnica', 'Capacidade de monitorar parâmetros de qualidade, realizar análises e garantir conformidade com padrões estabelecidos.', true),
('COMP_013', 'Manutenção Industrial', 'tecnica', 'Conhecimento em manutenção preventiva, preditiva e corretiva de equipamentos industriais.', true),
('COMP_014', 'Processos de Fabricação de Açúcar', 'tecnica', 'Domínio técnico dos processos de moagem, tratamento de caldo, evaporação, cristalização e secagem de açúcar.', true),
('COMP_015', 'Processos de Fabricação de Etanol', 'tecnica', 'Conhecimento dos processos de fermentação, destilação e desidratação para produção de etanol.', true),
('COMP_016', 'Gestão de Utilidades Industriais', 'tecnica', 'Conhecimento em geração e distribuição de vapor, energia elétrica, água tratada e ar comprimido.', true);

-- COMPETÊNCIAS TÉCNICAS - AGRÍCOLA
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_017', 'Manejo de Culturas de Cana-de-Açúcar', 'tecnica', 'Conhecimento de técnicas de plantio, tratos culturais, controle de pragas e doenças da cana-de-açúcar.', true),
('COMP_018', 'Operação de Máquinas Agrícolas', 'tecnica', 'Habilidade para operar tratores, colheitadeiras, plantadeiras e demais equipamentos agrícolas.', true),
('COMP_019', 'Mecanização Agrícola', 'tecnica', 'Conhecimento em manutenção e otimização de máquinas e implementos agrícolas.', true),
('COMP_020', 'Gestão de Safra', 'tecnica', 'Capacidade de planejar e executar operações de colheita, transporte e armazenamento de cana-de-açúcar.', true),
('COMP_021', 'Agricultura de Precisão', 'tecnica', 'Utilização de tecnologias (GPS, sensoriamento remoto, drones) para otimizar produtividade agrícola.', true);

-- COMPETÊNCIAS TÉCNICAS - SEGURANÇA DO TRABALHO
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_022', 'Normas Regulamentadoras (NRs)', 'tecnica', 'Conhecimento e aplicação das Normas Regulamentadoras de Segurança e Saúde no Trabalho.', true),
('COMP_023', 'Análise de Riscos', 'tecnica', 'Capacidade de identificar, avaliar e propor medidas de controle de riscos ocupacionais.', true),
('COMP_024', 'Investigação de Acidentes', 'tecnica', 'Habilidade de investigar causas de acidentes e incidentes, propondo ações preventivas.', true),
('COMP_025', 'Ergonomia', 'tecnica', 'Conhecimento de princípios ergonômicos para prevenção de doenças ocupacionais.', true);

-- COMPETÊNCIAS TÉCNICAS - QUALIDADE E MEIO AMBIENTE
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_026', 'Sistemas de Gestão da Qualidade (ISO 9001)', 'tecnica', 'Conhecimento de requisitos e implementação de sistemas de gestão da qualidade.', true),
('COMP_027', 'Sistemas de Gestão Ambiental (ISO 14001)', 'tecnica', 'Conhecimento de requisitos e implementação de sistemas de gestão ambiental.', true),
('COMP_028', 'Tratamento de Efluentes', 'tecnica', 'Conhecimento de processos de tratamento de efluentes industriais e agrícolas.', true),
('COMP_029', 'Gestão de Resíduos', 'tecnica', 'Capacidade de gerenciar resíduos sólidos conforme legislação ambiental e princípios de economia circular.', true);

-- COMPETÊNCIAS TÉCNICAS - LOGÍSTICA
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_030', 'Gestão de Estoques', 'tecnica', 'Conhecimento de técnicas de controle, armazenamento e movimentação de materiais e produtos.', true),
('COMP_031', 'Planejamento de Transporte', 'tecnica', 'Capacidade de planejar rotas, otimizar cargas e gerenciar frota de veículos.', true),
('COMP_032', 'Armazenamento de Açúcar', 'tecnica', 'Conhecimento de técnicas de armazenamento, preservação e expedição de açúcar.', true),
('COMP_033', 'Gestão de Carregamento', 'tecnica', 'Habilidade de coordenar operações de carregamento de açúcar e etanol com segurança e eficiência.', true);

-- COMPETÊNCIAS TÉCNICAS - RECURSOS HUMANOS
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_034', 'Recrutamento e Seleção', 'tecnica', 'Conhecimento de técnicas de atração, seleção e contratação de talentos.', true),
('COMP_035', 'Administração de Pessoal', 'tecnica', 'Domínio de rotinas de folha de pagamento, benefícios, admissão e desligamento.', true),
('COMP_036', 'Desenvolvimento Organizacional', 'tecnica', 'Capacidade de planejar e executar programas de treinamento, desenvolvimento e gestão de talentos.', true),
('COMP_037', 'Relações Trabalhistas', 'tecnica', 'Conhecimento de legislação trabalhista, negociações sindicais e gestão de conflitos.', true);

-- COMPETÊNCIAS TÉCNICAS - FINANCEIRO E CONTROLADORIA
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_038', 'Análise Financeira', 'tecnica', 'Capacidade de analisar demonstrativos financeiros, indicadores e projeções econômicas.', true),
('COMP_039', 'Controladoria', 'tecnica', 'Conhecimento de controles internos, auditoria e compliance financeiro.', true),
('COMP_040', 'Planejamento Orçamentário', 'tecnica', 'Habilidade de elaborar, acompanhar e revisar orçamentos empresariais.', true),
('COMP_041', 'Gestão de Custos', 'tecnica', 'Capacidade de analisar, controlar e otimizar custos de produção e operacionais.', true);

-- COMPETÊNCIAS TÉCNICAS - ENGENHARIA E PROJETOS
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_042', 'Gestão de Projetos', 'tecnica', 'Conhecimento de metodologias de gestão de projetos (PMI, SCRUM) para planejamento e execução.', true),
('COMP_043', 'Engenharia de Processos', 'tecnica', 'Capacidade de analisar, otimizar e redesenhar processos industriais.', true),
('COMP_044', 'AutoCAD e Desenho Técnico', 'tecnica', 'Habilidade de interpretar e elaborar desenhos técnicos e projetos de engenharia.', true),
('COMP_045', 'Análise de Viabilidade Técnica', 'tecnica', 'Capacidade de avaliar viabilidade técnica e econômica de projetos e investimentos.', true);

-- COMPETÊNCIAS TÉCNICAS - TECNOLOGIA DA INFORMAÇÃO
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_046', 'Sistemas ERP (TOTVS RM)', 'tecnica', 'Conhecimento e operação de sistemas integrados de gestão empresarial.', true),
('COMP_047', 'Análise de Dados', 'tecnica', 'Capacidade de coletar, processar e interpretar dados para suporte à decisão.', true),
('COMP_048', 'Infraestrutura de TI', 'tecnica', 'Conhecimento de redes, servidores, segurança da informação e suporte técnico.', true),
('COMP_049', 'Desenvolvimento de Sistemas', 'tecnica', 'Habilidade de programar, testar e implementar soluções de software.', true);

-- COMPETÊNCIAS TÉCNICAS - COMERCIAL E VENDAS
INSERT INTO competencies (code, name, category, description, active) VALUES
('COMP_050', 'Negociação Comercial', 'tecnica', 'Habilidade de conduzir negociações, fechar contratos e manter relacionamento com clientes.', true),
('COMP_051', 'Gestão de Carteira de Clientes', 'tecnica', 'Capacidade de gerenciar relacionamento, atendimento e fidelização de clientes.', true),
('COMP_052', 'Análise de Mercado', 'tecnica', 'Conhecimento de técnicas de pesquisa e análise de mercado, concorrência e tendências.', true);
