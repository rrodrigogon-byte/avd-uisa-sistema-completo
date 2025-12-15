#!/usr/bin/env python3.11
"""
Script de Importação de Funcionários
Processa planilha Excel e prepara dados para importação no sistema AVD UISA
"""

import pandas as pd
import json
import sys
from datetime import datetime

# Cargos que devem ser cadastrados como usuários do sistema
LEADERSHIP_ROLES = [
    'Lider',
    'Supervisor',
    'Coordenador',
    'Gerente',
    'Gerente Exec',
    'Diretor',
    'Diretor Agroindustrial',
    'CEO',
    'Presidente',
    'Especialista'
]

def normalize_phone(phone):
    """Normaliza número de telefone"""
    if pd.isna(phone):
        return None
    phone_str = str(phone)
    # Remove caracteres não numéricos
    phone_clean = ''.join(filter(str.isdigit, phone_str))
    if not phone_clean:
        return None
    # Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if len(phone_clean) == 11:
        return f"({phone_clean[0:2]}) {phone_clean[2:7]}-{phone_clean[7:]}"
    elif len(phone_clean) == 10:
        return f"({phone_clean[0:2]}) {phone_clean[2:6]}-{phone_clean[6:]}"
    return phone_clean

def normalize_email(email):
    """Normaliza email"""
    if pd.isna(email):
        return None
    email_str = str(email).strip().lower()
    if not email_str or email_str == 'nan':
        return None
    return email_str

def is_leadership_role(cargo):
    """Verifica se o cargo é de liderança"""
    if pd.isna(cargo):
        return False
    cargo_str = str(cargo).strip()
    return cargo_str in LEADERSHIP_ROLES

def generate_username(name, chapa):
    """Gera username baseado no nome e chapa"""
    if pd.isna(name):
        return f"user_{chapa}"
    
    # Pega primeiro nome e primeiro sobrenome
    parts = str(name).strip().split()
    if len(parts) >= 2:
        username = f"{parts[0].lower()}.{parts[1].lower()}"
    else:
        username = parts[0].lower()
    
    # Remove acentos e caracteres especiais
    username = username.replace('á', 'a').replace('é', 'e').replace('í', 'i')
    username = username.replace('ó', 'o').replace('ú', 'u').replace('ã', 'a')
    username = username.replace('õ', 'o').replace('ç', 'c').replace('ê', 'e')
    username = username.replace('â', 'a').replace('ô', 'o').replace('à', 'a')
    
    # Remove caracteres não alfanuméricos
    username = ''.join(c for c in username if c.isalnum() or c == '.')
    
    return username

def process_excel(file_path):
    """Processa planilha Excel e retorna dados estruturados"""
    
    print(f"Lendo planilha: {file_path}")
    df = pd.read_excel(file_path)
    
    print(f"Total de registros: {len(df)}")
    
    employees = []
    users_to_create = []
    
    for idx, row in df.iterrows():
        # Dados do funcionário
        chapa = str(row['CHAPA']).replace('.0', '') if not pd.isna(row['CHAPA']) else None
        nome = str(row['NOME']).strip() if not pd.isna(row['NOME']) else None
        
        if not chapa or not nome:
            print(f"Linha {idx + 2}: Ignorando registro sem chapa ou nome")
            continue
        
        # Normalizar emails
        email_pessoal = normalize_email(row.get('EMAILPESSOAL'))
        email_corporativo = normalize_email(row.get('EMAILCORPORATIVO'))
        
        # Usar email corporativo como principal, se disponível
        email_principal = email_corporativo or email_pessoal
        
        # Normalizar telefone
        telefone = normalize_phone(row.get('TELEFONE'))
        
        # Cargo
        cargo = str(row['CARGO']).strip() if not pd.isna(row['CARGO']) else None
        
        # Dados do funcionário
        employee = {
            'chapa': chapa,
            'name': nome,
            'email': email_principal,
            'personalEmail': email_pessoal,
            'corporateEmail': email_corporativo,
            'employeeCode': chapa,  # Usar chapa como código
            'codSecao': str(row['CODSEÇÃO']) if not pd.isna(row['CODSEÇÃO']) else None,
            'secao': str(row['SEÇÃO']).strip() if not pd.isna(row['SEÇÃO']) else None,
            'codFuncao': str(row['CODFUNÇÃO']).replace('.0', '') if not pd.isna(row['CODFUNÇÃO']) else None,
            'funcao': str(row['FUNÇÃO']).strip() if not pd.isna(row['FUNÇÃO']) else None,
            'situacao': str(row['SITUAÇÃO']).strip() if not pd.isna(row['SITUAÇÃO']) else None,
            'gerencia': str(row['GERENCIA']).strip() if not pd.isna(row['GERENCIA']) else None,
            'diretoria': str(row['DIRETORIA']).strip() if not pd.isna(row['DIRETORIA']) else None,
            'cargo': cargo,
            'telefone': telefone,
            'active': True,
            'status': 'ativo'
        }
        
        employees.append(employee)
        
        # Verificar se é cargo de liderança
        if is_leadership_role(cargo):
            username = generate_username(nome, chapa)
            
            user = {
                'employeeCode': chapa,
                'username': username,
                'name': nome,
                'email': email_principal,
                'cargo': cargo,
                'needsUserAccount': True
            }
            
            users_to_create.append(user)
    
    print(f"\nResumo:")
    print(f"- Funcionários a importar: {len(employees)}")
    print(f"- Usuários de liderança a criar: {len(users_to_create)}")
    
    print(f"\nCargos de liderança encontrados:")
    cargo_counts = {}
    for user in users_to_create:
        cargo = user['cargo']
        cargo_counts[cargo] = cargo_counts.get(cargo, 0) + 1
    
    for cargo, count in sorted(cargo_counts.items()):
        print(f"  - {cargo}: {count}")
    
    return {
        'employees': employees,
        'users': users_to_create,
        'summary': {
            'total_employees': len(employees),
            'total_users': len(users_to_create),
            'leadership_roles': cargo_counts
        }
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python import-employees.py <caminho_planilha>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    try:
        result = process_excel(file_path)
        
        # Salvar resultado em JSON
        output_file = '/home/ubuntu/avd-uisa-sistema-completo/import-data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"\nDados processados salvos em: {output_file}")
        print("Pronto para importação!")
        
    except Exception as e:
        print(f"Erro ao processar planilha: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
