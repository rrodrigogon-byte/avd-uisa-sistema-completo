#!/usr/bin/env python3
"""
Script de Importação de Dados da Diretoria TAI
Processa o arquivo DIRETORIATAI.xlsx e gera SQL para importação
"""

import pandas as pd
import json
from datetime import datetime

# Ler arquivo Excel
df = pd.read_excel('/home/ubuntu/upload/DIRETORIATAI.xlsx')

print(f"Total de registros: {len(df)}")
print(f"\nColunas disponíveis: {list(df.columns)}")

# Análise dos dados
print("\n=== ANÁLISE DOS DADOS ===")
print(f"\nTotal de funcionários: {len(df)}")
print(f"\nStatus dos funcionários:")
print(df['SITUAÇÃO'].value_counts())

print(f"\nDiretorias:")
print(df['DIRETORIA'].value_counts())

print(f"\nGerências:")
print(df['GERENCIA'].value_counts())

print(f"\nCargos:")
print(df['CARGO'].value_counts())

# Identificar líderes (baseado em palavras-chave no cargo/função)
lideres_keywords = ['lider', 'líder', 'coordenador', 'supervisor', 'gerente', 'diretor', 'encarregado']
df['IS_LEADER'] = df['FUNÇÃO'].str.lower().str.contains('|'.join(lideres_keywords), na=False) | \
                  df['CARGO'].str.lower().str.contains('|'.join(lideres_keywords), na=False)

print(f"\n=== LÍDERES IDENTIFICADOS ===")
lideres = df[df['IS_LEADER'] == True][['CHAPA', 'NOME', 'CARGO', 'FUNÇÃO', 'GERENCIA']]
print(f"Total de líderes: {len(lideres)}")
print(lideres.to_string(index=False))

# Preparar dados para importação
employees_data = []

for idx, row in df.iterrows():
    # Determinar papel baseado no cargo
    role = 'user'
    if any(keyword in str(row['FUNÇÃO']).lower() for keyword in ['diretor']):
        role = 'admin'
    elif any(keyword in str(row['FUNÇÃO']).lower() for keyword in ['gerente', 'coordenador']):
        role = 'rh'
    elif row['IS_LEADER']:
        role = 'lider'
    
    # Email corporativo ou pessoal
    email = row['EMAILCORPORATIVO'] if pd.notna(row['EMAILCORPORATIVO']) and row['EMAILCORPORATIVO'] != 'Endereçoeletrônico@uisa.com.br' else row['EMAILPESSOAL']
    
    # Status
    status = 'active' if row['SITUAÇÃO'] == 'Ativo' else 'inactive'
    
    employee = {
        'employeeId': str(row['CHAPA']),
        'name': row['NOME'],
        'email': email if pd.notna(email) else None,
        'phone': str(row['TELEFONE']) if pd.notna(row['TELEFONE']) else None,
        'position': row['FUNÇÃO'],
        'department': row['GERENCIA'],
        'directorate': row['DIRETORIA'],
        'jobTitle': row['CARGO'],
        'status': status,
        'role': role,
        'section': row['SEÇÃO'] if pd.notna(row['SEÇÃO']) else None,
        'sectionCode': row['CODSEÇÃO'] if pd.notna(row['CODSEÇÃO']) else None,
        'functionCode': str(row['CODFUNÇÃO']) if pd.notna(row['CODFUNÇÃO']) else None,
    }
    
    employees_data.append(employee)

# Salvar JSON para análise
output_json = '/home/ubuntu/avd-uisa-sistema-completo/scripts/diretoria-tai-data.json'
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(employees_data, f, ensure_ascii=False, indent=2)

print(f"\n=== DADOS PROCESSADOS ===")
print(f"Arquivo JSON gerado: {output_json}")
print(f"Total de registros processados: {len(employees_data)}")

# Estatísticas por papel
roles_count = {}
for emp in employees_data:
    role = emp['role']
    roles_count[role] = roles_count.get(role, 0) + 1

print(f"\n=== DISTRIBUIÇÃO DE PAPÉIS ===")
for role, count in sorted(roles_count.items()):
    print(f"{role}: {count}")

# Gerar SQL de importação
print("\n=== GERANDO SQL DE IMPORTAÇÃO ===")

sql_statements = []

# SQL para inserir funcionários
for emp in employees_data:
    # Escapar aspas simples
    name = emp['name'].replace("'", "''")
    email = emp['email'].replace("'", "''") if emp['email'] else None
    phone = emp['phone'].replace("'", "''") if emp['phone'] else None
    position = emp['position'].replace("'", "''") if emp['position'] else None
    department = emp['department'].replace("'", "''") if emp['department'] else None
    directorate = emp['directorate'].replace("'", "''") if emp['directorate'] else None
    job_title = emp['jobTitle'].replace("'", "''") if emp['jobTitle'] else None
    section = emp['section'].replace("'", "''") if emp['section'] else None
    
    # Determinar active baseado no status
    active_value = '1' if emp['status'] == 'active' else '0'
    situacao_value = 'Ativo' if emp['status'] == 'active' else 'Ferias'
    
    # Determinar hierarchyLevel baseado no role
    hierarchy_map = {
        'admin': 'diretoria',
        'rh': 'gerencia',
        'lider': 'supervisao',
        'user': 'operacional'
    }
    hierarchy = hierarchy_map.get(emp['role'], 'operacional')
    
    sql = f"""
INSERT INTO employees (
    employeeCode, chapa, name, email, telefone, funcao, gerencia, 
    diretoria, cargo, situacao, secao, codSecao, codFuncao, 
    active, hierarchyLevel, createdAt, updatedAt
) VALUES (
    '{emp['employeeId']}',
    '{emp['employeeId']}',
    '{name}',
    {f"'{email}'" if email else 'NULL'},
    {f"'{phone}'" if phone else 'NULL'},
    {f"'{position}'" if position else 'NULL'},
    {f"'{department}'" if department else 'NULL'},
    {f"'{directorate}'" if directorate else 'NULL'},
    {f"'{job_title}'" if job_title else 'NULL'},
    '{situacao_value}',
    {f"'{section}'" if section else 'NULL'},
    {f"'{emp['sectionCode']}'" if emp['sectionCode'] else 'NULL'},
    {f"'{emp['functionCode']}'" if emp['functionCode'] else 'NULL'},
    {active_value},
    '{hierarchy}',
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
"""
    sql_statements.append(sql)

# Salvar SQL
output_sql = '/home/ubuntu/avd-uisa-sistema-completo/scripts/import-diretoria-tai.sql'
with open(output_sql, 'w', encoding='utf-8') as f:
    f.write("-- Importação de Dados da Diretoria TAI\n")
    f.write(f"-- Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    f.write(f"-- Total de registros: {len(employees_data)}\n\n")
    f.write("START TRANSACTION;\n\n")
    f.write('\n'.join(sql_statements))
    f.write("\n\nCOMMIT;\n")

print(f"Arquivo SQL gerado: {output_sql}")
print(f"\n✅ Processamento concluído com sucesso!")
