#!/usr/bin/env python3.11
"""
Script de Importação de Hierarquia Organizacional
Importa dados do arquivo Excel de hierarquia para o banco de dados MySQL
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import os
import sys
from datetime import datetime

# Configuração do banco de dados
DATABASE_URL = os.getenv('DATABASE_URL', '')

def parse_database_url(url):
    """Parse DATABASE_URL para extrair credenciais"""
    # Formato: mysql://user:password@host:port/database?params
    if not url.startswith('mysql://'):
        raise ValueError("DATABASE_URL deve começar com mysql://")
    
    url = url.replace('mysql://', '')
    
    # Separar credenciais e host
    if '@' in url:
        credentials, rest = url.split('@', 1)
        user, password = credentials.split(':', 1)
    else:
        raise ValueError("DATABASE_URL inválida")
    
    # Separar host/port e database (remover parâmetros SSL)
    if '/' in rest:
        host_port, database_with_params = rest.split('/', 1)
        # Remover parâmetros SSL se existirem
        if '?' in database_with_params:
            database = database_with_params.split('?')[0]
        else:
            database = database_with_params
    else:
        raise ValueError("DATABASE_URL inválida")
    
    # Separar host e port
    if ':' in host_port:
        host, port = host_port.split(':', 1)
        port = int(port)
    else:
        host = host_port
        port = 3306
    
    return {
        'host': host,
        'port': port,
        'user': user,
        'password': password,
        'database': database,
        'ssl_ca': None,
        'ssl_disabled': False
    }

def create_hierarchy_table(cursor):
    """Cria a tabela de hierarquia se não existir"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS employeeHierarchy (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Funcionário
        employeeId INT NOT NULL,
        employeeChapa VARCHAR(50) NOT NULL,
        employeeName VARCHAR(255) NOT NULL,
        employeeEmail VARCHAR(320),
        employeeFunction VARCHAR(255),
        employeeFunctionCode VARCHAR(50),
        employeeSection VARCHAR(255),
        employeeSectionCode VARCHAR(100),
        
        -- Nível 1 - Coordenador
        coordinatorChapa VARCHAR(50),
        coordinatorName VARCHAR(255),
        coordinatorFunction VARCHAR(255),
        coordinatorEmail VARCHAR(320),
        coordinatorId INT,
        
        -- Nível 2 - Gestor
        managerChapa VARCHAR(50),
        managerName VARCHAR(255),
        managerFunction VARCHAR(255),
        managerEmail VARCHAR(320),
        managerId INT,
        
        -- Nível 3 - Diretor
        directorChapa VARCHAR(50),
        directorName VARCHAR(255),
        directorFunction VARCHAR(255),
        directorEmail VARCHAR(320),
        directorId INT,
        
        -- Nível 4 - Presidente
        presidentChapa VARCHAR(50),
        presidentName VARCHAR(255),
        presidentFunction VARCHAR(255),
        presidentEmail VARCHAR(320),
        presidentId INT,
        
        -- Metadados
        importedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Índices
        INDEX idx_employee_chapa (employeeChapa),
        INDEX idx_employee_id (employeeId),
        INDEX idx_coordinator_chapa (coordinatorChapa),
        INDEX idx_manager_chapa (managerChapa),
        INDEX idx_director_chapa (directorChapa),
        INDEX idx_president_chapa (presidentChapa)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    cursor.execute(create_table_sql)
    print("✓ Tabela employeeHierarchy criada/verificada com sucesso")

def get_employee_id_by_chapa(cursor, chapa):
    """Busca o ID do funcionário pela chapa"""
    if pd.isna(chapa) or chapa == '':
        return None
    
    query = "SELECT id FROM employees WHERE chapa = %s LIMIT 1"
    cursor.execute(query, (str(chapa),))
    result = cursor.fetchone()
    
    return result[0] if result else None

def safe_str(value):
    """Converte valor para string segura (None se vazio)"""
    if pd.isna(value) or value == '':
        return None
    return str(value).strip()

def import_hierarchy_data(excel_file_path):
    """Importa dados de hierarquia do Excel para o banco de dados"""
    
    print("=" * 80)
    print("IMPORTAÇÃO DE HIERARQUIA ORGANIZACIONAL")
    print("=" * 80)
    print(f"Arquivo: {excel_file_path}")
    print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print()
    
    # Conectar ao banco de dados
    try:
        db_config = parse_database_url(DATABASE_URL)
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        print("✓ Conexão com banco de dados estabelecida")
    except Error as e:
        print(f"✗ Erro ao conectar ao banco de dados: {e}")
        sys.exit(1)
    
    # Criar tabela de hierarquia
    try:
        create_hierarchy_table(cursor)
    except Error as e:
        print(f"✗ Erro ao criar tabela: {e}")
        connection.close()
        sys.exit(1)
    
    # Ler arquivo Excel
    try:
        df = pd.read_excel(excel_file_path)
        print(f"✓ Arquivo Excel lido com sucesso: {len(df)} registros")
    except Exception as e:
        print(f"✗ Erro ao ler arquivo Excel: {e}")
        connection.close()
        sys.exit(1)
    
    # Limpar tabela antes de importar
    try:
        cursor.execute("DELETE FROM employeeHierarchy")
        print("✓ Tabela employeeHierarchy limpa")
    except Error as e:
        print(f"✗ Erro ao limpar tabela: {e}")
        connection.close()
        sys.exit(1)
    
    # Preparar SQL de inserção
    insert_sql = """
    INSERT INTO employeeHierarchy (
        employeeId, employeeChapa, employeeName, employeeEmail,
        employeeFunction, employeeFunctionCode, employeeSection, employeeSectionCode,
        coordinatorChapa, coordinatorName, coordinatorFunction, coordinatorEmail, coordinatorId,
        managerChapa, managerName, managerFunction, managerEmail, managerId,
        directorChapa, directorName, directorFunction, directorEmail, directorId,
        presidentChapa, presidentName, presidentFunction, presidentEmail, presidentId
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s
    )
    """
    
    # Processar cada linha
    imported_count = 0
    error_count = 0
    skipped_count = 0
    
    print()
    print("Processando registros...")
    print()
    
    for index, row in df.iterrows():
        try:
            # Dados do funcionário
            employee_chapa = safe_str(row['Chapa'])
            
            if not employee_chapa:
                skipped_count += 1
                continue
            
            # Buscar ID do funcionário
            employee_id = get_employee_id_by_chapa(cursor, employee_chapa)
            
            if not employee_id:
                print(f"⚠ Funcionário não encontrado: {employee_chapa} - {safe_str(row['Nome'])}")
                skipped_count += 1
                continue
            
            # Dados do funcionário
            employee_name = safe_str(row['Nome'])
            employee_email = safe_str(row['Email'])
            employee_section_code = safe_str(row['[Código Seção]'])
            employee_section = safe_str(row['Seção'])
            employee_function_code = safe_str(row['[Código Função]'])
            employee_function = safe_str(row['Função'])
            
            # Coordenador
            coordinator_chapa = safe_str(row['[Chapa Coordenador]'])
            coordinator_name = safe_str(row['Coordenador'])
            coordinator_function = safe_str(row['[Função Coordenador]'])
            coordinator_email = safe_str(row['[Email Coordenador]'])
            coordinator_id = get_employee_id_by_chapa(cursor, coordinator_chapa) if coordinator_chapa else None
            
            # Gestor
            manager_chapa = safe_str(row['[Chapa Gestor]'])
            manager_name = safe_str(row['Gestor'])
            manager_function = safe_str(row['[Função Gestor]'])
            manager_email = safe_str(row['[Email Gestor]'])
            manager_id = get_employee_id_by_chapa(cursor, manager_chapa) if manager_chapa else None
            
            # Diretor
            director_chapa = safe_str(row['[Chapa Diretor]'])
            director_name = safe_str(row['Diretor'])
            director_function = safe_str(row['[Função Diretor]'])
            director_email = safe_str(row['[Email Diretor]'])
            director_id = get_employee_id_by_chapa(cursor, director_chapa) if director_chapa else None
            
            # Presidente
            president_chapa = safe_str(row['[Chapa Presidente]'])
            president_name = safe_str(row['Presidente'])
            president_function = safe_str(row['[Função Presidente]'])
            president_email = safe_str(row['[Email Presidente]'])
            president_id = get_employee_id_by_chapa(cursor, president_chapa) if president_chapa else None
            
            # Inserir registro
            cursor.execute(insert_sql, (
                employee_id, employee_chapa, employee_name, employee_email,
                employee_function, employee_function_code, employee_section, employee_section_code,
                coordinator_chapa, coordinator_name, coordinator_function, coordinator_email, coordinator_id,
                manager_chapa, manager_name, manager_function, manager_email, manager_id,
                director_chapa, director_name, director_function, director_email, director_id,
                president_chapa, president_name, president_function, president_email, president_id
            ))
            
            imported_count += 1
            
            # Mostrar progresso a cada 100 registros
            if imported_count % 100 == 0:
                print(f"  Processados: {imported_count} registros...")
            
        except Exception as e:
            error_count += 1
            print(f"✗ Erro ao processar linha {index + 1}: {e}")
            continue
    
    # Commit das alterações
    try:
        connection.commit()
        print()
        print("=" * 80)
        print("RESULTADO DA IMPORTAÇÃO")
        print("=" * 80)
        print(f"✓ Registros importados com sucesso: {imported_count}")
        print(f"⚠ Registros ignorados (não encontrados): {skipped_count}")
        print(f"✗ Registros com erro: {error_count}")
        print(f"Total de registros processados: {len(df)}")
        print("=" * 80)
    except Error as e:
        print(f"✗ Erro ao fazer commit: {e}")
        connection.rollback()
    finally:
        cursor.close()
        connection.close()
        print("✓ Conexão com banco de dados fechada")

if __name__ == "__main__":
    excel_file = "/home/ubuntu/upload/funcionarioscomahierarquia.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"✗ Arquivo não encontrado: {excel_file}")
        sys.exit(1)
    
    import_hierarchy_data(excel_file)
