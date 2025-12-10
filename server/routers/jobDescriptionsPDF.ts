import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { jobDescriptions, jobResponsibilities, jobKnowledge, jobCompetencies, jobDescriptionApprovals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import htmlPdf from "html-pdf-node";

export const jobDescriptionsPDFRouter = router({
  exportPDF: protectedProcedure
    .input(z.object({ jobDescriptionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar descrição completa
      const [jobDesc] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.id, input.jobDescriptionId));
      if (!jobDesc) throw new TRPCError({ code: "NOT_FOUND", message: "Job description not found" });

      // Buscar todas as relações
      const responsibilities = await db.select().from(jobResponsibilities).where(eq(jobResponsibilities.jobDescriptionId, input.jobDescriptionId));
      const knowledge = await db.select().from(jobKnowledge).where(eq(jobKnowledge.jobDescriptionId, input.jobDescriptionId));
      const competencies = await db.select().from(jobCompetencies).where(eq(jobCompetencies.jobDescriptionId, input.jobDescriptionId));
      const approvals = await db.select().from(jobDescriptionApprovals).where(eq(jobDescriptionApprovals.jobDescriptionId, input.jobDescriptionId));

      // Gerar HTML para PDF
      const html = generateJobDescriptionHTML({
        jobDesc,
        responsibilities,
        knowledge,
        competencies,
        approvals,
      });

      // Gerar PDF
      const options = { format: 'A4' };
      const file = { content: html };
      
      try {
        const pdfBuffer = await htmlPdf.generatePdf(file, options);
        const base64Pdf = pdfBuffer.toString('base64');
        
        return {
          success: true,
          pdfBase64: base64Pdf,
          filename: `descricao-cargo-${jobDesc.positionTitle.replace(/\s+/g, '-')}.pdf`,
        };
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate PDF" });
      }
    }),
});

function generateJobDescriptionHTML(data: any) {
  const { jobDesc, responsibilities, knowledge, competencies, approvals } = data;

  const getLevelLabel = (level: string) => {
    const map: Record<string, string> = {
      basico: "Básico",
      intermediario: "Intermediário",
      avancado: "Avançado",
      obrigatorio: "Obrigatório",
    };
    return map[level] || level;
  };

  const getApprovalStatus = (approval: any) => {
    if (approval.status === "approved") return `✓ Aprovado em ${new Date(approval.approvedAt || approval.createdAt).toLocaleDateString("pt-BR")}`;
    if (approval.status === "rejected") return `✗ Rejeitado em ${new Date(approval.approvedAt || approval.createdAt).toLocaleDateString("pt-BR")}`;
    return "⏳ Pendente";
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      font-size: 12px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      background-color: #f0f0f0;
      padding: 10px;
      font-weight: bold;
      font-size: 14px;
      border-left: 4px solid #333;
      margin-bottom: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    .info-item {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    .info-label {
      font-weight: bold;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .category-badge {
      background-color: #e0e0e0;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
    }
    .signatures {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-box {
      border: 1px solid #333;
      padding: 15px;
      margin-bottom: 15px;
      min-height: 80px;
    }
    .signature-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .signature-status {
      color: #666;
      font-size: 11px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>DESCRIÇÃO DE CARGO</h1>
    <p><strong>Template UISA</strong></p>
    <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
  </div>

  <!-- Seção 1: Informações Básicas -->
  <div class="section">
    <div class="section-title">1. INFORMAÇÕES BÁSICAS</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Cargo:</span> ${jobDesc.positionTitle}
      </div>
      <div class="info-item">
        <span class="info-label">Departamento:</span> ${jobDesc.departmentName}
      </div>
      <div class="info-item">
        <span class="info-label">CBO:</span> ${jobDesc.cbo || "-"}
      </div>
      <div class="info-item">
        <span class="info-label">Divisão:</span> ${jobDesc.division || "-"}
      </div>
      <div class="info-item">
        <span class="info-label">Reporta para:</span> ${jobDesc.reportsTo || "-"}
      </div>
      <div class="info-item">
        <span class="info-label">Revisão:</span> ${jobDesc.revision || "1.0"}
      </div>
    </div>
  </div>

  <!-- Seção 2: Objetivo Principal -->
  <div class="section">
    <div class="section-title">2. OBJETIVO PRINCIPAL DO CARGO</div>
    <p>${jobDesc.mainObjective}</p>
  </div>

  <!-- Seção 3: Responsabilidades -->
  <div class="section">
    <div class="section-title">3. RESPONSABILIDADES</div>
    ${responsibilities.map((r: any) => `
      <div style="margin-bottom: 15px;">
        <span class="category-badge">${r.category}</span>
        <p style="margin-top: 5px;">${r.description}</p>
      </div>
    `).join('')}
  </div>

  <!-- Seção 4: Conhecimentos Técnicos -->
  <div class="section">
    <div class="section-title">4. CONHECIMENTOS TÉCNICOS</div>
    <table>
      <thead>
        <tr>
          <th>Conhecimento</th>
          <th>Nível</th>
        </tr>
      </thead>
      <tbody>
        ${knowledge.map((k: any) => `
          <tr>
            <td>${k.name}</td>
            <td>${getLevelLabel(k.level)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Seção 5: Treinamento Obrigatório -->
  ${jobDesc.mandatoryTraining && jobDesc.mandatoryTraining.length > 0 ? `
  <div class="section">
    <div class="section-title">5. TREINAMENTO OBRIGATÓRIO</div>
    <ul>
      ${jobDesc.mandatoryTraining.map((t: string) => `<li>${t}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <!-- Seção 6: Competências e Habilidades -->
  <div class="section">
    <div class="section-title">6. COMPETÊNCIAS E HABILIDADES</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      ${competencies.map((c: any) => `
        <div>• ${c.name}</div>
      `).join('')}
    </div>
  </div>

  <!-- Seção 7: Qualificação Desejada -->
  <div class="section">
    <div class="section-title">7. QUALIFICAÇÃO DESEJADA</div>
    <div class="info-item">
      <span class="info-label">Formação:</span> ${jobDesc.educationLevel || "-"}
    </div>
    <div class="info-item">
      <span class="info-label">Experiência:</span> ${jobDesc.requiredExperience || "-"}
    </div>
  </div>

  <!-- Seção 8: e-Social -->
  ${jobDesc.eSocialSpecs ? `
  <div class="section">
    <div class="section-title">8. e-SOCIAL</div>
    <p>${jobDesc.eSocialSpecs}</p>
  </div>
  ` : ''}

  <!-- Assinaturas Digitais -->
  <div class="signatures">
    <div class="section-title">APROVAÇÕES</div>
    
    ${approvals.map((approval: any) => `
      <div class="signature-box">
        <div class="signature-title">
          ${approval.approvalLevel === 'occupant' ? 'OCUPANTE DO CARGO' : 
            approval.approvalLevel === 'manager' ? 'SUPERIOR IMEDIATO' : 
            'GERENTE DE RH'}
        </div>
        <div style="margin-top: 10px;">
          <strong>Nome:</strong> ${approval.approverName || "-"}
        </div>
        <div class="signature-status">
          ${getApprovalStatus(approval)}
        </div>
        ${approval.comments ? `<div style="margin-top: 5px;"><em>Comentários: ${approval.comments}</em></div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>Documento gerado automaticamente pelo Sistema AVD UISA</p>
    <p>Este documento possui validade legal mediante assinaturas digitais dos aprovadores</p>
  </div>
</body>
</html>
  `;
}
