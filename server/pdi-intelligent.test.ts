import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import { getDb } from "../server/db";

describe("PDI Inteligente - Geração de Sugestões com IA", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it("deve ter acesso ao banco de dados", () => {
    expect(db).toBeDefined();
  });

  it("deve ter o router de PDI inteligente configurado", () => {
    expect(appRouter.pdiIntelligent).toBeDefined();
  });

  it("deve ter o procedimento generateActionSuggestions", () => {
    expect(appRouter.pdiIntelligent.generateActionSuggestions).toBeDefined();
  });

  it("deve ter o procedimento create para criar PDI", () => {
    expect(appRouter.pdiIntelligent.create).toBeDefined();
  });

  it("deve ter o procedimento getById para buscar PDI", () => {
    expect(appRouter.pdiIntelligent.getById).toBeDefined();
  });

  it("deve ter o procedimento list para listar PDIs", () => {
    expect(appRouter.pdiIntelligent.list).toBeDefined();
  });

  it("deve ter o procedimento addAction para adicionar ações", () => {
    expect(appRouter.pdiIntelligent.addAction).toBeDefined();
  });

  it("deve ter o procedimento getActions para buscar ações", () => {
    expect(appRouter.pdiIntelligent.getActions).toBeDefined();
  });

  it("deve ter o procedimento updateActionStatus para atualizar status", () => {
    expect(appRouter.pdiIntelligent.updateActionStatus).toBeDefined();
  });

  it("deve ter o procedimento addGap para adicionar gaps", () => {
    expect(appRouter.pdiIntelligent.addGap).toBeDefined();
  });

  it("deve ter o procedimento updatePact para atualizar pacto", () => {
    expect(appRouter.pdiIntelligent.updatePact).toBeDefined();
  });

  it("deve ter o procedimento getMainRisks para buscar riscos", () => {
    expect(appRouter.pdiIntelligent.getMainRisks).toBeDefined();
  });

  it("deve ter o procedimento addGovernanceReview para adicionar reviews", () => {
    expect(appRouter.pdiIntelligent.addGovernanceReview).toBeDefined();
  });

  it("deve ter o procedimento getGovernanceReviews para buscar reviews", () => {
    expect(appRouter.pdiIntelligent.getGovernanceReviews).toBeDefined();
  });

  it("deve ter o procedimento getIPSEvolution para buscar evolução IPS", () => {
    expect(appRouter.pdiIntelligent.getIPSEvolution).toBeDefined();
  });

  it("deve ter o procedimento getPsychometricProfile para buscar perfil psicométrico", () => {
    expect(appRouter.pdiIntelligent.getPsychometricProfile).toBeDefined();
  });
});
