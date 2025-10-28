import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  tenants,
  subscriptions,
  candidates,
  reports,
  analysisTasks,
  quotaLogs,
  InsertTenant,
  InsertSubscription,
  InsertCandidate,
  InsertReport,
  InsertQuotaLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { randomUUID } from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 租户管理
 */
export async function createTenant(data: { name: string; ownerUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tenant: InsertTenant = {
    uuid: randomUUID(),
    name: data.name,
    ownerUserId: data.ownerUserId,
    status: "active",
  };

  await db.insert(tenants).values(tenant);

  // 更新用户的tenantId
  const createdTenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.uuid, tenant.uuid!))
    .limit(1);

  if (createdTenant.length > 0) {
    await db.update(users).set({ tenantId: createdTenant[0].id }).where(eq(users.id, data.ownerUserId));

    // 创建免费订阅
    await createSubscription({
      tenantId: createdTenant[0].id,
      planType: "free",
      quotaTotal: 3,
    });
  }

  return createdTenant[0];
}

export async function getTenantById(tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 订阅管理
 */
export async function createSubscription(data: {
  tenantId: number;
  planType: "free" | "basic" | "pro" | "enterprise";
  quotaTotal: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const subscription: InsertSubscription = {
    uuid: randomUUID(),
    tenantId: data.tenantId,
    planType: data.planType,
    quotaTotal: data.quotaTotal,
    quotaUsed: 0,
    status: "active",
  };

  await db.insert(subscriptions).values(subscription);
}

export async function getActiveSubscription(tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.tenantId, tenantId), eq(subscriptions.status, "active")))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function consumeQuota(tenantId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const subscription = await getActiveSubscription(tenantId);
  if (!subscription) {
    throw new Error("No active subscription");
  }

  if (subscription.quotaUsed >= subscription.quotaTotal) {
    throw new Error("Quota exceeded");
  }

  // 扣除次数
  await db
    .update(subscriptions)
    .set({ quotaUsed: subscription.quotaUsed + 1 })
    .where(eq(subscriptions.id, subscription.id));

  // 记录日志
  const log: InsertQuotaLog = {
    uuid: randomUUID(),
    tenantId,
    userId,
    operationType: "analysis",
    quotaChange: -1,
    balanceBefore: subscription.quotaTotal - subscription.quotaUsed,
    balanceAfter: subscription.quotaTotal - subscription.quotaUsed - 1,
  };

  await db.insert(quotaLogs).values(log);
}

export async function getRemainingQuota(tenantId: number): Promise<number> {
  const subscription = await getActiveSubscription(tenantId);
  if (!subscription) return 0;
  return subscription.quotaTotal - subscription.quotaUsed;
}

/**
 * 候选人管理
 */
export async function createCandidate(data: {
  tenantId: number;
  name: string;
  position?: string;
  sourceText: string;
  sourceType: "text" | "file" | "chat";
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const candidate: InsertCandidate = {
    uuid: randomUUID(),
    ...data,
  };

  await db.insert(candidates).values(candidate);

  const result = await db
    .select()
    .from(candidates)
    .where(eq(candidates.uuid, candidate.uuid!))
    .limit(1);

  return result[0];
}

export async function getCandidateById(candidateId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCandidateByUuid(uuid: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(candidates).where(eq(candidates.uuid, uuid)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markCandidateHired(candidateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(candidates).set({ isHired: true, hiredAt: new Date() }).where(eq(candidates.id, candidateId));
}

/**
 * 报告管理
 */
export async function createReport(data: {
  candidateId: number;
  tenantId: number;
  personalityType: string;
  personalityDimension1: string;
  personalityDimension2: string;
  maturityScore: number;
  matchScore: number;
  riskLevel: "low" | "medium" | "high";
  riskFactors: string[];
  reportData: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const report: InsertReport = {
    uuid: randomUUID(),
    candidateId: data.candidateId,
    tenantId: data.tenantId,
    personalityType: data.personalityType,
    personalityDimension1: data.personalityDimension1,
    personalityDimension2: data.personalityDimension2,
    maturityScore: data.maturityScore,
    matchScore: data.matchScore,
    riskLevel: data.riskLevel,
    riskFactors: JSON.stringify(data.riskFactors),
    reportData: JSON.stringify(data.reportData),
    analysisStatus: "completed",
  };

  await db.insert(reports).values(report);

  const result = await db.select().from(reports).where(eq(reports.uuid, report.uuid!)).limit(1);

  return result[0];
}

export async function getReportByUuid(uuid: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reports).where(eq(reports.uuid, uuid)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReportByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reports).where(eq(reports.candidateId, candidateId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReportsByTenantId(tenantId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(reports).where(eq(reports.tenantId, tenantId)).orderBy(desc(reports.createdAt)).limit(limit);
}

export async function deleteReport(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(reports).where(eq(reports.id, reportId));
}

/**
 * 团队统计
 */
export async function getTeamStats(tenantId: number) {
  const db = await getDb();
  if (!db) return null;

  const allReports = await db.select().from(reports).where(eq(reports.tenantId, tenantId));

  const allCandidates = await db.select().from(candidates).where(eq(candidates.tenantId, tenantId));

  const hiredCount = allCandidates.filter((c) => c.isHired).length;

  // 人格类型分布
  const personalityDistribution: Record<string, number> = {};
  allReports.forEach((r) => {
    const type = r.personalityType || "未知";
    personalityDistribution[type] = (personalityDistribution[type] || 0) + 1;
  });

  // 风险等级分布
  const riskDistribution: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };
  allReports.forEach((r) => {
    riskDistribution[r.riskLevel]++;
  });

  // 平均分数
  const avgMaturityScore =
    allReports.length > 0 ? allReports.reduce((sum, r) => sum + (r.maturityScore || 0), 0) / allReports.length : 0;

  const avgMatchScore =
    allReports.length > 0 ? allReports.reduce((sum, r) => sum + (r.matchScore || 0), 0) / allReports.length : 0;

  return {
    total_candidates: allCandidates.length,
    hired_count: hiredCount,
    personality_distribution: personalityDistribution,
    risk_distribution: riskDistribution,
    avg_maturity_score: avgMaturityScore,
    avg_match_score: avgMatchScore,
  };
}

/**
 * 获取高风险候选人
 */
export async function getHighRiskCandidates(tenantId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const highRiskReports = await db
    .select()
    .from(reports)
    .where(and(eq(reports.tenantId, tenantId), eq(reports.riskLevel, "high")))
    .orderBy(desc(reports.createdAt))
    .limit(limit);

  const result = [];
  for (const report of highRiskReports) {
    const candidate = await getCandidateById(report.candidateId);
    if (candidate) {
      result.push({
        report,
        candidate,
      });
    }
  }

  return result;
}
