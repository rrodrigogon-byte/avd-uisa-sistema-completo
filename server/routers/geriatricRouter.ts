/**
 * Router tRPC para Testes Geriátricos
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as geriatricDb from "../geriatricDb";

export const geriatricRouter = router({
  // ============================================================================
  // PACIENTES
  // ============================================================================

  patients: router({
    create: protectedProcedure
      .input(
        z.object({
          nome: z.string().min(1),
          dataNascimento: z.string(), // ISO date string
          cpf: z.string().optional(),
          rg: z.string().optional(),
          sexo: z.enum(["masculino", "feminino", "outro"]).optional(),
          telefone: z.string().optional(),
          email: z.string().email().optional(),
          endereco: z.string().optional(),
          escolaridade: z
            .enum([
              "analfabeto",
              "fundamental_incompleto",
              "fundamental_completo",
              "medio_incompleto",
              "medio_completo",
              "superior_incompleto",
              "superior_completo",
              "pos_graduacao",
            ])
            .optional(),
          historicoMedico: z.string().optional(),
          medicamentosEmUso: z.string().optional(),
          nomeResponsavel: z.string().optional(),
          telefoneResponsavel: z.string().optional(),
          parentescoResponsavel: z.string().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await geriatricDb.createPatient({
          ...input,
          dataNascimento: new Date(input.dataNascimento),
          createdBy: ctx.user.id,
        });
        return { id };
      }),

    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return await geriatricDb.getAllPatients(input?.activeOnly ?? true);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getPatientById(input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).optional(),
          dataNascimento: z.string().optional(),
          cpf: z.string().optional(),
          rg: z.string().optional(),
          sexo: z.enum(["masculino", "feminino", "outro"]).optional(),
          telefone: z.string().optional(),
          email: z.string().email().optional(),
          endereco: z.string().optional(),
          escolaridade: z
            .enum([
              "analfabeto",
              "fundamental_incompleto",
              "fundamental_completo",
              "medio_incompleto",
              "medio_completo",
              "superior_incompleto",
              "superior_completo",
              "pos_graduacao",
            ])
            .optional(),
          historicoMedico: z.string().optional(),
          medicamentosEmUso: z.string().optional(),
          nomeResponsavel: z.string().optional(),
          telefoneResponsavel: z.string().optional(),
          parentescoResponsavel: z.string().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, dataNascimento, ...rest } = input;
        const updateData = dataNascimento
          ? { ...rest, dataNascimento: new Date(dataNascimento) }
          : rest;
        await geriatricDb.updatePatient(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await geriatricDb.deletePatient(input.id);
        return { success: true };
      }),

    getFullHistory: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getPatientFullHistory(input.pacienteId);
      }),
  }),

  // ============================================================================
  // TESTE DE KATZ
  // ============================================================================

  katz: router({
    create: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          dataAvaliacao: z.string(),
          banho: z.number().min(0).max(1),
          vestir: z.number().min(0).max(1),
          higienePessoal: z.number().min(0).max(1),
          transferencia: z.number().min(0).max(1),
          continencia: z.number().min(0).max(1),
          alimentacao: z.number().min(0).max(1),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const pontuacaoTotal =
          input.banho +
          input.vestir +
          input.higienePessoal +
          input.transferencia +
          input.continencia +
          input.alimentacao;

        const classificacao = geriatricDb.calculateKatzClassification(pontuacaoTotal);

        const id = await geriatricDb.createKatzTest({
          ...input,
          dataAvaliacao: new Date(input.dataAvaliacao),
          pontuacaoTotal,
          classificacao,
          avaliadorId: ctx.user.id,
        });

        return { id, pontuacaoTotal, classificacao };
      }),

    listByPatient: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getKatzTestsByPatient(input.pacienteId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getKatzTestById(input.id);
      }),
  }),

  // ============================================================================
  // TESTE DE LAWTON
  // ============================================================================

  lawton: router({
    create: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          dataAvaliacao: z.string(),
          usarTelefone: z.number().min(0).max(1),
          fazerCompras: z.number().min(0).max(1),
          prepararRefeicoes: z.number().min(0).max(1),
          cuidarCasa: z.number().min(0).max(1),
          lavarRoupa: z.number().min(0).max(1),
          usarTransporte: z.number().min(0).max(1),
          controlarMedicacao: z.number().min(0).max(1),
          controlarFinancas: z.number().min(0).max(1),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const pontuacaoTotal =
          input.usarTelefone +
          input.fazerCompras +
          input.prepararRefeicoes +
          input.cuidarCasa +
          input.lavarRoupa +
          input.usarTransporte +
          input.controlarMedicacao +
          input.controlarFinancas;

        const classificacao = geriatricDb.calculateLawtonClassification(pontuacaoTotal);

        const id = await geriatricDb.createLawtonTest({
          ...input,
          dataAvaliacao: new Date(input.dataAvaliacao),
          pontuacaoTotal,
          classificacao,
          avaliadorId: ctx.user.id,
        });

        return { id, pontuacaoTotal, classificacao };
      }),

    listByPatient: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getLawtonTestsByPatient(input.pacienteId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getLawtonTestById(input.id);
      }),
  }),

  // ============================================================================
  // MINIMENTAL
  // ============================================================================

  miniMental: router({
    create: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          dataAvaliacao: z.string(),
          orientacaoTemporal: z.number().min(0).max(5),
          orientacaoEspacial: z.number().min(0).max(5),
          memoriaImediata: z.number().min(0).max(3),
          atencaoCalculo: z.number().min(0).max(5),
          evocacao: z.number().min(0).max(3),
          linguagem: z.number().min(0).max(8),
          praxiaConstrutiva: z.number().min(0).max(1),
          escolaridade: z.string(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const pontuacaoTotal =
          input.orientacaoTemporal +
          input.orientacaoEspacial +
          input.memoriaImediata +
          input.atencaoCalculo +
          input.evocacao +
          input.linguagem +
          input.praxiaConstrutiva;

        const classificacao = geriatricDb.calculateMiniMentalClassification(
          pontuacaoTotal,
          input.escolaridade
        );

        const { escolaridade, ...testData } = input;

        const id = await geriatricDb.createMiniMentalTest({
          ...testData,
          dataAvaliacao: new Date(input.dataAvaliacao),
          pontuacaoTotal,
          classificacao,
          avaliadorId: ctx.user.id,
        });

        return { id, pontuacaoTotal, classificacao };
      }),

    listByPatient: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getMiniMentalTestsByPatient(input.pacienteId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getMiniMentalTestById(input.id);
      }),
  }),

  // ============================================================================
  // ESCALA DE DEPRESSÃO GERIÁTRICA (GDS)
  // ============================================================================

  gds: router({
    create: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          dataAvaliacao: z.string(),
          q1_satisfeitoVida: z.number().min(0).max(1),
          q2_abandonouAtividades: z.number().min(0).max(1),
          q3_vidaVazia: z.number().min(0).max(1),
          q4_aborrece: z.number().min(0).max(1),
          q5_bomHumor: z.number().min(0).max(1),
          q6_medoCoisaRuim: z.number().min(0).max(1),
          q7_felizMaiorTempo: z.number().min(0).max(1),
          q8_desamparado: z.number().min(0).max(1),
          q9_prefereFicarCasa: z.number().min(0).max(1),
          q10_problemasMemoria: z.number().min(0).max(1),
          q11_bomEstarVivo: z.number().min(0).max(1),
          q12_inutil: z.number().min(0).max(1),
          q13_cheioEnergia: z.number().min(0).max(1),
          q14_situacaoSemEsperanca: z.number().min(0).max(1),
          q15_outrosMelhorSituacao: z.number().min(0).max(1),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Calcular pontuação (algumas perguntas são invertidas)
        const pontuacaoTotal =
          (1 - input.q1_satisfeitoVida) + // Invertida
          input.q2_abandonouAtividades +
          input.q3_vidaVazia +
          input.q4_aborrece +
          (1 - input.q5_bomHumor) + // Invertida
          input.q6_medoCoisaRuim +
          (1 - input.q7_felizMaiorTempo) + // Invertida
          input.q8_desamparado +
          input.q9_prefereFicarCasa +
          input.q10_problemasMemoria +
          (1 - input.q11_bomEstarVivo) + // Invertida
          input.q12_inutil +
          (1 - input.q13_cheioEnergia) + // Invertida
          input.q14_situacaoSemEsperanca +
          input.q15_outrosMelhorSituacao;

        const classificacao = geriatricDb.calculateGDSClassification(pontuacaoTotal);

        const id = await geriatricDb.createGDSTest({
          ...input,
          dataAvaliacao: new Date(input.dataAvaliacao),
          pontuacaoTotal,
          classificacao,
          avaliadorId: ctx.user.id,
        });

        return { id, pontuacaoTotal, classificacao };
      }),

    listByPatient: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getGDSTestsByPatient(input.pacienteId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getGDSTestById(input.id);
      }),
  }),

  // ============================================================================
  // TESTE DO RELÓGIO
  // ============================================================================

  clock: router({
    create: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          dataAvaliacao: z.string(),
          imagemUrl: z.string().optional(),
          pontuacaoCirculo: z.number().min(0).max(2),
          pontuacaoNumeros: z.number().min(0).max(4),
          pontuacaoPonteiros: z.number().min(0).max(4),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const pontuacaoTotal =
          input.pontuacaoCirculo + input.pontuacaoNumeros + input.pontuacaoPonteiros;

        const classificacao = geriatricDb.calculateClockClassification(pontuacaoTotal);

        const id = await geriatricDb.createClockTest({
          ...input,
          dataAvaliacao: new Date(input.dataAvaliacao),
          pontuacaoTotal,
          classificacao,
          avaliadorId: ctx.user.id,
        });

        return { id, pontuacaoTotal, classificacao };
      }),

    listByPatient: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getClockTestsByPatient(input.pacienteId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await geriatricDb.getClockTestById(input.id);
      }),
  }),
});
