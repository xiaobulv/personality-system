/**
 * 候选人和报告管理服务
 */

import { db } from "@/db";
import { candidates, reports, analysisTasks } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { CompleteReport } from "./aiAnalysis";

// ============================================
// 创建候选人
// ============================================

export async function createCandidate(data: {
  tenantId: string;
  createdBy: string;
  name: string;
  position: string;
}) {
  const candidateUuid = uuidv4();

  const [candidate] = await db
    .insert(candidates)
    .values({
      uuid: candidateUuid,
      tenant_id: data.tenantId,
      created_by: data.createdBy,
      name: data.name,
      position: data.position,
      is_hired: false,
      status: "active",
    })
    .returning();

  return candidate;
}

// ============================================
// 创建分析任务
// ============================================

export async function createAnalysisTask(data: {
  tenantId: string;
  candidateId: number;
  createdBy: string;
  inputText?: string;
  fileUrl?: string;
}) {
  const taskUuid = uuidv4();

  const [task] = await db
    .insert(analysisTasks)
    .values({
      uuid: taskUuid,
      tenant_id: data.tenantId,
      candidate_id: data.candidateId,
      created_by: data.createdBy,
      input_text: data.inputText,
      file_url: data.fileUrl,
      status: "pending",
    })
    .returning();

  return task;
}

// ============================================
// 更新任务状态
// ============================================

export async function updateTaskStatus(
  taskUuid: string,
  status: string,
  errorMessage?: string
) {
  await db
    .update(analysisTasks)
    .set({
      status,
      error_message: errorMessage,
      completed_at: status === "completed" || status === "failed" ? new Date() : undefined,
    })
    .where(eq(analysisTasks.uuid, taskUuid));
}

// ============================================
// 创建报告
// ============================================

export async function createReport(data: {
  tenantId: string;
  candidateId: number;
  createdBy: string;
  reportData: CompleteReport;
}) {
  const reportUuid = uuidv4();

  const [report] = await db
    .insert(reports)
    .values({
      uuid: reportUuid,
      tenant_id: data.tenantId,
      candidate_id: data.candidateId,
      created_by: data.createdBy,
      report_data: data.reportData as any,
      personality_type: data.reportData.personality.personality_type,
      risk_level: data.reportData.risk.risk_level,
      maturity_score: data.reportData.personality.maturity_score,
      match_score: data.reportData.position_match.match_score,
      status: "completed",
    })
    .returning();

  return report;
}

// ============================================
// 获取报告详情
// ============================================

export async function getReportByUuid(reportUuid: string, tenantId: string) {
  const [report] = await db
    .select({
      report: reports,
      candidate: candidates,
    })
    .from(reports)
    .leftJoin(candidates, eq(reports.candidate_id, candidates.id))
    .where(
      and(eq(reports.uuid, reportUuid), eq(reports.tenant_id, tenantId))
    )
    .limit(1);

  return report;
}

// ============================================
// 获取报告列表
// ============================================

export async function getReportsList(params: {
  tenantId: string;
  page?: number;
  limit?: number;
  position?: string;
  riskLevel?: string;
  personalityType?: string;
  searchName?: string;
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = db
    .select({
      report: reports,
      candidate: candidates,
    })
    .from(reports)
    .leftJoin(candidates, eq(reports.candidate_id, candidates.id))
    .where(eq(reports.tenant_id, params.tenantId))
    .$dynamic();

  // 添加筛选条件
  if (params.position) {
    query = query.where(eq(candidates.position, params.position));
  }
  if (params.riskLevel) {
    query = query.where(eq(reports.risk_level, params.riskLevel));
  }
  if (params.personalityType) {
    query = query.where(eq(reports.personality_type, params.personalityType));
  }
  if (params.searchName) {
    query = query.where(sql`${candidates.name} ILIKE ${'%' + params.searchName + '%'}`);
  }

  const results = await query
    .orderBy(desc(reports.created_at))
    .limit(limit)
    .offset(offset);

  // 获取总数
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reports)
    .where(eq(reports.tenant_id, params.tenantId));

  return {
    data: results,
    total: Number(count),
    page,
    limit,
  };
}

// ============================================
// 标记候选人为已录用
// ============================================

export async function markCandidateAsHired(
  candidateUuid: string,
  tenantId: string
) {
  const [updated] = await db
    .update(candidates)
    .set({
      is_hired: true,
      updated_at: new Date(),
    })
    .where(
      and(eq(candidates.uuid, candidateUuid), eq(candidates.tenant_id, tenantId))
    )
    .returning();

  return updated;
}

// ============================================
// 获取团队人格分布统计
// ============================================

export async function getTeamPersonalityStats(tenantId: string) {
  const stats = await db
    .select({
      personality_type: reports.personality_type,
      count: sql<number>`count(*)`,
    })
    .from(reports)
    .leftJoin(candidates, eq(reports.candidate_id, candidates.id))
    .where(
      and(
        eq(reports.tenant_id, tenantId),
        eq(candidates.is_hired, true), // 只统计已录用的
        eq(candidates.status, "active")
      )
    )
    .groupBy(reports.personality_type);

  return stats;
}

// ============================================
// 获取高风险候选人列表
// ============================================

export async function getHighRiskCandidates(tenantId: string) {
  const results = await db
    .select({
      report: reports,
      candidate: candidates,
    })
    .from(reports)
    .leftJoin(candidates, eq(reports.candidate_id, candidates.id))
    .where(
      and(
        eq(reports.tenant_id, tenantId),
        eq(reports.risk_level, "high"),
        eq(candidates.is_hired, false) // 未录用的
      )
    )
    .orderBy(desc(reports.created_at))
    .limit(10);

  return results;
}

// ============================================
// 删除报告
// ============================================

export async function deleteReport(reportUuid: string, tenantId: string) {
  await db
    .delete(reports)
    .where(
      and(eq(reports.uuid, reportUuid), eq(reports.tenant_id, tenantId))
    );
}
