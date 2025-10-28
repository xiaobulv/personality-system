import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { analyzeCandidate } from "./services/aiAnalysis";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 任务管理
  tasks: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          position: z.string().optional(),
          sourceText: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user.tenantId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "用户未关联租户" });
        }

        // 检查剩余次数
        const remaining = await db.getRemainingQuota(user.tenantId);
        if (remaining <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "分析次数不足" });
        }

        // 创建候选人
        const candidate = await db.createCandidate({
          tenantId: user.tenantId,
          name: input.name,
          position: input.position,
          sourceText: input.sourceText,
          sourceType: "text",
          createdBy: user.id,
        });

        // 扣除次数
        await db.consumeQuota(user.tenantId, user.id);

        // 执行AI分析
        try {
          const analysisResult = await analyzeCandidate({
            sourceText: input.sourceText,
            candidateName: input.name,
            position: input.position,
          });

          // 创建报告
          const report = await db.createReport({
            candidateId: candidate.id,
            tenantId: user.tenantId,
            personalityType: analysisResult.personalityType,
            personalityDimension1: analysisResult.dimension1,
            personalityDimension2: analysisResult.dimension2,
            maturityScore: analysisResult.maturityScore,
            matchScore: analysisResult.matchScore,
            riskLevel: analysisResult.riskLevel,
            riskFactors: analysisResult.riskFactors,
            reportData: analysisResult.reportData,
          });

          return {
            success: true,
            reportUuid: report.uuid,
            candidateUuid: candidate.uuid,
          };
        } catch (error) {
          console.error("AI分析失败:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI分析失败" });
        }
      }),
  }),

  // 报告管理
  reports: router({
    getById: protectedProcedure
      .input(z.object({ uuid: z.string() }))
      .query(async ({ ctx, input }) => {
        const report = await db.getReportByUuid(input.uuid);
        if (!report) {
          throw new TRPCError({ code: "NOT_FOUND", message: "报告不存在" });
        }

        // 检查权限
        if (report.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问" });
        }

        const candidate = await db.getCandidateById(report.candidateId);

        return {
          report: {
            ...report,
            riskFactors: JSON.parse(report.riskFactors || "[]"),
            reportData: JSON.parse(report.reportData || "{}"),
          },
          candidate,
        };
      }),

    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user.tenantId) {
          return [];
        }

        const reports = await db.getReportsByTenantId(ctx.user.tenantId, input.limit);

        const result = [];
        for (const report of reports) {
          const candidate = await db.getCandidateById(report.candidateId);
          result.push({
            report: {
              ...report,
              riskFactors: JSON.parse(report.riskFactors || "[]"),
            },
            candidate,
          });
        }

        return result;
      }),

    markHired: protectedProcedure
      .input(z.object({ uuid: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getReportByUuid(input.uuid);
        if (!report) {
          throw new TRPCError({ code: "NOT_FOUND", message: "报告不存在" });
        }

        if (report.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }

        await db.markCandidateHired(report.candidateId);

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ uuid: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getReportByUuid(input.uuid);
        if (!report) {
          throw new TRPCError({ code: "NOT_FOUND", message: "报告不存在" });
        }

        if (report.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }

        await db.deleteReport(report.id);

        return { success: true };
      }),
  }),

  // 团队统计
  team: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "用户未关联租户" });
      }

      const stats = await db.getTeamStats(ctx.user.tenantId);
      return stats;
    }),

    highRisk: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantId) {
        return [];
      }

      return await db.getHighRiskCandidates(ctx.user.tenantId);
    }),
  }),

  // 配额管理
  quota: router({
    remaining: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantId) {
        return 0;
      }

      return await db.getRemainingQuota(ctx.user.tenantId);
    }),
  }),
});

export type AppRouter = typeof appRouter;
