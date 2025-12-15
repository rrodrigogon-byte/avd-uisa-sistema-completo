/**
 * Serviço de Integrações Externas
 * Microsoft Teams, Slack e Google Meet
 */

interface TeamsNotification {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

interface SlackNotification {
  channel: string;
  message: string;
  blocks?: any[];
}

interface GoogleMeetConfig {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
}

/**
 * Enviar notificação para Microsoft Teams
 */
export async function sendTeamsNotification(
  webhookUrl: string,
  notification: TeamsNotification
): Promise<boolean> {
  try {
    const payload = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: notification.title,
      themeColor: "F39200",
      title: notification.title,
      text: notification.message,
      potentialAction: notification.actionUrl
        ? [
            {
              "@type": "OpenUri",
              name: notification.actionText || "Ver Detalhes",
              targets: [
                {
                  os: "default",
                  uri: notification.actionUrl,
                },
              ],
            },
          ]
        : undefined,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("[Teams] Erro ao enviar notificação:", error);
    return false;
  }
}

/**
 * Enviar notificação para Slack
 */
export async function sendSlackNotification(
  webhookUrl: string,
  notification: SlackNotification
): Promise<boolean> {
  try {
    const payload = {
      channel: notification.channel,
      text: notification.message,
      blocks: notification.blocks || [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: notification.message,
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("[Slack] Erro ao enviar notificação:", error);
    return false;
  }
}

/**
 * Criar reunião no Google Meet
 * Requer autenticação OAuth2 do Google
 */
export async function createGoogleMeetMeeting(
  accessToken: string,
  config: GoogleMeetConfig
): Promise<{ meetLink: string; eventId: string } | null> {
  try {
    const event = {
      summary: config.summary,
      description: config.description,
      start: {
        dateTime: config.startTime.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: config.endTime.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      attendees: config.attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      console.error("[Google Meet] Erro na resposta:", await response.text());
      return null;
    }

    const data = await response.json();
    const meetLink = data.conferenceData?.entryPoints?.find(
      (ep: any) => ep.entryPointType === "video"
    )?.uri;

    return {
      meetLink: meetLink || data.hangoutLink,
      eventId: data.id,
    };
  } catch (error) {
    console.error("[Google Meet] Erro ao criar reunião:", error);
    return null;
  }
}

/**
 * Notificar aprovação de meta via Teams
 */
export async function notifyGoalApprovalTeams(
  webhookUrl: string,
  employeeName: string,
  goalTitle: string,
  approver: string
): Promise<boolean> {
  return sendTeamsNotification(webhookUrl, {
    title: "✅ Meta Aprovada",
    message: `A meta "${goalTitle}" de ${employeeName} foi aprovada por ${approver}.`,
    actionUrl: process.env.VITE_APP_URL + "/metas",
    actionText: "Ver Metas",
  });
}

/**
 * Notificar calibração pendente via Slack
 */
export async function notifyCalibrationPendingSlack(
  webhookUrl: string,
  channel: string,
  employeeName: string,
  approverName: string
): Promise<boolean> {
  return sendSlackNotification(webhookUrl, {
    channel,
    message: `🔔 *Calibração Pendente*\n\nA movimentação de *${employeeName}* está aguardando aprovação de *${approverName}*.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🔔 *Calibração Pendente*\n\nA movimentação de *${employeeName}* está aguardando aprovação de *${approverName}*.`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Ver Aprovações",
            },
            url: process.env.VITE_APP_URL + "/executivo/aprovacoes",
            style: "primary",
          },
        ],
      },
    ],
  });
}

/**
 * Agendar reunião de feedback via Google Meet
 */
export async function scheduleFeedbackMeeting(
  accessToken: string,
  managerEmail: string,
  employeeEmail: string,
  employeeName: string,
  date: Date
): Promise<{ meetLink: string; eventId: string } | null> {
  const endDate = new Date(date);
  endDate.setHours(endDate.getHours() + 1);

  return createGoogleMeetMeeting(accessToken, {
    summary: `Reunião de Feedback - ${employeeName}`,
    description: `Reunião de feedback e acompanhamento de desempenho.`,
    startTime: date,
    endTime: endDate,
    attendees: [managerEmail, employeeEmail],
  });
}
