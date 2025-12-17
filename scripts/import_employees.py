#!/usr/bin/env python3
"""
Script de Importação de Funcionários e Hierarquias
Sistema AVD UISA - Usinas Itamarati

Este script processa o arquivo Excel com dados de funcionários e hierarquias
e gera arquivos SQL para importação no banco de dados.
"""

import pandas as pd
import json
import re
from datetime import datetime

# Configurações
INPUT_FILE = '/home/ubuntu/upload/funcionarioscomahierarquia.xlsx'
OUTPUT_DIR = '/home/ubuntu/avd-uisa-sistema-completo/scripts'

def clean_string(value):
    """Limpa e normaliza strings"""
    if pd.isna(value) or value is None:
        return None
    value = str(value).strip()
    if value == '' or value.lower() == 'nan':
        return None
    return value

def clean_code(value):
    """Limpa códigos (chapas, etc)"""
    if pd.isna(value) or value is None:
        return None
    value = str(value).strip()
    # Remove .0 de números float
    if value.endswith('.0'):
        value = value[:-2]
    # Remove zeros à esquerda para padronização
    value = value.lstrip('0') or '0'
    return value

def escape_sql(value):
    """Escapa strings para SQL"""
    if value is None:
        return 'NULL'
    value = str(value).replace("'", "''").replace("\\", "\\\\")
    return f"'{value}'"

def main():
    print("=== Iniciando Importação de Funcionários ===")
    print(f"Arquivo: {INPUT_FILE}")
    
    # Ler arquivo Excel
    df = pd.read_excel(INPUT_FILE)
    print(f"Total de registros: {len(df)}")
    
    # Renomear colunas para facilitar acesso
    df.columns = [
        'empresa', 'chapa', 'nome', 'email', 
        'cod_secao', 'secao', 'cod_funcao', 'funcao',
        'chapa_presidente', 'presidente', 'funcao_presidente', 'email_presidente',
        'chapa_diretor', 'diretor', 'funcao_diretor', 'email_diretor',
        'chapa_gestor', 'gestor', 'funcao_gestor', 'email_gestor',
        'chapa_coordenador', 'coordenador', 'funcao_coordenador', 'email_coordenador'
    ]
    
    # =========================================================================
    # 1. EXTRAIR EMPRESAS ÚNICAS
    # =========================================================================
    empresas = df['empresa'].dropna().unique()
    print(f"\nEmpresas encontradas: {len(empresas)}")
    for e in empresas:
        print(f"  - {e}")
    
    # =========================================================================
    # 2. EXTRAIR SEÇÕES/DEPARTAMENTOS ÚNICOS
    # =========================================================================
    secoes_df = df[['cod_secao', 'secao']].drop_duplicates()
    secoes_df = secoes_df.dropna(subset=['secao'])
    print(f"\nSeções/Departamentos únicos: {len(secoes_df)}")
    
    # =========================================================================
    # 3. EXTRAIR FUNÇÕES/CARGOS ÚNICOS
    # =========================================================================
    funcoes_df = df[['cod_funcao', 'funcao']].drop_duplicates()
    funcoes_df = funcoes_df.dropna(subset=['funcao'])
    print(f"Funções/Cargos únicos: {len(funcoes_df)}")
    
    # =========================================================================
    # 4. EXTRAIR FUNCIONÁRIOS ÚNICOS (por chapa)
    # =========================================================================
    # Remover duplicatas mantendo o primeiro registro
    funcionarios_df = df.drop_duplicates(subset=['chapa'], keep='first')
    print(f"Funcionários únicos: {len(funcionarios_df)}")
    
    # =========================================================================
    # 5. EXTRAIR HIERARQUIA (líderes únicos)
    # =========================================================================
    lideres = set()
    
    # Presidentes
    for _, row in df.iterrows():
        if pd.notna(row['chapa_presidente']) and pd.notna(row['presidente']):
            lideres.add((
                clean_code(row['chapa_presidente']),
                clean_string(row['presidente']),
                clean_string(row['email_presidente']),
                clean_string(row['funcao_presidente']),
                'presidente'
            ))
    
    # Diretores
    for _, row in df.iterrows():
        if pd.notna(row['chapa_diretor']) and pd.notna(row['diretor']):
            lideres.add((
                clean_code(row['chapa_diretor']),
                clean_string(row['diretor']),
                clean_string(row['email_diretor']),
                clean_string(row['funcao_diretor']),
                'diretor'
            ))
    
    # Gestores
    for _, row in df.iterrows():
        if pd.notna(row['chapa_gestor']) and pd.notna(row['gestor']):
            lideres.add((
                clean_code(row['chapa_gestor']),
                clean_string(row['gestor']),
                clean_string(row['email_gestor']),
                clean_string(row['funcao_gestor']),
                'gestor'
            ))
    
    # Coordenadores
    for _, row in df.iterrows():
        if pd.notna(row['chapa_coordenador']) and pd.notna(row['coordenador']):
            lideres.add((
                clean_code(row['chapa_coordenador']),
                clean_string(row['coordenador']),
                clean_string(row['email_coordenador']),
                clean_string(row['funcao_coordenador']),
                'coordenador'
            ))
    
    print(f"Líderes únicos identificados: {len(lideres)}")
    
    # =========================================================================
    # 6. GERAR SQL DE IMPORTAÇÃO
    # =========================================================================
    
    sql_statements = []
    
    # Cabeçalho
    sql_statements.append("-- ============================================")
    sql_statements.append("-- IMPORTAÇÃO DE FUNCIONÁRIOS E HIERARQUIAS")
    sql_statements.append(f"-- Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql_statements.append("-- Sistema AVD UISA")
    sql_statements.append("-- ============================================")
    sql_statements.append("")
    
    # 6.1 Inserir Departamentos/Seções
    sql_statements.append("-- ============================================")
    sql_statements.append("-- DEPARTAMENTOS/SEÇÕES")
    sql_statements.append("-- ============================================")
    sql_statements.append("")
    
    dept_map = {}
    for idx, (_, row) in enumerate(secoes_df.iterrows(), 1):
        cod = clean_string(row['cod_secao']) or f'SEC{idx:04d}'
        nome = clean_string(row['secao'])
        if nome:
            # Criar código único baseado no nome se não tiver código
            code = re.sub(r'[^a-zA-Z0-9]', '', cod)[:50] if cod else f'SEC{idx:04d}'
            dept_map[nome] = code
            sql_statements.append(
                f"INSERT IGNORE INTO departments (code, name, active, createdAt, updatedAt) "
                f"VALUES ({escape_sql(code)}, {escape_sql(nome)}, 1, NOW(), NOW());"
            )
    
    sql_statements.append("")
    
    # 6.2 Inserir Cargos/Funções
    sql_statements.append("-- ============================================")
    sql_statements.append("-- CARGOS/FUNÇÕES")
    sql_statements.append("-- ============================================")
    sql_statements.append("")
    
    position_map = {}
    for idx, (_, row) in enumerate(funcoes_df.iterrows(), 1):
        cod = clean_string(row['cod_funcao']) or f'FUN{idx:04d}'
        titulo = clean_string(row['funcao'])
        if titulo:
            code = str(cod)[:50] if cod else f'FUN{idx:04d}'
            position_map[titulo] = code
            
            # Determinar nível hierárquico
            titulo_lower = titulo.lower()
            level = 'NULL'
            if 'diretor' in titulo_lower or 'presidente' in titulo_lower:
                level = "'diretor'"
            elif 'gerente' in titulo_lower:
                level = "'gerente'"
            elif 'coordenador' in titulo_lower:
                level = "'coordenador'"
            elif 'supervisor' in titulo_lower or 'líder' in titulo_lower or 'lider' in titulo_lower:
                level = "'especialista'"
            elif 'senior' in titulo_lower or 'sênior' in titulo_lower:
                level = "'senior'"
            elif 'pleno' in titulo_lower:
                level = "'pleno'"
            elif 'junior' in titulo_lower or 'júnior' in titulo_lower:
                level = "'junior'"
            
            sql_statements.append(
                f"INSERT IGNORE INTO positions (code, title, level, active, createdAt, updatedAt) "
                f"VALUES ({escape_sql(code)}, {escape_sql(titulo)}, {level}, 1, NOW(), NOW());"
            )
    
    sql_statements.append("")
    
    # 6.3 Inserir Funcionários
    sql_statements.append("-- ============================================")
    sql_statements.append("-- FUNCIONÁRIOS")
    sql_statements.append("-- ============================================")
    sql_statements.append("")
    
    employee_chapas = set()
    
    for _, row in funcionarios_df.iterrows():
        chapa = clean_code(row['chapa'])
        if not chapa or chapa in employee_chapas:
            continue
        employee_chapas.add(chapa)
        
        nome = clean_string(row['nome'])
        email = clean_string(row['email'])
        cod_secao = clean_string(row['cod_secao'])
        secao = clean_string(row['secao'])
        cod_funcao = clean_string(row['cod_funcao'])
        funcao = clean_string(row['funcao'])
        empresa = clean_string(row['empresa'])
        
        # Hierarquia
        chapa_gestor = clean_code(row['chapa_gestor'])
        chapa_coordenador = clean_code(row['chapa_coordenador'])
        chapa_diretor = clean_code(row['chapa_diretor'])
        
        # Determinar nível hierárquico do funcionário
        hierarchy_level = 'operacional'
        if funcao:
            funcao_lower = funcao.lower()
            if 'presidente' in funcao_lower or 'diretor' in funcao_lower:
                hierarchy_level = 'diretoria'
            elif 'gerente' in funcao_lower:
                hierarchy_level = 'gerencia'
            elif 'coordenador' in funcao_lower:
                hierarchy_level = 'coordenacao'
            elif 'supervisor' in funcao_lower or 'líder' in funcao_lower or 'lider' in funcao_lower:
                hierarchy_level = 'supervisao'
        
        # Determinar gestor direto (coordenador > gestor > diretor)
        gestor_chapa = chapa_coordenador or chapa_gestor or chapa_diretor
        
        sql_statements.append(
            f"INSERT INTO employees ("
            f"employeeCode, name, email, corporateEmail, chapa, "
            f"codSecao, secao, codFuncao, funcao, "
            f"hierarchyLevel, status, active, createdAt, updatedAt"
            f") VALUES ("
            f"{escape_sql(chapa)}, {escape_sql(nome)}, {escape_sql(email)}, {escape_sql(email)}, {escape_sql(chapa)}, "
            f"{escape_sql(cod_secao)}, {escape_sql(secao)}, {escape_sql(cod_funcao)}, {escape_sql(funcao)}, "
            f"'{hierarchy_level}', 'ativo', 1, NOW(), NOW()"
            f") ON DUPLICATE KEY UPDATE "
            f"name = VALUES(name), email = VALUES(email), corporateEmail = VALUES(corporateEmail), "
            f"codSecao = VALUES(codSecao), secao = VALUES(secao), "
            f"codFuncao = VALUES(codFuncao), funcao = VALUES(funcao), "
            f"hierarchyLevel = VALUES(hierarchyLevel), updatedAt = NOW();"
        )
    
    sql_statements.append("")
    
    # 6.4 Atualizar relacionamentos hierárquicos
    sql_statements.append("-- ============================================")
    sql_statements.append("-- ATUALIZAÇÃO DE HIERARQUIAS (managerId)")
    sql_statements.append("-- ============================================")
    sql_statements.append("")
    
    for _, row in funcionarios_df.iterrows():
        chapa = clean_code(row['chapa'])
        if not chapa:
            continue
        
        # Determinar gestor direto
        chapa_coordenador = clean_code(row['chapa_coordenador'])
        chapa_gestor = clean_code(row['chapa_gestor'])
        chapa_diretor = clean_code(row['chapa_diretor'])
        
        # Prioridade: coordenador > gestor > diretor
        gestor_chapa = None
        if chapa_coordenador and chapa_coordenador != chapa:
            gestor_chapa = chapa_coordenador
        elif chapa_gestor and chapa_gestor != chapa:
            gestor_chapa = chapa_gestor
        elif chapa_diretor and chapa_diretor != chapa:
            gestor_chapa = chapa_diretor
        
        if gestor_chapa:
            sql_statements.append(
                f"UPDATE employees e "
                f"SET e.managerId = (SELECT id FROM (SELECT id FROM employees WHERE employeeCode = {escape_sql(gestor_chapa)} LIMIT 1) AS tmp) "
                f"WHERE e.employeeCode = {escape_sql(chapa)};"
            )
    
    sql_statements.append("")
    
    # 6.5 Atualizar departmentId e positionId
    sql_statements.append("-- ============================================")
    sql_statements.append("-- ATUALIZAÇÃO DE DEPARTAMENTOS E CARGOS")
    sql_statements.append("-- ============================================")
    sql_statements.append("")
    
    sql_statements.append(
        "UPDATE employees e "
        "JOIN departments d ON e.secao = d.name "
        "SET e.departmentId = d.id "
        "WHERE e.departmentId IS NULL;"
    )
    
    sql_statements.append("")
    
    sql_statements.append(
        "UPDATE employees e "
        "JOIN positions p ON e.funcao = p.title "
        "SET e.positionId = p.id "
        "WHERE e.positionId IS NULL;"
    )
    
    sql_statements.append("")
    sql_statements.append("-- ============================================")
    sql_statements.append("-- FIM DA IMPORTAÇÃO")
    sql_statements.append("-- ============================================")
    
    # Salvar arquivo SQL
    sql_file = f"{OUTPUT_DIR}/import_data.sql"
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))
    
    print(f"\nArquivo SQL gerado: {sql_file}")
    print(f"Total de statements: {len([s for s in sql_statements if s.startswith('INSERT') or s.startswith('UPDATE')])}")
    
    # =========================================================================
    # 7. GERAR RELATÓRIO DE IMPORTAÇÃO
    # =========================================================================
    
    report = {
        'data_geracao': datetime.now().isoformat(),
        'arquivo_origem': INPUT_FILE,
        'estatisticas': {
            'total_registros': len(df),
            'funcionarios_unicos': len(funcionarios_df),
            'empresas': len(empresas),
            'departamentos': len(secoes_df),
            'cargos': len(funcoes_df),
            'lideres': len(lideres)
        },
        'empresas': list(empresas),
        'hierarquia': {
            'presidentes': len([l for l in lideres if l[4] == 'presidente']),
            'diretores': len([l for l in lideres if l[4] == 'diretor']),
            'gestores': len([l for l in lideres if l[4] == 'gestor']),
            'coordenadores': len([l for l in lideres if l[4] == 'coordenador'])
        }
    }
    
    report_file = f"{OUTPUT_DIR}/import_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"Relatório gerado: {report_file}")
    
    print("\n=== Importação Preparada com Sucesso ===")
    print(f"Execute o arquivo SQL no banco de dados para completar a importação.")

if __name__ == '__main__':
    main()
