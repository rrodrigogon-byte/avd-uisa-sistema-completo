#!/usr/bin/env python3
"""
Script automatizado para corrigir uso inseguro de métodos de array
em componentes React (.tsx)
"""

import json
import re
from pathlib import Path
from typing import Dict, List

def add_safe_imports(content: str, methods_used: set) -> str:
    """Adiciona imports de funções seguras se necessário"""
    # Verifica se já tem import de arrayHelpers
    if 'from "@/lib/arrayHelpers"' in content or 'from "../lib/arrayHelpers"' in content:
        return content
    
    # Determina o caminho relativo correto baseado na localização do arquivo
    # A maioria dos arquivos está em pages/ ou components/
    import_path = "@/lib/arrayHelpers"
    
    # Encontra a primeira linha de import
    lines = content.split('\n')
    first_import_idx = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            first_import_idx = i
            break
    
    # Monta o import com as funções necessárias
    functions_to_import = []
    if 'map' in methods_used:
        functions_to_import.append('safeMap')
    if 'filter' in methods_used:
        functions_to_import.append('safeFilter')
    if 'find' in methods_used:
        functions_to_import.append('safeFind')
    if 'reduce' in methods_used:
        functions_to_import.append('safeReduce')
    if 'forEach' in methods_used:
        functions_to_import.append('safeForEach')
    if 'some' in methods_used:
        functions_to_import.append('safeSome')
    if 'every' in methods_used:
        functions_to_import.append('safeEvery')
    if 'flatMap' in methods_used:
        functions_to_import.append('safeFlatMap')
    if 'sort' in methods_used:
        functions_to_import.append('safeSort')
    
    # Adiciona isEmpty se houver verificações de array
    functions_to_import.append('isEmpty')
    
    import_line = f'import {{ {", ".join(functions_to_import)} }} from "{import_path}";\n'
    
    if first_import_idx >= 0:
        lines.insert(first_import_idx, import_line)
    else:
        # Se não há imports, adiciona no início
        lines.insert(0, import_line)
    
    return '\n'.join(lines)

def fix_array_method(content: str, method: str, variable: str, line_num: int) -> str:
    """Corrige uso inseguro de método de array"""
    lines = content.split('\n')
    
    if line_num > len(lines):
        return content
    
    line = lines[line_num - 1]
    
    # Mapeamento de métodos para funções seguras
    safe_function = {
        'map': 'safeMap',
        'filter': 'safeFilter',
        'find': 'safeFind',
        'reduce': 'safeReduce',
        'forEach': 'safeForEach',
        'some': 'safeSome',
        'every': 'safeEvery',
        'flatMap': 'safeFlatMap',
        'sort': 'safeSort',
    }.get(method, f'safe{method.capitalize()}')
    
    # Padrão para substituir: variable.method( -> safeMethod(variable,
    pattern = rf'\b{re.escape(variable)}\.{method}\('
    replacement = f'{safe_function}({variable}, '
    
    new_line = re.sub(pattern, replacement, line)
    
    if new_line != line:
        lines[line_num - 1] = new_line
        return '\n'.join(lines)
    
    return content

def fix_file(file_info: Dict) -> bool:
    """Corrige um arquivo com problemas identificados"""
    file_path = Path('/home/ubuntu/avd-uisa-sistema-completo') / file_info['file']
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Coleta métodos usados
        methods_used = set()
        for issue in file_info['issues']:
            methods_used.add(issue['method'])
        
        # Adiciona imports
        content = add_safe_imports(content, methods_used)
        
        # Corrige cada problema (em ordem reversa para não afetar números de linha)
        sorted_issues = sorted(file_info['issues'], key=lambda x: x['line'], reverse=True)
        for issue in sorted_issues:
            content = fix_array_method(
                content,
                issue['method'],
                issue['variable'],
                issue['line']
            )
        
        # Salva apenas se houve mudanças
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    
    except Exception as e:
        print(f"❌ Erro ao corrigir {file_path}: {e}")
        return False

def main():
    """Executa correção em todos os arquivos com problemas"""
    # Carrega relatório de auditoria
    report_path = '/home/ubuntu/avd-uisa-sistema-completo/audit-report.json'
    with open(report_path, 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    files_with_issues = report['files_with_issues']
    
    # Filtra apenas arquivos que NÃO estão protegidos ou que têm problemas reais
    files_to_fix = [
        f for f in files_with_issues
        if f.get('issues_count', 0) > 0 and not f.get('already_protected', False)
    ]
    
    print(f"🔧 Corrigindo {len(files_to_fix)} arquivos...\n")
    
    fixed_count = 0
    failed_count = 0
    
    for file_info in files_to_fix:
        file_name = file_info['file']
        print(f"Corrigindo: {file_name}...")
        
        if fix_file(file_info):
            fixed_count += 1
            print(f"  ✅ Corrigido ({file_info['issues_count']} problemas)")
        else:
            failed_count += 1
            print(f"  ⚠️  Sem mudanças ou erro")
    
    print("\n" + "=" * 80)
    print("📊 RESULTADO DA CORREÇÃO")
    print("=" * 80)
    print(f"✅ Arquivos corrigidos: {fixed_count}")
    print(f"⚠️  Arquivos com erro/sem mudanças: {failed_count}")
    print(f"📁 Total processado: {len(files_to_fix)}")

if __name__ == '__main__':
    main()
