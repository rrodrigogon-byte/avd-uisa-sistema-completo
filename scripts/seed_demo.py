#!/usr/bin/env python3
"""
Script para popular dados de demonstração no sistema AVD UISA
Usa SQL direto para evitar problemas com scripts Node travando
"""

import os
import mysql.connector
from datetime import datetime, timedelta
import random
import json

# Conectar ao banco
db_url = os.environ['DATABASE_URL']
# Parse DATABASE_URL: mysql://user:pass@host:port/database
parts = db_url.replace('mysql://', '').split('@')
user_pass = parts[0].split(':')
host_db = parts[1].split('/')
host_port = host_db[0].split(':')

conn = mysql.connector.connect(
    host=host_port[0],
    port=int(host_port[1]) if len(host_port) > 1 else 3306,
    user=user_pass[0],
    password=user_pass[1],
    database=host_db[1].split('?')[0]
)

cursor = conn.cursor(dictionary=True)

print("🌱 Iniciando seed de dados de demonstração...\n")

# 1. Buscar ciclo ativo
cursor.execute("SELECT id FROM evaluationCycles WHERE status = 'em_andamento' LIMIT 1")
cycle = cursor.fetchone()

if not cycle:
    print("❌ Nenhum ciclo ativo encontrado. Criando ciclo 2025...")
    cursor.execute("""
        INSERT INTO evaluationCycles (name, year, type, startDate, endDate, status, description, createdAt, updatedAt)
        VALUES ('Ciclo Anual 2025', 2025, 'anual', '2025-01-01', '2025-12-31', 'em_andamento', 
                'Ciclo de avaliação de desempenho anual 2025', NOW(), NOW())
    """)
    conn.commit()
    cycle_id = cursor.lastrowid
    print(f"✅ Ciclo criado: ID {cycle_id}\n")
else:
    cycle_id = cycle['id']
    print(f"✅ Ciclo ativo encontrado: ID {cycle_id}\n")

# 2. Buscar colaboradores
cursor.execute("SELECT id, name, email, positionId FROM employees ORDER BY RAND() LIMIT 50")
employees = cursor.fetchall()
print(f"✅ {len(employees)} colaboradores encontrados\n")

# 3. Criar 40 Metas SMART
print("📊 Criando 40 metas SMART de exemplo...")

metas = [
    # Financeiras (10)
    {'title': 'Reduzir Custos Operacionais em 15%', 'description': 'Implementar medidas de eficiência para reduzir custos operacionais do departamento em 15% até o final do trimestre.', 'category': 'financial', 'unit': 'percentage', 'target': 15, 'weight': 30, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 5},
    {'title': 'Aumentar Receita em R$ 500.000', 'description': 'Gerar R$ 500.000 em receita adicional através de novos contratos e expansão de serviços.', 'category': 'financial', 'unit': 'currency', 'target': 500000, 'weight': 40, 'bonus': True, 'bonusType': 'fixed', 'bonusValue': 2000},
    {'title': 'Melhorar Margem de Lucro em 8%', 'description': 'Otimizar processos para aumentar a margem de lucro do departamento em 8 pontos percentuais.', 'category': 'financial', 'unit': 'percentage', 'target': 8, 'weight': 35, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 4},
    {'title': 'Reduzir Desperdício em 20%', 'description': 'Implementar programa de redução de desperdício de materiais em 20% no processo produtivo.', 'category': 'financial', 'unit': 'percentage', 'target': 20, 'weight': 25, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 3},
    {'title': 'Aumentar ROI de Projetos em 12%', 'description': 'Melhorar o retorno sobre investimento dos projetos em andamento em 12%.', 'category': 'financial', 'unit': 'percentage', 'target': 12, 'weight': 30, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 5},
    {'title': 'Economizar R$ 200.000 em Fornecedores', 'description': 'Renegociar contratos com fornecedores para economizar R$ 200.000 anuais.', 'category': 'financial', 'unit': 'currency', 'target': 200000, 'weight': 35, 'bonus': True, 'bonusType': 'fixed', 'bonusValue': 1500},
    {'title': 'Aumentar Faturamento em 25%', 'description': 'Expandir base de clientes e aumentar faturamento da unidade em 25%.', 'category': 'financial', 'unit': 'percentage', 'target': 25, 'weight': 40, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 6},
    {'title': 'Reduzir Inadimplência para 3%', 'description': 'Implementar política de cobrança eficaz para reduzir inadimplência para 3%.', 'category': 'financial', 'unit': 'percentage', 'target': 3, 'weight': 30, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 4},
    {'title': 'Aumentar Ticket Médio em R$ 5.000', 'description': 'Elevar o ticket médio de vendas em R$ 5.000 através de upselling e cross-selling.', 'category': 'financial', 'unit': 'currency', 'target': 5000, 'weight': 25, 'bonus': True, 'bonusType': 'fixed', 'bonusValue': 1000},
    {'title': 'Melhorar Eficiência Operacional em 18%', 'description': 'Automatizar processos para melhorar eficiência operacional em 18%.', 'category': 'financial', 'unit': 'percentage', 'target': 18, 'weight': 35, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 5},
    
    # Comportamentais (10)
    {'title': 'Melhorar Comunicação com a Equipe', 'description': 'Realizar reuniões semanais de alinhamento e feedback com todos os membros da equipe.', 'category': 'behavioral', 'unit': 'count', 'target': 48, 'weight': 20, 'bonus': False},
    {'title': 'Desenvolver Liderança Colaborativa', 'description': 'Participar de 3 workshops de liderança e aplicar técnicas de gestão participativa.', 'category': 'behavioral', 'unit': 'count', 'target': 3, 'weight': 25, 'bonus': False},
    {'title': 'Aumentar Engajamento da Equipe para 85%', 'description': 'Implementar ações de reconhecimento e desenvolvimento para elevar engajamento para 85%.', 'category': 'behavioral', 'unit': 'percentage', 'target': 85, 'weight': 30, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 3},
    {'title': 'Reduzir Conflitos Internos em 50%', 'description': 'Aplicar técnicas de mediação e comunicação não-violenta para reduzir conflitos em 50%.', 'category': 'behavioral', 'unit': 'percentage', 'target': 50, 'weight': 20, 'bonus': False},
    {'title': 'Melhorar Clima Organizacional', 'description': 'Elevar índice de satisfação da equipe de 70% para 85% através de ações de bem-estar.', 'category': 'behavioral', 'unit': 'percentage', 'target': 85, 'weight': 25, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 4},
    {'title': 'Desenvolver Inteligência Emocional', 'description': 'Completar curso de IE e aplicar técnicas de autoconhecimento e empatia no dia a dia.', 'category': 'behavioral', 'unit': 'count', 'target': 1, 'weight': 15, 'bonus': False},
    {'title': 'Aumentar Colaboração entre Áreas', 'description': 'Criar 5 projetos interdepartamentais para melhorar sinergia entre equipes.', 'category': 'behavioral', 'unit': 'count', 'target': 5, 'weight': 20, 'bonus': False},
    {'title': 'Melhorar Feedback Contínuo', 'description': 'Dar feedback construtivo semanal para 100% dos subordinados diretos.', 'category': 'behavioral', 'unit': 'percentage', 'target': 100, 'weight': 25, 'bonus': False},
    {'title': 'Desenvolver Cultura de Inovação', 'description': 'Implementar programa de ideias que gere 20 sugestões de melhoria por trimestre.', 'category': 'behavioral', 'unit': 'count', 'target': 20, 'weight': 30, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 3},
    {'title': 'Aumentar Autonomia da Equipe', 'description': 'Delegar 70% das decisões operacionais para líderes de equipe.', 'category': 'behavioral', 'unit': 'percentage', 'target': 70, 'weight': 20, 'bonus': False},
    
    # Corporativas (10)
    {'title': 'Implementar Sistema de Gestão da Qualidade', 'description': 'Implantar ISO 9001 em todos os processos do departamento até dezembro.', 'category': 'corporate', 'unit': 'percentage', 'target': 100, 'weight': 40, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 5},
    {'title': 'Reduzir Turnover para 8%', 'description': 'Implementar programa de retenção de talentos para reduzir turnover de 15% para 8%.', 'category': 'corporate', 'unit': 'percentage', 'target': 8, 'weight': 35, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 4},
    {'title': 'Aumentar NPS para 80', 'description': 'Melhorar experiência do cliente para elevar Net Promoter Score para 80 pontos.', 'category': 'corporate', 'unit': 'score', 'target': 80, 'weight': 30, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 5},
    {'title': 'Reduzir Tempo de Resposta em 40%', 'description': 'Otimizar processos para reduzir tempo médio de resposta ao cliente em 40%.', 'category': 'corporate', 'unit': 'percentage', 'target': 40, 'weight': 25, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 3},
    {'title': 'Implementar Programa de Sustentabilidade', 'description': 'Reduzir consumo de energia em 15% e implementar coleta seletiva em 100% das áreas.', 'category': 'corporate', 'unit': 'percentage', 'target': 15, 'weight': 30, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 4},
    {'title': 'Aumentar Satisfação Interna para 90%', 'description': 'Elevar índice de satisfação dos colaboradores de 75% para 90%.', 'category': 'corporate', 'unit': 'percentage', 'target': 90, 'weight': 35, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 5},
    {'title': 'Reduzir Acidentes de Trabalho em 60%', 'description': 'Implementar programa de segurança para reduzir acidentes em 60%.', 'category': 'corporate', 'unit': 'percentage', 'target': 60, 'weight': 40, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 6},
    {'title': 'Aumentar Produtividade em 20%', 'description': 'Automatizar processos e treinar equipe para aumentar produtividade em 20%.', 'category': 'corporate', 'unit': 'percentage', 'target': 20, 'weight': 35, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 5},
    {'title': 'Implementar Transformação Digital', 'description': 'Digitalizar 80% dos processos manuais do departamento.', 'category': 'corporate', 'unit': 'percentage', 'target': 80, 'weight': 40, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 6},
    {'title': 'Melhorar Compliance para 100%', 'description': 'Garantir 100% de conformidade com normas regulatórias e políticas internas.', 'category': 'corporate', 'unit': 'percentage', 'target': 100, 'weight': 40, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 5},
    
    # Desenvolvimento (10)
    {'title': 'Completar MBA em Gestão Estratégica', 'description': 'Concluir curso de MBA com nota mínima 8.0 e aplicar conhecimentos no trabalho.', 'category': 'development', 'unit': 'count', 'target': 1, 'weight': 30, 'bonus': True, 'bonusType': 'fixed', 'bonusValue': 3000},
    {'title': 'Obter Certificação PMP', 'description': 'Estudar e obter certificação Project Management Professional até junho.', 'category': 'development', 'unit': 'count', 'target': 1, 'weight': 35, 'bonus': True, 'bonusType': 'fixed', 'bonusValue': 2500},
    {'title': 'Desenvolver Habilidade em Power BI', 'description': 'Completar 3 cursos de Power BI e criar 5 dashboards para o departamento.', 'category': 'development', 'unit': 'count', 'target': 5, 'weight': 20, 'bonus': False},
    {'title': 'Aprender Inglês Avançado', 'description': 'Atingir nível C1 em inglês através de curso intensivo de 6 meses.', 'category': 'development', 'unit': 'count', 'target': 1, 'weight': 25, 'bonus': True, 'bonusType': 'fixed', 'bonusValue': 2000},
    {'title': 'Participar de 5 Congressos da Área', 'description': 'Representar a empresa em 5 eventos do setor e trazer insights para a equipe.', 'category': 'development', 'unit': 'count', 'target': 5, 'weight': 20, 'bonus': False},
    {'title': 'Desenvolver Habilidade de Oratória', 'description': 'Fazer curso de oratória e apresentar 10 palestras internas sobre temas estratégicos.', 'category': 'development', 'unit': 'count', 'target': 10, 'weight': 15, 'bonus': False},
    {'title': 'Mentorar 5 Colaboradores Júnior', 'description': 'Atuar como mentor de 5 profissionais júnior para desenvolvimento de carreira.', 'category': 'development', 'unit': 'count', 'target': 5, 'weight': 20, 'bonus': False},
    {'title': 'Publicar 3 Artigos Técnicos', 'description': 'Escrever e publicar 3 artigos sobre boas práticas da área em revistas especializadas.', 'category': 'development', 'unit': 'count', 'target': 3, 'weight': 15, 'bonus': False},
    {'title': 'Completar Trilha de Liderança', 'description': 'Concluir programa de desenvolvimento de líderes com 120 horas de treinamento.', 'category': 'development', 'unit': 'count', 'target': 120, 'weight': 30, 'bonus': True, 'bonusType': 'percentage', 'bonusValue': 4},
    {'title': 'Desenvolver Visão Estratégica', 'description': 'Participar de comitê estratégico e contribuir com 10 propostas de melhoria.', 'category': 'development', 'unit': 'count', 'target': 10, 'weight': 25, 'bonus': False},
]

metas_criadas = 0
start_date = datetime.now()
end_date = start_date + timedelta(days=180)  # 6 meses

for meta in metas:
    employee = random.choice(employees)
    current_value = random.randint(0, meta['target'])
    progress = min(100, int((current_value / meta['target']) * 100))
    
    if progress == 0:
        status = 'draft'
    elif progress == 100:
        status = 'completed'
    elif progress >= 70:
        status = 'on_track'
    elif progress >= 40:
        status = 'at_risk'
    else:
        status = 'behind'
    
    try:
        cursor.execute("""
            INSERT INTO smartGoals (
                employeeId, cycleId, title, description, category, type,
                unit, targetValue, currentValue, progress, weight, status,
                startDate, dueDate, bonusEligible, bonusType, bonusValue,
                isSpecific, isMeasurable, isAchievable, isRelevant, isTimeBound,
                smartScore, createdAt, updatedAt
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            employee['id'], cycle_id, meta['title'], meta['description'], meta['category'], 'individual',
            meta['unit'], meta['target'], current_value, progress, meta['weight'], status,
            start_date, end_date, meta.get('bonus', False), meta.get('bonusType'), meta.get('bonusValue'),
            True, True, True, True, True, 100
        ))
        metas_criadas += 1
    except Exception as e:
        print(f"Erro ao criar meta '{meta['title']}': {e}")

conn.commit()
print(f"✅ {metas_criadas} metas SMART criadas!\n")

# 4. Criar 10 Avaliações 360°
print("🎯 Criando 10 avaliações 360°...")
avaliacoes_criadas = 0

for i in range(min(10, len(employees))):
    employee = employees[i]
    self_score = round(random.uniform(3.0, 5.0), 1)
    manager_score = round(random.uniform(3.0, 5.0), 1)
    peer_score = round(random.uniform(3.0, 5.0), 1)
    subordinate_score = round(random.uniform(3.0, 5.0), 1)
    final_score = round((self_score + manager_score + peer_score + subordinate_score) / 4, 1)
    
    status = random.choice(['pending', 'self_assessment', 'manager_review', 'peer_review', 'completed'])
    
    try:
        cursor.execute("""
            INSERT INTO evaluations (
                employeeId, cycleId, evaluationType, status,
                selfAssessmentScore, managerScore, peerScore, subordinateScore, finalScore,
                createdAt, updatedAt
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            employee['id'], cycle_id, '360', status,
            self_score, manager_score, peer_score, subordinate_score, final_score
        ))
        avaliacoes_criadas += 1
    except Exception as e:
        print(f"Erro ao criar avaliação para {employee['name']}: {e}")

conn.commit()
print(f"✅ {avaliacoes_criadas} avaliações 360° criadas!\n")

# 5. Criar 5 PDIs
print("📚 Criando 5 PDIs Inteligentes...")

pdis = [
    {'title': 'Desenvolvimento em Liderança Estratégica', 'description': 'Plano focado em desenvolver competências de liderança estratégica e gestão de mudanças.', 'duration': 12, 'objectives': 'Desenvolver visão estratégica, melhorar comunicação executiva, liderar projetos de transformação.', 'actions': '70% Experiência: Liderar 3 projetos estratégicos | 20% Relacionamento: Mentorias com C-Level | 10% Educação: MBA Executivo'},
    {'title': 'Transição para Gestão de Pessoas', 'description': 'PDI para colaborador técnico que assumirá posição de liderança.', 'duration': 9, 'objectives': 'Desenvolver habilidades de gestão de equipes, feedback e desenvolvimento de pessoas.', 'actions': '70% Experiência: Co-liderar equipe de 5 pessoas | 20% Relacionamento: Mentoria com gestor sênior | 10% Educação: Curso de Liderança'},
    {'title': 'Especialização Técnica em Data Analytics', 'description': 'Desenvolvimento de competências avançadas em análise de dados e BI.', 'duration': 6, 'objectives': 'Dominar Power BI, Python para análise de dados e storytelling com dados.', 'actions': '70% Experiência: Criar 10 dashboards estratégicos | 20% Relacionamento: Networking com analistas sênior | 10% Educação: Certificação Power BI'},
    {'title': 'Preparação para Sucessão - Gerente de Operações', 'description': 'PDI para sucessor identificado para posição de Gerente de Operações.', 'duration': 18, 'objectives': 'Desenvolver visão sistêmica, gestão de processos e liderança de equipes multifuncionais.', 'actions': '70% Experiência: Job rotation em 4 áreas | 20% Relacionamento: Shadowing do gerente atual | 10% Educação: Especialização em Gestão'},
    {'title': 'Desenvolvimento de Soft Skills', 'description': 'Foco em comunicação, inteligência emocional e trabalho em equipe.', 'duration': 6, 'objectives': 'Melhorar comunicação interpessoal, desenvolver empatia e colaboração.', 'actions': '70% Experiência: Participar de 5 projetos interdepartamentais | 20% Relacionamento: Grupo de estudos de IE | 10% Educação: Workshop de Comunicação'},
]

pdis_criados = 0

for i, pdi in enumerate(pdis):
    if i + 10 >= len(employees):
        break
    employee = employees[i + 10]
    status = random.choice(['draft', 'pending_approval', 'approved', 'in_progress'])
    start = datetime.now()
    end = start + timedelta(days=pdi['duration'] * 30)
    
    try:
        cursor.execute("""
            INSERT INTO pdis (
                employeeId, title, description, status, duration,
                objectives, actions, startDate, endDate,
                createdAt, updatedAt
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            employee['id'], pdi['title'], pdi['description'], status, pdi['duration'],
            pdi['objectives'], pdi['actions'], start, end
        ))
        pdis_criados += 1
    except Exception as e:
        print(f"Erro ao criar PDI '{pdi['title']}': {e}")

conn.commit()
print(f"✅ {pdis_criados} PDIs criados!\n")

# Resumo
print("🎉 Seed concluído com sucesso!\n")
print("📊 Resumo:")
print(f"   - {metas_criadas} Metas SMART")
print(f"   - {avaliacoes_criadas} Avaliações 360°")
print(f"   - {pdis_criados} PDIs Inteligentes")
print(f"   - {len(employees)} Colaboradores utilizados")
print(f"   - Ciclo ID: {cycle_id}\n")

cursor.close()
conn.close()
print("✅ Conexão encerrada.")
