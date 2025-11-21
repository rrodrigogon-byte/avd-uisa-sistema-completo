import { getDb } from "../db";
import { badges, employeeBadges, employees, goals, pdiPlans, performanceEvaluations, feedbacks, psychometricTests, nineBoxPositions, notifications } from "../../drizzle/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { grantBadgeIfEligible } from "../utils/badgeHelper";

/**
 * Serviço de verificação e concessão automática de badges
 * Usa badgeHelper para enviar notificações in-app E e-mails automáticos
 */

// Verificar e conceder badge se condições forem atendidas
async function checkAndAwardBadge(employeeId: number, badgeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verificar se já possui o badge
  const existing = await db
    .select()
    .from(employeeBadges)
    .where(and(eq(employeeBadges.employeeId, employeeId), eq(employeeBadges.badgeId, badgeId)))
    .limit(1);

  if (existing.length > 0) return false; // Já possui

  // Conceder badge usando badgeHelper (envia notificação + e-mail)
  // Nota: badgeHelper usa badgeCode, mas aqui temos badgeId
  // Por enquanto, manter lógica original até refatorar badges para usar codes
  const db2 = await getDb();
  if (!db2) return false;
  
  await db2.insert(employeeBadges).values({
    employeeId,
    badgeId,
    earnedAt: new Date(),
    notified: false,
  });

  // Criar notificação e enviar e-mail
  const badge = await db2.select().from(badges).where(eq(badges.id, badgeId)).limit(1);
  if (badge[0]) {
    const employee = await db2.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    if (employee[0] && employee[0].userId) {
      // Criar notificação in-app
      await db2.insert(notifications).values({
        userId: employee[0].userId,
        type: "badge_earned",
        title: "🏆 Novo Badge Conquistado!",
        message: `Parabéns! Você conquistou o badge "${badge[0].name}" (+${badge[0].points} pontos)`,
        link: "/badges",
        read: false,
      });

      // Enviar e-mail se tiver e-mail cadastrado
      if (employee[0].email) {
        try {
          const { emailService } = await import("../utils/emailService");
          await emailService.sendBadgeNotification(
            employee[0].email,
            {
              employeeName: employee[0].name || "Colaborador",
              badgeName: badge[0].name,
              badgeDescription: badge[0].description || "Parabéns pela conquista!",
            }
          );
        } catch (error) {
          console.error("[BadgeService] Erro ao enviar e-mail de badge:", error);
        }
      }
    }
  }

  return true;
}

// Verificar badges relacionados a metas
export async function checkGoalBadges(employeeId: number) {
  const db = await getDb();
  if (!db) return;

  // Contar metas 100% concluídas
  const completedGoals = await db
    .select({ count: count() })
    .from(goals)
    .where(and(eq(goals.employeeId, employeeId), eq(goals.progress, 100)));

  const completedCount = completedGoals[0]?.count || 0;

  // Badge: Primeira Meta Concluída (ID 1)
  if (completedCount >= 1) {
    await checkAndAwardBadge(employeeId, 1);
  }

  // Badge: Mestre das Metas (ID 2)
  if (completedCount >= 10) {
    await checkAndAwardBadge(employeeId, 2);
  }
}

// Verificar badges relacionados a PDI
export async function checkPDIBadges(employeeId: number) {
  const db = await getDb();
  if (!db) return;

  // Contar PDIs criados
  const createdPDIs = await db
    .select({ count: count() })
    .from(pdiPlans)
    .where(eq(pdiPlans.employeeId, employeeId));

  const createdCount = createdPDIs[0]?.count || 0;

  // Badge: PDI Iniciado (ID 3)
  if (createdCount >= 1) {
    await checkAndAwardBadge(employeeId, 3);
  }

  // Contar PDIs concluídos
  const completedPDIs = await db
    .select({ count: count() })
    .from(pdiPlans)
    .where(and(eq(pdiPlans.employeeId, employeeId), eq(pdiPlans.status, "concluido")));

  const completedCount = completedPDIs[0]?.count || 0;

  // Badge: PDI Concluído (ID 4)
  if (completedCount >= 1) {
    await checkAndAwardBadge(employeeId, 4);
  }
}

// Verificar badges relacionados a avaliações
export async function checkEvaluationBadges(employeeId: number) {
  const db = await getDb();
  if (!db) return;

  // Verificar avaliações 360° completas
  const evaluations360 = await db
    .select({ count: count() })
    .from(performanceEvaluations)
    .where(and(eq(performanceEvaluations.employeeId, employeeId), eq(performanceEvaluations.type, "360")));

  const eval360Count = evaluations360[0]?.count || 0;

  // Badge: Avaliação 360° Completa (ID 5)
  if (eval360Count >= 1) {
    await checkAndAwardBadge(employeeId, 5);
  }

  // Verificar avaliações de performance com nota alta
  const highPerformance = await db
    .select()
    .from(performanceEvaluations)
    .where(eq(performanceEvaluations.employeeId, employeeId))
    .orderBy(sql`${performanceEvaluations.finalScore} DESC`)
    .limit(1);

  if (highPerformance[0] && highPerformance[0].finalScore && highPerformance[0].finalScore >= 4.5) {
    // Badge: Estrela em Ascensão (ID 8)
    await checkAndAwardBadge(employeeId, 8);
  }
}

// Verificar badges relacionados a feedbacks
export async function checkFeedbackBadges(employeeId: number) {
  const db = await getDb();
  if (!db) return;

  // Contar feedbacks recebidos
  const receivedFeedbacks = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(eq(feedbacks.employeeId, employeeId));

  const receivedCount = receivedFeedbacks[0]?.count || 0;

  // Badge: Feedback Ativo (ID 6)
  if (receivedCount >= 5) {
    await checkAndAwardBadge(employeeId, 6);
  }

  // Contar feedbacks dados (como gestor)
  const givenFeedbacks = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(eq(feedbacks.managerId, employeeId));

  const givenCount = givenFeedbacks[0]?.count || 0;

  // Badge: Mentor (ID 7)
  if (givenCount >= 10) {
    await checkAndAwardBadge(employeeId, 7);
  }
}

// Verificar badges relacionados a Nine Box
export async function checkNineBoxBadges(employeeId: number) {
  const db = await getDb();
  if (!db) return;

  // Verificar posição no Nine Box
  const nineBoxPos = await db
    .select()
    .from(nineBoxPositions)
    .where(eq(nineBoxPositions.employeeId, employeeId))
    .orderBy(sql`${nineBoxPositions.createdAt} DESC`)
    .limit(1);

  if (nineBoxPos[0]) {
    const box = nineBoxPos[0].box;
    // Badge: Nine Box - Alto Potencial (ID 9)
    // Verificar se está em quadrantes de alto potencial
    if (box && (box.includes("alto_potencial") || box.includes("estrela") || box.includes("futuro_lider"))) {
      await checkAndAwardBadge(employeeId, 9);
    }
  }
}

// Verificar badges relacionados a testes psicométricos
export async function checkPsychometricBadges(employeeId: number) {
  const db = await getDb();
  if (!db) return;

  // Contar testes psicométricos completados (tipos únicos)
  const completedTests = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${psychometricTests.testType})` })
    .from(psychometricTests)
    .where(eq(psychometricTests.employeeId, employeeId));

  const testCount = completedTests[0]?.count || 0;

  // Badge: Explorador do Conhecimento (ID 10)
  if (testCount >= 5) {
    await checkAndAwardBadge(employeeId, 10);
  }
}

// Verificar todos os badges de um colaborador
export async function checkAllBadges(employeeId: number) {
  await checkGoalBadges(employeeId);
  await checkPDIBadges(employeeId);
  await checkEvaluationBadges(employeeId);
  await checkFeedbackBadges(employeeId);
  await checkNineBoxBadges(employeeId);
  await checkPsychometricBadges(employeeId);
}
