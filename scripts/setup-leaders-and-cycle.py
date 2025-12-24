#!/usr/bin/env python3
"""
Script para:
1. Cadastrar todos os líderes da UISA como usuários do sistema
2. Criar o ciclo de avaliação 2025/2026
3. Configurar gestores como avaliadores de suas equipes
"""

import mysql.connector
import os
import uuid
from datetime import datetime, timedelta

# Configuração do banco de dados
DATABASE_URL = os.environ.get('DATABASE_URL', '')

def parse_database_url(url):
    """Parse DATABASE_URL para componentes de conexão"""
    # mysql://user:pass@host:port/database
    url = url.replace('mysql://', '')
    
    # Separar credenciais do host
    if '@' in url:
        creds, rest = url.split('@')
        if ':' in creds:
            user, password = creds.split(':')
        else:
            user = creds
            password = ''
    else:
        user = 'root'
        password = ''
        rest = url
    
    # Separar host/port do database
    if '/' in rest:
        host_port, database = rest.split('/')
        # Remover parâmetros de query
        if '?' in database:
            database = database.split('?')[0]
    else:
        host_port = rest
        database = 'avd_uisa'
    
    # Separar host e port
    if ':' in host_port:
        host, port = host_port.split(':')
        port = int(port)
    else:
        host = host_port
        port = 3306
    
    return {
        'host': host,
        'port': port,
        'user': user,
        'password': password,
        'database': database
    }

def get_connection():
    """Criar conexão com o banco de dados"""
    config = parse_database_url(DATABASE_URL)
    return mysql.connector.connect(
        host=config['host'],
        port=config['port'],
        user=config['user'],
        password=config['password'],
        database=config['database'],
        ssl_disabled=False,
        ssl_verify_cert=False
    )

def generate_open_id():
    """Gerar um openId único para o usuário"""
    return f"leader_{uuid.uuid4().hex[:16]}"

def get_role_for_level(hierarchy_level):
    """Determinar o role do usuário baseado no nível hierárquico"""
    if hierarchy_level in ['diretoria']:
        return 'admin'
    elif hierarchy_level in ['gerencia', 'coordenacao']:
        return 'gestor'
    elif hierarchy_level in ['supervisao']:
        return 'gestor'
    else:
        return 'colaborador'

def cadastrar_lideres_como_usuarios(conn):
    """Cadastrar todos os líderes como usuários do sistema"""
    cursor = conn.cursor(dictionary=True)
    
    print("\n" + "="*60)
    print("CADASTRO DE LÍDERES COMO USUÁRIOS")
    print("="*60)
    
    # Buscar líderes que ainda não têm userId
    cursor.execute("""
        SELECT 
            id, employeeCode, name, email, corporateEmail, funcao, hierarchyLevel
        FROM employees 
        WHERE active = 1 
        AND hierarchyLevel IN ('diretoria', 'gerencia', 'coordenacao', 'supervisao')
        AND userId IS NULL
        ORDER BY 
            CASE hierarchyLevel 
                WHEN 'diretoria' THEN 1 
                WHEN 'gerencia' THEN 2 
                WHEN 'coordenacao' THEN 3 
                WHEN 'supervisao' THEN 4 
            END,
            name
    """)
    
    lideres = cursor.fetchall()
    print(f"\nTotal de líderes sem usuário: {len(lideres)}")
    
    # Contadores por nível
    stats = {
        'diretoria': {'total': 0, 'criados': 0},
        'gerencia': {'total': 0, 'criados': 0},
        'coordenacao': {'total': 0, 'criados': 0},
        'supervisao': {'total': 0, 'criados': 0}
    }
    
    usuarios_criados = 0
    erros = 0
    
    for lider in lideres:
        nivel = lider['hierarchyLevel']
        if nivel in stats:
            stats[nivel]['total'] += 1
        
        # Determinar email (preferir corporateEmail, depois email)
        email = lider['corporateEmail'] or lider['email']
        if not email:
            email = f"{lider['employeeCode']}@uisa.com.br"
        
        # Gerar openId único
        open_id = generate_open_id()
        
        # Determinar role
        role = get_role_for_level(nivel)
        
        try:
            # Criar usuário
            cursor.execute("""
                INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn)
                VALUES (%s, %s, %s, %s, NOW(), NOW(), NOW())
            """, (open_id, lider['name'], email, role))
            
            user_id = cursor.lastrowid
            
            # Vincular usuário ao funcionário
            cursor.execute("""
                UPDATE employees SET userId = %s WHERE id = %s
            """, (user_id, lider['id']))
            
            usuarios_criados += 1
            if nivel in stats:
                stats[nivel]['criados'] += 1
            
        except Exception as e:
            erros += 1
            print(f"  Erro ao criar usuário para {lider['name']}: {e}")
    
    conn.commit()
    
    print(f"\n--- Resumo do Cadastro ---")
    print(f"Usuários criados: {usuarios_criados}")
    print(f"Erros: {erros}")
    print(f"\nPor nível hierárquico:")
    for nivel, dados in stats.items():
        print(f"  {nivel}: {dados['criados']}/{dados['total']} criados")
    
    return usuarios_criados

def criar_ciclo_avaliacao_2025_2026(conn):
    """Criar o ciclo de avaliação 2025/2026"""
    cursor = conn.cursor(dictionary=True)
    
    print("\n" + "="*60)
    print("CRIAÇÃO DO CICLO DE AVALIAÇÃO 2025/2026")
    print("="*60)
    
    # Verificar se já existe ciclo 2025/2026
    cursor.execute("""
        SELECT id, name, status FROM evaluationCycles 
        WHERE name LIKE '%2025/2026%' OR name LIKE '%2025-2026%'
    """)
    
    ciclo_existente = cursor.fetchone()
    
    if ciclo_existente:
        print(f"\nCiclo já existe: ID={ciclo_existente['id']}, Nome={ciclo_existente['name']}, Status={ciclo_existente['status']}")
        return ciclo_existente['id']
    
    # Criar novo ciclo
    nome_ciclo = "Ciclo de Avaliação 2025/2026"
    ano = 2025
    tipo = "anual"
    
    # Datas do ciclo
    data_inicio = datetime(2025, 1, 1)
    data_fim = datetime(2026, 6, 30)
    
    # Prazos
    prazo_autoavaliacao = datetime(2025, 3, 31)
    prazo_avaliacao_gestor = datetime(2025, 4, 30)
    prazo_consenso = datetime(2025, 5, 31)
    
    cursor.execute("""
        INSERT INTO evaluationCycles (
            name, year, type, startDate, endDate, status, active, description,
            selfEvaluationDeadline, managerEvaluationDeadline, consensusDeadline,
            createdAt, updatedAt
        ) VALUES (
            %s, %s, %s, %s, %s, 'ativo', 1, %s,
            %s, %s, %s,
            NOW(), NOW()
        )
    """, (
        nome_ciclo, ano, tipo, data_inicio, data_fim,
        "Ciclo de avaliação de desempenho para o período 2025/2026. Inclui avaliação de competências, metas e desenvolvimento individual.",
        prazo_autoavaliacao, prazo_avaliacao_gestor, prazo_consenso
    ))
    
    ciclo_id = cursor.lastrowid
    conn.commit()
    
    print(f"\nCiclo criado com sucesso!")
    print(f"  ID: {ciclo_id}")
    print(f"  Nome: {nome_ciclo}")
    print(f"  Período: {data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}")
    print(f"  Prazo Autoavaliação: {prazo_autoavaliacao.strftime('%d/%m/%Y')}")
    print(f"  Prazo Avaliação Gestor: {prazo_avaliacao_gestor.strftime('%d/%m/%Y')}")
    print(f"  Prazo Consenso: {prazo_consenso.strftime('%d/%m/%Y')}")
    
    return ciclo_id

def configurar_gestores_como_avaliadores(conn, ciclo_id):
    """Configurar gestores como avaliadores de suas equipes"""
    cursor = conn.cursor(dictionary=True)
    
    print("\n" + "="*60)
    print("CONFIGURAÇÃO DE GESTORES COMO AVALIADORES")
    print("="*60)
    
    # Buscar todos os funcionários com gestor definido
    cursor.execute("""
        SELECT 
            e.id as employee_id,
            e.name as employee_name,
            e.managerId,
            m.name as manager_name,
            m.userId as manager_user_id
        FROM employees e
        INNER JOIN employees m ON e.managerId = m.id
        WHERE e.active = 1 
        AND m.active = 1
        AND e.managerId IS NOT NULL
    """)
    
    funcionarios = cursor.fetchall()
    print(f"\nTotal de funcionários com gestor: {len(funcionarios)}")
    
    # Contar gestores únicos
    gestores_unicos = set()
    for f in funcionarios:
        gestores_unicos.add(f['managerId'])
    
    print(f"Total de gestores únicos: {len(gestores_unicos)}")
    
    # Verificar quantos gestores têm userId
    cursor.execute("""
        SELECT COUNT(DISTINCT e.managerId) as total
        FROM employees e
        INNER JOIN employees m ON e.managerId = m.id
        WHERE e.active = 1 
        AND m.active = 1
        AND e.managerId IS NOT NULL
        AND m.userId IS NOT NULL
    """)
    
    result = cursor.fetchone()
    gestores_com_usuario = result['total'] if result else 0
    print(f"Gestores com usuário no sistema: {gestores_com_usuario}")
    
    # Listar equipes por gestor
    cursor.execute("""
        SELECT 
            m.id as manager_id,
            m.name as manager_name,
            m.hierarchyLevel as manager_level,
            m.userId as manager_user_id,
            COUNT(e.id) as team_size
        FROM employees m
        INNER JOIN employees e ON e.managerId = m.id
        WHERE m.active = 1 
        AND e.active = 1
        GROUP BY m.id, m.name, m.hierarchyLevel, m.userId
        ORDER BY team_size DESC
        LIMIT 50
    """)
    
    equipes = cursor.fetchall()
    
    print(f"\n--- Top 20 Gestores por Tamanho de Equipe ---")
    for i, eq in enumerate(equipes[:20], 1):
        status_user = "✓" if eq['manager_user_id'] else "✗"
        print(f"  {i}. {eq['manager_name']} ({eq['manager_level']}): {eq['team_size']} subordinados [{status_user}]")
    
    return len(gestores_unicos), gestores_com_usuario

def main():
    """Função principal"""
    print("\n" + "="*60)
    print("SETUP DE LÍDERES E CICLO DE AVALIAÇÃO 2025/2026")
    print("="*60)
    print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    
    if not DATABASE_URL:
        print("\nERRO: DATABASE_URL não configurada!")
        return
    
    try:
        conn = get_connection()
        print("\nConexão com banco de dados estabelecida!")
        
        # 1. Cadastrar líderes como usuários
        usuarios_criados = cadastrar_lideres_como_usuarios(conn)
        
        # 2. Criar ciclo de avaliação 2025/2026
        ciclo_id = criar_ciclo_avaliacao_2025_2026(conn)
        
        # 3. Configurar gestores como avaliadores
        total_gestores, gestores_com_user = configurar_gestores_como_avaliadores(conn, ciclo_id)
        
        # Resumo final
        print("\n" + "="*60)
        print("RESUMO FINAL")
        print("="*60)
        print(f"✓ Usuários criados para líderes: {usuarios_criados}")
        print(f"✓ Ciclo de avaliação criado: ID {ciclo_id}")
        print(f"✓ Total de gestores identificados: {total_gestores}")
        print(f"✓ Gestores com acesso ao sistema: {gestores_com_user}")
        
        conn.close()
        print("\nProcesso concluído com sucesso!")
        
    except Exception as e:
        print(f"\nERRO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
