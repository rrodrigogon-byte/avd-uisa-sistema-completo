import { getDb } from "../db";
import { badges, employeeBadges, employees, notifications } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { emailService } from "./emailService";

/**
 * Helper centralizado para conceder badges
 * Verifica se o colaborador já possui o badge, concede se não tiver,
 * cria notificação in-app e envia e-mail
 */
export async function grantBadgeIfEligible(employeeId: number, badgeCode: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[BadgeHelper] Database not available");
    return false;
  }

  try {
    // Buscar badge pelo código
    const badgeResult = await db
      .select()
      .from(badges)
      .where(and(eq(badges.code, badgeCode), eq(badges.isActive, true)))
      .limit(1);

    if (badgeResult.length === 0) {
      console.warn(`[BadgeHelper] Badge com código "${badgeCode}" não encontrado ou inativo`);
      return false;
    }

    const badge = badgeResult[0];

    // Verificar se colaborador já possui este badge
    const existingBadge = await db
      .select()
      .from(employeeBadges)
      .where(and(eq(employeeBadges.employeeId, employeeId), eq(employeeBadges.badgeId, badge.id)))
      .limit(1);

    if (existingBadge.length > 0) {
      console.log(`[BadgeHelper] Colaborador ${employeeId} já possui o badge "${badge.name}"`);
      return false; // Já possui o badge
    }

    // Buscar informações do colaborador
    const employeeResult = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employeeResult.length === 0) {
      console.warn(`[BadgeHelper] Colaborador ${employeeId} não encontrado`);
      return false;
    }

    const employee = employeeResult[0];

    // Conceder badge
    const [newBadge] = await db.insert(employeeBadges).values({
      employeeId,
      badgeId: badge.id,
      earnedAt: new Date(),
      notified: false,
    });

    console.log(`[BadgeHelper] ✅ Badge "${badge.name}" concedido ao colaborador ${employee.name}`);

    // Criar notificação in-app
    await db.insert(notifications).values({
      userId: employee.userId || 0,
      type: "badge_earned",
      title: `🏆 Novo Badge Conquistado!`,
      message: `Parabéns! Você conquistou o badge "${badge.name}": ${badge.description}`,
      read: false,
    });

    console.log(`[BadgeHelper] 📬 Notificação in-app criada para ${employee.name}`);

    // Enviar e-mail se colaborador tiver e-mail
    if (employee.email) {
      const emailSent = await emailService.sendBadgeNotification(employee.email, {
        employeeName: employee.name,
        badgeName: badge.name,
        badgeDescription: badge.description || "Conquista desbloqueada!",
        badgeIcon: badge.icon || "🏆",
      });

      if (emailSent) {
        console.log(`[BadgeHelper] 📧 E-mail de badge enviado para ${employee.email}`);
        
        // Marcar como notificado
        await db
          .update(employeeBadges)
          .set({ notified: true })
          .where(eq(employeeBadges.id, newBadge.insertId));
      }
    }

    return true;
  } catch (error) {
    console.error("[BadgeHelper] Erro ao conceder badge:", error);
    return false;
  }
}

/**
 * Verificar e conceder múltiplos badges de uma vez
 */
export async function checkAndGrantBadges(employeeId: number, badgeCodes: string[]): Promise<number> {
  let grantedCount = 0;

  for (const code of badgeCodes) {
    const granted = await grantBadgeIfEligible(employeeId, code);
    if (granted) grantedCount++;
  }

  return grantedCount;
}
