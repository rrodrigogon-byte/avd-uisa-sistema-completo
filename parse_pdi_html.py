#!/usr/bin/env python3
"""
Script para extrair dados estruturados de arquivos HTML de PDI (Plano de Desenvolvimento Individual)
"""

import json
import re
from bs4 import BeautifulSoup
from pathlib import Path


def parse_pdi_html(html_path):
    """
    Extrai dados estruturados de um arquivo HTML de PDI
    """
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extrair informações básicas
    title_tag = soup.find('title')
    title = title_tag.text if title_tag else ""
    
    # Extrair nome do colaborador
    nome_match = re.search(r'Plano de Performance e Desenvolvimento - (.+?) \|', title)
    nome = nome_match.group(1).strip() if nome_match else ""
    
    # Extrair cargo
    cargo_elem = soup.find('p', class_='text-md text-uisa-orange font-semibold')
    cargo = cargo_elem.text.strip() if cargo_elem else ""
    
    # Extrair foco do desenvolvimento
    foco_elem = soup.find('p', string=re.compile(r'Foco do Desenvolvimento:'))
    foco = ""
    if foco_elem:
        foco_text = foco_elem.text
        foco_match = re.search(r'Foco do Desenvolvimento:\s*(.+)', foco_text)
        if foco_match:
            foco = foco_match.group(1).strip()
    
    # Extrair diretor sponsor
    sponsor_elem = soup.find('p', string=re.compile(r'Diretor Sponsor:'))
    sponsor = ""
    if sponsor_elem:
        sponsor_text = sponsor_elem.text
        sponsor_match = re.search(r'Diretor Sponsor:\s*(.+)', sponsor_text)
        if sponsor_match:
            sponsor = sponsor_match.group(1).strip()
    
    # Extrair KPIs
    kpi_cards = soup.find_all('div', class_='kpi-card')
    kpis = {}
    for card in kpi_cards:
        label_elem = card.find('p', class_='text-sm')
        value_elem = card.find('p', class_=re.compile(r'text-lg|text-xl'))
        if label_elem and value_elem:
            label = label_elem.text.strip()
            value = value_elem.text.strip()
            kpis[label] = value
    
    # Extrair gaps prioritários
    gaps_section = soup.find('p', string=re.compile(r'Gaps Prioritários a Desenvolver:'))
    gaps = []
    if gaps_section:
        gaps_list = gaps_section.find_next('ul')
        if gaps_list:
            for li in gaps_list.find_all('li'):
                gap_text = li.text.strip()
                # Separar título e descrição
                gap_match = re.match(r'(.+?):\s*(.+)', gap_text)
                if gap_match:
                    gaps.append({
                        'titulo': gap_match.group(1).strip(),
                        'descricao': gap_match.group(2).strip()
                    })
                else:
                    gaps.append({
                        'titulo': gap_text[:50] + '...' if len(gap_text) > 50 else gap_text,
                        'descricao': gap_text
                    })
    
    # Extrair plano de ação (70-20-10)
    plano_acao = {
        '70_pratica': [],
        '20_social': [],
        '10_formal': []
    }
    
    # 70% - Prática
    pratica_section = soup.find('p', string=re.compile(r'70% - Aprendizado na Prática'))
    if pratica_section:
        pratica_list = pratica_section.find_next('ul')
        if pratica_list:
            plano_acao['70_pratica'] = [li.text.strip() for li in pratica_list.find_all('li')]
    
    # 20% - Social
    social_section = soup.find('p', string=re.compile(r'20% - Aprendizado com Outros'))
    if social_section:
        social_list = social_section.find_next('ul')
        if social_list:
            plano_acao['20_social'] = [li.text.strip() for li in social_list.find_all('li')]
    
    # 10% - Formal
    formal_section = soup.find('p', string=re.compile(r'10% - Aprendizado Formal'))
    if formal_section:
        formal_list = formal_section.find_next('ul')
        if formal_list:
            plano_acao['10_formal'] = [li.text.strip() for li in formal_list.find_all('li')]
    
    # Extrair estratégia de remuneração
    remuneracao = {}
    rem_table = soup.find('table')
    if rem_table:
        tbody = rem_table.find('tbody')
        if tbody:
            row = tbody.find('tr')
            if row:
                cells = row.find_all('td')
                if len(cells) >= 4:
                    remuneracao = {
                        'movimento': cells[0].text.strip(),
                        'mecanismo': cells[1].text.strip(),
                        'novo_salario': cells[2].text.strip(),
                        'justificativa': cells[3].text.strip()
                    }
    
    # Extrair responsabilidades
    responsabilidades = {
        'colaborador': [],
        'lideranca': [],
        'dho': []
    }
    
    # Responsabilidades do colaborador
    colab_section = soup.find('p', string=re.compile(r'Responsabilidades de .+ \(O Protagonista\)'))
    if colab_section:
        colab_list = colab_section.find_next('ul')
        if colab_list:
            responsabilidades['colaborador'] = [li.text.strip() for li in colab_list.find_all('li')]
    
    # Responsabilidades da liderança
    lid_section = soup.find('p', string=re.compile(r'Responsabilidades da Liderança'))
    if lid_section:
        lid_list = lid_section.find_next('ul')
        if lid_list:
            responsabilidades['lideranca'] = [li.text.strip() for li in lid_list.find_all('li')]
    
    # Responsabilidades do DHO
    dho_section = soup.find('p', string=re.compile(r'Responsabilidades do DHO'))
    if dho_section:
        dho_list = dho_section.find_next('ul')
        if dho_list:
            responsabilidades['dho'] = [li.text.strip() for li in dho_list.find_all('li')]
    
    # Montar estrutura de dados
    pdi_data = {
        'nome': nome,
        'cargo': cargo,
        'foco_desenvolvimento': foco,
        'diretor_sponsor': sponsor,
        'kpis': kpis,
        'gaps_prioritarios': gaps,
        'plano_acao': plano_acao,
        'estrategia_remuneracao': remuneracao,
        'responsabilidades': responsabilidades,
        'html_original': str(html_path)
    }
    
    return pdi_data


if __name__ == '__main__':
    # Processar os dois arquivos
    files = [
        'PDI_Wilson3.html',
        'PDI_Fernando9.html'
    ]
    
    results = []
    for filename in files:
        filepath = Path(__file__).parent / filename
        if filepath.exists():
            print(f"Processando {filename}...")
            data = parse_pdi_html(filepath)
            results.append(data)
            print(f"✓ {data['nome']} - {data['cargo']}")
        else:
            print(f"✗ Arquivo não encontrado: {filename}")
    
    # Salvar resultados em JSON
    output_path = Path(__file__).parent / 'pdi_data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Dados extraídos salvos em: {output_path}")
    print(f"Total de PDIs processados: {len(results)}")
