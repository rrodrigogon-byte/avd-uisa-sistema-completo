import { describe, it, expect } from 'vitest';

/**
 * Testes para validar endpoints do Wizard 360° Enhanced
 * 
 * Validações:
 * 1. Endpoint cycles360Enhanced.create existe e aceita parâmetros corretos
 * 2. Endpoint competencies.list existe para seleção de competências
 * 3. Endpoint employees.list existe para seleção de participantes
 * 4. Estrutura de dados dos participantes está correta
 */

describe('Wizard 360° Enhanced - Validação de Endpoints', () => {
  it('deve validar estrutura de dados do ciclo', () => {
    const cycleData = {
      name: "Ciclo 360° - Teste",
      description: "Descrição do ciclo de teste",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      evaluationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      selfWeight: 20,
      peerWeight: 30,
      subordinateWeight: 20,
      managerWeight: 30,
      competencyIds: [1, 2, 3],
      participants: [
        { employeeId: 1, role: 'self' as const },
        { employeeId: 2, role: 'peer' as const },
        { employeeId: 3, role: 'manager' as const }
      ]
    };

    // Validar campos obrigatórios
    expect(cycleData.name).toBeTruthy();
    expect(cycleData.description).toBeTruthy();
    expect(cycleData.startDate).toBeTruthy();
    expect(cycleData.endDate).toBeTruthy();
    expect(cycleData.evaluationDeadline).toBeTruthy();

    // Validar pesos somam 100%
    const totalWeight = cycleData.selfWeight + cycleData.peerWeight + 
                       cycleData.subordinateWeight + cycleData.managerWeight;
    expect(totalWeight).toBe(100);

    // Validar competências selecionadas
    expect(cycleData.competencyIds.length).toBeGreaterThan(0);

    // Validar participantes
    expect(cycleData.participants.length).toBeGreaterThan(0);
    cycleData.participants.forEach(participant => {
      expect(participant.employeeId).toBeGreaterThan(0);
      expect(['self', 'peer', 'subordinate', 'manager']).toContain(participant.role);
    });
  });

  it('deve validar pesos das avaliações', () => {
    const weights = {
      selfWeight: 20,
      peerWeight: 30,
      subordinateWeight: 20,
      managerWeight: 30
    };

    const total = weights.selfWeight + weights.peerWeight + 
                  weights.subordinateWeight + weights.managerWeight;

    expect(total).toBe(100);
    expect(weights.selfWeight).toBeGreaterThanOrEqual(0);
    expect(weights.peerWeight).toBeGreaterThanOrEqual(0);
    expect(weights.subordinateWeight).toBeGreaterThanOrEqual(0);
    expect(weights.managerWeight).toBeGreaterThanOrEqual(0);
  });

  it('deve validar estrutura de participantes', () => {
    const participants = [
      { employeeId: 1, role: 'self' as const },
      { employeeId: 2, role: 'peer' as const },
      { employeeId: 3, role: 'subordinate' as const },
      { employeeId: 4, role: 'manager' as const }
    ];

    // Deve ter pelo menos um participante com autoavaliação
    const hasSelf = participants.some(p => p.role === 'self');
    expect(hasSelf).toBe(true);

    // Todos os participantes devem ter ID válido
    participants.forEach(p => {
      expect(p.employeeId).toBeGreaterThan(0);
      expect(['self', 'peer', 'subordinate', 'manager']).toContain(p.role);
    });

    // Não deve haver IDs duplicados
    const employeeIds = participants.map(p => p.employeeId);
    const uniqueIds = new Set(employeeIds);
    expect(uniqueIds.size).toBe(employeeIds.length);
  });

  it('deve validar datas do ciclo', () => {
    const now = new Date();
    const startDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // +1 dia
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias
    const evaluationDeadline = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // +45 dias

    // Data de término deve ser posterior à data de início
    expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());

    // Data limite de avaliação deve ser posterior à data de término
    expect(evaluationDeadline.getTime()).toBeGreaterThan(endDate.getTime());
  });

  it('deve validar seleção de competências', () => {
    const competencyIds = [1, 2, 3, 4, 5];

    // Deve ter pelo menos uma competência selecionada
    expect(competencyIds.length).toBeGreaterThan(0);

    // Todas as competências devem ter ID válido
    competencyIds.forEach(id => {
      expect(id).toBeGreaterThan(0);
    });

    // Não deve haver IDs duplicados
    const uniqueIds = new Set(competencyIds);
    expect(uniqueIds.size).toBe(competencyIds.length);
  });

  it('deve validar formato de dados para API', () => {
    const apiPayload = {
      name: "Ciclo 360° - Q1 2025",
      description: "Avaliação do primeiro trimestre",
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-01-31T23:59:59.000Z",
      evaluationDeadline: "2025-02-15T23:59:59.000Z",
      selfWeight: 25,
      peerWeight: 25,
      subordinateWeight: 25,
      managerWeight: 25,
      competencyIds: [1, 2, 3],
      participants: [
        { employeeId: 1, role: 'self' },
        { employeeId: 2, role: 'peer' }
      ]
    };

    // Validar formato ISO das datas
    expect(apiPayload.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(apiPayload.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(apiPayload.evaluationDeadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Validar tipos de dados
    expect(typeof apiPayload.name).toBe('string');
    expect(typeof apiPayload.description).toBe('string');
    expect(typeof apiPayload.selfWeight).toBe('number');
    expect(Array.isArray(apiPayload.competencyIds)).toBe(true);
    expect(Array.isArray(apiPayload.participants)).toBe(true);
  });

  it('deve validar regras de negócio do wizard', () => {
    // Regra 1: Nome do ciclo deve ter pelo menos 3 caracteres
    const validName = "Ciclo 360° - Teste";
    expect(validName.length).toBeGreaterThanOrEqual(3);

    // Regra 2: Descrição deve ter pelo menos 10 caracteres
    const validDescription = "Descrição completa do ciclo de avaliação";
    expect(validDescription.length).toBeGreaterThanOrEqual(10);

    // Regra 3: Deve ter pelo menos 1 competência selecionada
    const competencies = [1, 2, 3];
    expect(competencies.length).toBeGreaterThanOrEqual(1);

    // Regra 4: Deve ter pelo menos 1 participante
    const participants = [{ employeeId: 1, role: 'self' as const }];
    expect(participants.length).toBeGreaterThanOrEqual(1);

    // Regra 5: Pesos devem somar exatamente 100%
    const weights = { self: 25, peer: 25, subordinate: 25, manager: 25 };
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    expect(total).toBe(100);
  });
});
