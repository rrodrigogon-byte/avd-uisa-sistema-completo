#!/usr/bin/env python3
"""
Script de auditoria automática para identificar uso inseguro de métodos de array
em componentes React (.tsx)
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Set
import json

# Padrões regex para detectar uso inseguro de métodos de array
UNSAFE_PATTERNS = {
    'map': r'(?<!safe)(\w+)\.map\(',
    'filter': r'(?<!safe)(\w+)\.filter\(',
    'find': r'(?<!safe)(\w+)\.find\(',
    'reduce': r'(?<!safe)(\w+)\.reduce\(',
    'forEach': r'(?<!safe)(\w+)\.forEach\(',
    'some': r'(?<!safe)(\w+)\.some\(',
    'every': r'(?<!safe)(\w+)\.every\(',
    'flatMap': r'(?<!safe)(\w+)\.flatMap\(',
    'sort': r'(?<!safe)(\w+)\.sort\(',
}

# Variáveis que são seguras (literais de array, arrays conhecidos)
SAFE_VARIABLES = {
    'Array', 'Object', 'String', 'Number', 'Boolean',
    'React', 'useState', 'useEffect', 'useMemo', 'useCallback',
    'props', 'children', 'className', 'style',
}

# Imports que indicam que o arquivo já usa funções seguras
SAFE_IMPORTS = [
    'safeMap', 'safeFilter', 'safeFind', 'safeReduce',
    'isEmpty', 'ensureArray', 'safeForEach', 'safeSome',
    'safeEvery', 'safeFlatMap', 'safeSort'
]

def is_safe_context(line: str, var_name: str) -> bool:
    """Verifica se o uso está em um contexto seguro"""
    # Array literal
    if re.search(rf'{var_name}\s*=\s*\[', line):
        return True
    
    # Chamada de função que retorna array explicitamente
    if 'Array.from' in line or 'Array.of' in line:
        return True
    
    # Spread operator com array literal
    if re.search(rf'\[\.\.\.\s*{var_name}', line):
        return True
    
    return False

def has_safe_imports(content: str) -> bool:
    """Verifica se o arquivo já importa funções seguras"""
    for safe_import in SAFE_IMPORTS:
        if safe_import in content:
            return True
    return False

def analyze_file(file_path: Path) -> Dict:
    """Analisa um arquivo .tsx em busca de uso inseguro de métodos de array"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        issues = []
        
        # Verifica se já usa funções seguras
        already_protected = has_safe_imports(content)
        
        for line_num, line in enumerate(lines, 1):
            for method, pattern in UNSAFE_PATTERNS.items():
                matches = re.finditer(pattern, line)
                for match in matches:
                    var_name = match.group(1)
                    
                    # Pula se for variável segura
                    if var_name in SAFE_VARIABLES:
                        continue
                    
                    # Pula se estiver em contexto seguro
                    if is_safe_context(line, var_name):
                        continue
                    
                    issues.append({
                        'line': line_num,
                        'method': method,
                        'variable': var_name,
                        'code': line.strip(),
                    })
        
        return {
            'file': str(file_path.relative_to('/home/ubuntu/avd-uisa-sistema-completo')),
            'already_protected': already_protected,
            'issues_count': len(issues),
            'issues': issues,
        }
    
    except Exception as e:
        return {
            'file': str(file_path),
            'error': str(e),
        }

def main():
    """Executa auditoria em todos os arquivos .tsx"""
    base_path = Path('/home/ubuntu/avd-uisa-sistema-completo/client/src')
    
    # Encontra todos os arquivos .tsx
    tsx_files = list(base_path.rglob('*.tsx'))
    
    print(f"🔍 Auditando {len(tsx_files)} arquivos .tsx...\n")
    
    results = []
    files_with_issues = []
    files_already_protected = []
    total_issues = 0
    
    for file_path in sorted(tsx_files):
        result = analyze_file(file_path)
        results.append(result)
        
        if result.get('already_protected'):
            files_already_protected.append(result['file'])
        
        if result.get('issues_count', 0) > 0:
            files_with_issues.append(result)
            total_issues += result['issues_count']
    
    # Gera relatório
    print("=" * 80)
    print("📊 RELATÓRIO DE AUDITORIA DE COMPONENTES")
    print("=" * 80)
    print(f"\n✅ Arquivos já protegidos: {len(files_already_protected)}")
    print(f"⚠️  Arquivos com problemas: {len(files_with_issues)}")
    print(f"🔢 Total de problemas encontrados: {total_issues}")
    print(f"📁 Total de arquivos analisados: {len(tsx_files)}")
    
    if files_with_issues:
        print("\n" + "=" * 80)
        print("⚠️  ARQUIVOS QUE PRECISAM DE CORREÇÃO")
        print("=" * 80)
        
        for result in sorted(files_with_issues, key=lambda x: x['issues_count'], reverse=True):
            print(f"\n📄 {result['file']}")
            print(f"   Problemas: {result['issues_count']}")
            
            # Agrupa por método
            methods_count = {}
            for issue in result['issues']:
                method = issue['method']
                methods_count[method] = methods_count.get(method, 0) + 1
            
            for method, count in sorted(methods_count.items(), key=lambda x: x[1], reverse=True):
                print(f"   - {method}: {count} ocorrências")
    
    # Salva relatório JSON
    report_path = '/home/ubuntu/avd-uisa-sistema-completo/audit-report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump({
            'summary': {
                'total_files': len(tsx_files),
                'files_protected': len(files_already_protected),
                'files_with_issues': len(files_with_issues),
                'total_issues': total_issues,
            },
            'files_with_issues': files_with_issues,
            'files_protected': files_already_protected,
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n📝 Relatório completo salvo em: {report_path}")
    
    # Gera lista de arquivos para correção
    if files_with_issues:
        fix_list_path = '/home/ubuntu/avd-uisa-sistema-completo/files-to-fix.txt'
        with open(fix_list_path, 'w', encoding='utf-8') as f:
            for result in sorted(files_with_issues, key=lambda x: x['issues_count'], reverse=True):
                f.write(f"{result['file']}\n")
        print(f"📋 Lista de arquivos para correção salva em: {fix_list_path}")

if __name__ == '__main__':
    main()
