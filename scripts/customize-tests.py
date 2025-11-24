#!/usr/bin/env python3
"""
Script para personalizar os arquivos de testes psicométricos
Substitui informações específicas de cada teste
"""

import os
import re

# Definir configurações de cada teste
tests_config = {
    "BigFive": {
        "testType": "bigfive",
        "testName": "Teste Big Five",
        "questionCount": "50 perguntas",
        "profileName": "Perfil Big Five",
        "dimensions": [
            ("Dominância (D)", "Abertura (O)", "D", "O"),
            ("Influência (I)", "Conscienciosidade (C)", "I", "C"),
            ("Estabilidade (S)", "Extroversão (E)", "S", "E"),
            ("Conformidade (C)", "Amabilidade (A)", "C", "A"),
        ],
        "extra_dimension": ("", "Neuroticismo (N)", "", "N"),
    },
    "MBTI": {
        "testType": "mbti",
        "testName": "Teste MBTI",
        "questionCount": "60 perguntas",
        "profileName": "Perfil MBTI",
        "dimensions": [],  # MBTI usa resultado textual, não scores
    },
    "IE": {
        "testType": "ie",
        "testName": "Teste de Inteligência Emocional",
        "questionCount": "25 perguntas",
        "profileName": "Perfil de Inteligência Emocional",
        "dimensions": [],
    },
    "VARK": {
        "testType": "vark",
        "testName": "Teste VARK",
        "questionCount": "20 perguntas",
        "profileName": "Perfil VARK",
        "dimensions": [],
    },
}

base_dir = "/home/ubuntu/avd-uisa-sistema-completo/client/src/pages"

for test_name, config in tests_config.items():
    file_path = os.path.join(base_dir, f"Test{test_name}.tsx")
    
    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Substituições básicas
    content = content.replace("TestDISC", f"Test{test_name}")
    content = content.replace('"disc"', f'"{config["testType"]}"')
    content = content.replace("Teste DISC", config["testName"])
    content = content.replace("40 perguntas", config["questionCount"])
    content = content.replace("Perfil DISC", config["profileName"])
    
    # Para Big Five, adicionar a quinta dimensão
    if test_name == "BigFive":
        # Substituir as 4 dimensões
        for old_dim, new_dim, old_key, new_key in config["dimensions"]:
            content = content.replace(old_dim, new_dim)
            content = content.replace(f"result.profile.{old_key}", f"result.profile.{new_key}")
        
        # Adicionar quinta dimensão (Neuroticismo)
        # Encontrar o último </div> antes do fechamento do grid e adicionar a quinta dimensão
        grid_pattern = r'(</div>\s*</div>\s*{result\.profile\.dominantProfile)'
        replacement = '''</div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-muted-foreground">Neuroticismo (N)</div>
                  <div className="text-2xl font-bold text-orange-600">{result.profile.N?.toFixed(1) || '0.0'}</div>
                </div>
              </div>
              {result.profile.dominantProfile'''
        content = re.sub(grid_pattern, replacement, content)
        
        # Remover a seção de perfil dominante para Big Five
        content = re.sub(
            r'\s*{result\.profile\.dominantProfile && \(\s*<div className="mt-4 p-3 bg-white rounded border">.*?</div>\s*\)}',
            '',
            content,
            flags=re.DOTALL
        )
    
    # Para MBTI, IE e VARK, simplificar exibição de resultados
    if test_name in ["MBTI", "IE", "VARK"]:
        # Substituir a seção de perfil com uma mensagem genérica
        profile_section = '''<h3 className="font-semibold text-lg mb-2">{config["profileName"]}</h3>
              <div className="text-center py-8">
                <p className="text-lg text-muted-foreground">
                  Seus resultados foram calculados e salvos com sucesso!
                </p>
              </div>'''
        
        content = re.sub(
            r'<h3 className="font-semibold text-lg mb-2">.*?</div>\s*{result\.profile\.dominantProfile.*?}\s*}',
            profile_section.replace('{config["profileName"]}', config["profileName"]),
            content,
            flags=re.DOTALL
        )
    
    # Salvar arquivo atualizado
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ {test_name} personalizado com sucesso!")

print("\n🎉 Todos os testes foram personalizados!")
