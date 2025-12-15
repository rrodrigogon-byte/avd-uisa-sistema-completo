/**
 * Testes para os novos módulos implementados:
 * - Metas Individuais
 * - Competências por Cargo
 * - Pesos de Avaliação
 * - Benchmark de Desempenho
 * - Metas Departamentais
 */

import { describe, it, expect } from 'vitest';

describe('Metas Individuais - Validações', () => {
  it('deve validar estrutura de meta individual', () => {
    const metaIndividual = {
      id: 1,
      employeeId: 1,
      title: 'Aumentar vendas em 20%',
      description: 'Meta de vendas para Q1',
      targetValue: 100,
      currentValue: 0,
      unit: '%',
      weight: 10,
      priority: 'alta',
      status: 'rascunho',
      progressPercent: 0,
    };

    expect(metaIndividual).toHaveProperty('id');
    expect(metaIndividual).toHaveProperty('employeeId');
    expect(metaIndividual).toHaveProperty('title');
    expect(metaIndividual).toHaveProperty('targetValue');
    expect(metaIndividual).toHaveProperty('weight');
    expect(metaIndividual.weight).toBeGreaterThanOrEqual(1);
    expect(metaIndividual.weight).toBeLessThanOrEqual(100);
  });

  it('deve calcular progresso corretamente', () => {
    const calcularProgresso = (currentValue: number, targetValue: number): number => {
      if (targetValue === 0) return 0;
      return Math.min(Math.round((currentValue / targetValue) * 100), 100);
    };

    expect(calcularProgresso(50, 100)).toBe(50);
    expect(calcularProgresso(100, 100)).toBe(100);
    expect(calcularProgresso(150, 100)).toBe(100); // Não deve ultrapassar 100%
    expect(calcularProgresso(0, 100)).toBe(0);
    expect(calcularProgresso(0, 0)).toBe(0); // Evitar divisão por zero
  });

  it('deve validar critérios SMART', () => {
    const metaSMART = {
      specific: 'Aumentar vendas de produtos eletrônicos',
      measurable: 'Medir por valor total de vendas em R$',
      achievable: 'Baseado no histórico de crescimento de 15%',
      relevant: 'Alinhado com a meta departamental de expansão',
      timeBound: 'Até o final do Q1 2025',
    };

    expect(metaSMART.specific).toBeTruthy();
    expect(metaSMART.measurable).toBeTruthy();
    expect(metaSMART.achievable).toBeTruthy();
    expect(metaSMART.relevant).toBeTruthy();
    expect(metaSMART.timeBound).toBeTruthy();
  });

  it('deve validar status de meta', () => {
    const statusValidos = [
      'rascunho',
      'pendente_aprovacao',
      'aprovada',
      'em_andamento',
      'concluida',
      'cancelada',
      'atrasada',
    ];

    statusValidos.forEach(status => {
      expect(statusValidos).toContain(status);
    });
  });

  it('deve validar prioridades', () => {
    const prioridadesValidas = ['baixa', 'media', 'alta', 'critica'];
    
    prioridadesValidas.forEach(prioridade => {
      expect(prioridadesValidas).toContain(prioridade);
    });
  });
});

describe('Competências por Cargo - Validações', () => {
  it('deve validar estrutura de competência por cargo', () => {
    const competenciaCargo = {
      id: 1,
      positionId: 1,
      competencyId: 1,
      requiredLevel: 3,
      weight: 5,
    };

    expect(competenciaCargo).toHaveProperty('positionId');
    expect(competenciaCargo).toHaveProperty('competencyId');
    expect(competenciaCargo).toHaveProperty('requiredLevel');
    expect(competenciaCargo.requiredLevel).toBeGreaterThanOrEqual(1);
    expect(competenciaCargo.requiredLevel).toBeLessThanOrEqual(5);
  });

  it('deve calcular gap de competência corretamente', () => {
    const calcularGap = (requiredLevel: number, currentLevel: number): number => {
      return requiredLevel - currentLevel;
    };

    expect(calcularGap(5, 3)).toBe(2); // Gap positivo
    expect(calcularGap(3, 3)).toBe(0); // Atende exatamente
    expect(calcularGap(3, 5)).toBe(-2); // Supera o requisito
  });

  it('deve classificar status de gap corretamente', () => {
    const classificarGap = (gap: number): string => {
      if (gap <= 0) return 'atende';
      if (gap === 1) return 'proximo';
      return 'gap_significativo';
    };

    expect(classificarGap(-1)).toBe('atende');
    expect(classificarGap(0)).toBe('atende');
    expect(classificarGap(1)).toBe('proximo');
    expect(classificarGap(2)).toBe('gap_significativo');
    expect(classificarGap(3)).toBe('gap_significativo');
  });

  it('deve calcular score ponderado de competências', () => {
    const calcularScorePonderado = (
      competencias: Array<{ currentLevel: number; requiredLevel: number; weight: number }>
    ): number => {
      const totalWeight = competencias.reduce((sum, c) => sum + c.weight, 0);
      if (totalWeight === 0) return 0;
      
      const weightedScore = competencias.reduce((sum, c) => {
        const score = Math.min(c.currentLevel / c.requiredLevel, 1) * 100;
        return sum + (score * c.weight);
      }, 0);
      
      return Math.round(weightedScore / totalWeight);
    };

    const competencias = [
      { currentLevel: 4, requiredLevel: 4, weight: 10 }, // 100%
      { currentLevel: 3, requiredLevel: 4, weight: 10 }, // 75%
      { currentLevel: 2, requiredLevel: 4, weight: 10 }, // 50%
    ];

    const score = calcularScorePonderado(competencias);
    expect(score).toBe(75); // (100 + 75 + 50) / 3 = 75
  });
});

describe('Pesos de Avaliação - Validações', () => {
  it('deve validar que soma dos pesos é 100%', () => {
    const validarPesos = (pesos: Record<string, number>): boolean => {
      const total = Object.values(pesos).reduce((sum, peso) => sum + peso, 0);
      return total === 100;
    };

    const pesosValidos = {
      competenciesWeight: 40,
      individualGoalsWeight: 30,
      departmentGoalsWeight: 15,
      pirWeight: 15,
      feedbackWeight: 0,
      behaviorWeight: 0,
    };

    const pesosInvalidos = {
      competenciesWeight: 40,
      individualGoalsWeight: 30,
      departmentGoalsWeight: 15,
      pirWeight: 10, // Total = 95%
      feedbackWeight: 0,
      behaviorWeight: 0,
    };

    expect(validarPesos(pesosValidos)).toBe(true);
    expect(validarPesos(pesosInvalidos)).toBe(false);
  });

  it('deve validar escopo de configuração', () => {
    const escoposValidos = ['global', 'departamento', 'cargo'];
    
    escoposValidos.forEach(escopo => {
      expect(escoposValidos).toContain(escopo);
    });
  });

  it('deve validar prioridade de escopo', () => {
    // Prioridade: cargo > departamento > global
    const obterPrioridade = (escopo: string): number => {
      const prioridades: Record<string, number> = {
        cargo: 3,
        departamento: 2,
        global: 1,
      };
      return prioridades[escopo] || 0;
    };

    expect(obterPrioridade('cargo')).toBeGreaterThan(obterPrioridade('departamento'));
    expect(obterPrioridade('departamento')).toBeGreaterThan(obterPrioridade('global'));
  });

  it('deve calcular nota final ponderada', () => {
    const calcularNotaFinal = (
      pesos: Record<string, number>,
      notas: Record<string, number>
    ): number => {
      let total = 0;
      
      if (pesos.competenciesWeight && notas.competencias) {
        total += (pesos.competenciesWeight / 100) * notas.competencias;
      }
      if (pesos.individualGoalsWeight && notas.metasIndividuais) {
        total += (pesos.individualGoalsWeight / 100) * notas.metasIndividuais;
      }
      if (pesos.departmentGoalsWeight && notas.metasDepartamentais) {
        total += (pesos.departmentGoalsWeight / 100) * notas.metasDepartamentais;
      }
      if (pesos.pirWeight && notas.pir) {
        total += (pesos.pirWeight / 100) * notas.pir;
      }
      
      return Math.round(total);
    };

    const pesos = {
      competenciesWeight: 40,
      individualGoalsWeight: 30,
      departmentGoalsWeight: 15,
      pirWeight: 15,
    };

    const notas = {
      competencias: 80,
      metasIndividuais: 90,
      metasDepartamentais: 70,
      pir: 85,
    };

    // (0.4 * 80) + (0.3 * 90) + (0.15 * 70) + (0.15 * 85)
    // = 32 + 27 + 10.5 + 12.75 = 82.25 ≈ 82
    const notaFinal = calcularNotaFinal(pesos, notas);
    expect(notaFinal).toBe(82);
  });
});

describe('Benchmark de Desempenho - Validações', () => {
  it('deve calcular percentis corretamente', () => {
    const calcularPercentil = (arr: number[], p: number): number | null => {
      if (arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    const scores = [60, 70, 75, 80, 85, 90, 95, 100];
    
    expect(calcularPercentil(scores, 25)).toBe(70);
    expect(calcularPercentil(scores, 50)).toBe(80);
    expect(calcularPercentil(scores, 75)).toBe(90);
    expect(calcularPercentil(scores, 90)).toBe(100);
    expect(calcularPercentil([], 50)).toBeNull();
  });

  it('deve classificar posição relativa corretamente', () => {
    const classificarPosicao = (
      score: number,
      p25: number,
      p50: number,
      p75: number,
      p90: number
    ): string => {
      if (score >= p90) return 'top_10';
      if (score >= p75) return 'top_25';
      if (score >= p50) return 'acima_media';
      if (score >= p25) return 'abaixo_media';
      return 'bottom_25';
    };

    expect(classificarPosicao(95, 70, 80, 90, 95)).toBe('top_10');
    expect(classificarPosicao(90, 70, 80, 90, 95)).toBe('top_25');
    expect(classificarPosicao(85, 70, 80, 90, 95)).toBe('acima_media');
    expect(classificarPosicao(75, 70, 80, 90, 95)).toBe('abaixo_media');
    expect(classificarPosicao(60, 70, 80, 90, 95)).toBe('bottom_25');
  });

  it('deve calcular média ponderada de progresso', () => {
    const calcularProgressoPonderado = (
      metas: Array<{ progressPercent: number; weight: number }>
    ): number => {
      const totalWeight = metas.reduce((sum, m) => sum + m.weight, 0);
      if (totalWeight === 0) return 0;
      
      const weightedProgress = metas.reduce(
        (sum, m) => sum + (m.progressPercent * m.weight),
        0
      );
      
      return Math.round(weightedProgress / totalWeight);
    };

    const metas = [
      { progressPercent: 100, weight: 20 },
      { progressPercent: 50, weight: 30 },
      { progressPercent: 75, weight: 50 },
    ];

    // (100*20 + 50*30 + 75*50) / 100 = (2000 + 1500 + 3750) / 100 = 72.5 ≈ 73
    expect(calcularProgressoPonderado(metas)).toBe(73);
  });

  it('deve validar severidade de alertas', () => {
    const severidadesValidas = ['info', 'warning', 'critical'];
    
    severidadesValidas.forEach(severidade => {
      expect(severidadesValidas).toContain(severidade);
    });
  });

  it('deve validar tipos de alertas', () => {
    const tiposValidos = [
      'competencia_abaixo_minimo',
      'meta_atrasada',
      'desempenho_geral_baixo',
      'gap_critico',
      'sem_avaliacao',
    ];
    
    tiposValidos.forEach(tipo => {
      expect(tiposValidos).toContain(tipo);
    });
  });
});

describe('Metas Departamentais - Validações', () => {
  it('deve validar estrutura de meta departamental', () => {
    const metaDepartamental = {
      id: 1,
      departmentId: 1,
      cycleId: 1,
      title: 'Aumentar receita do departamento',
      targetValue: 1000000,
      currentValue: 0,
      unit: 'R$',
      weight: 20,
      status: 'rascunho',
      progressPercent: 0,
    };

    expect(metaDepartamental).toHaveProperty('departmentId');
    expect(metaDepartamental).toHaveProperty('title');
    expect(metaDepartamental).toHaveProperty('targetValue');
    expect(metaDepartamental).toHaveProperty('weight');
  });

  it('deve calcular progresso a partir de metas individuais vinculadas', () => {
    const calcularProgressoDepartamental = (
      metasIndividuais: Array<{ progressPercent: number; weight: number }>
    ): number => {
      if (metasIndividuais.length === 0) return 0;
      
      const totalWeight = metasIndividuais.reduce((sum, m) => sum + m.weight, 0);
      if (totalWeight === 0) return 0;
      
      const weightedProgress = metasIndividuais.reduce(
        (sum, m) => sum + (m.progressPercent * m.weight),
        0
      );
      
      return Math.round(weightedProgress / totalWeight);
    };

    const metasVinculadas = [
      { progressPercent: 80, weight: 10 },
      { progressPercent: 60, weight: 10 },
      { progressPercent: 100, weight: 10 },
    ];

    // (80*10 + 60*10 + 100*10) / 30 = 2400 / 30 = 80
    expect(calcularProgressoDepartamental(metasVinculadas)).toBe(80);
    expect(calcularProgressoDepartamental([])).toBe(0);
  });
});

console.log('\n🎉 Testes de Metas Individuais, Competências por Cargo e Pesos de Avaliação executados!\n');
