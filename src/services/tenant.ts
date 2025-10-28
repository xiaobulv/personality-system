/**
 * 租户管理服务
 */

import { db } from "@/db";
import { tenants, users, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// ============================================
// 创建租户
// ============================================

export async function createTenant(data: {
  name: string;
  ownerUserUuid: string;
  planType?: string;
}) {
  const tenantUuid = uuidv4();

  // 创建租户
  const [tenant] = await db
    .insert(tenants)
    .values({
      uuid: tenantUuid,
      name: data.name,
      owner_user_uuid: data.ownerUserUuid,
      plan_type: data.planType || "free",
      status: "active",
    })
    .returning();

  // 创建免费试用订阅
  await db.insert(subscriptions).values({
    uuid: uuidv4(),
    tenant_id: tenantUuid,
    plan_type: "free",
    status: "active",
    monthly_quota: 3, // 免费版3次
    remaining_quota: 3,
    start_date: new Date(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
    auto_renew: false,
  });

  return tenant;
}

// ============================================
// 获取租户信息
// ============================================

export async function getTenantByUuid(tenantUuid: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.uuid, tenantUuid))
    .limit(1);

  return tenant;
}

export async function getTenantByOwner(ownerUserUuid: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.owner_user_uuid, ownerUserUuid))
    .limit(1);

  return tenant;
}

// ============================================
// 更新租户信息
// ============================================

export async function updateTenant(
  tenantUuid: string,
  data: {
    name?: string;
    logo_url?: string;
    custom_product_name?: string;
  }
) {
  const [updated] = await db
    .update(tenants)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(tenants.uuid, tenantUuid))
    .returning();

  return updated;
}

// ============================================
// 获取租户当前订阅
// ============================================

export async function getCurrentSubscription(tenantId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.tenant_id, tenantId),
        eq(subscriptions.status, "active")
      )
    )
    .orderBy(subscriptions.created_at)
    .limit(1);

  return subscription;
}

// ============================================
// 检查并扣除分析次数
// ============================================

export async function checkAndDeductQuota(tenantId: string): Promise<boolean> {
  const subscription = await getCurrentSubscription(tenantId);

  if (!subscription) {
    throw new Error("未找到有效订阅");
  }

  if (subscription.remaining_quota <= 0) {
    throw new Error("分析次数已用完，请升级套餐");
  }

  // 扣除次数
  await db
    .update(subscriptions)
    .set({
      remaining_quota: subscription.remaining_quota - 1,
      updated_at: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  return true;
}

// ============================================
// 获取剩余次数
// ============================================

export async function getRemainingQuota(tenantId: string): Promise<{
  remaining: number;
  total: number;
  planType: string;
}> {
  const subscription = await getCurrentSubscription(tenantId);

  if (!subscription) {
    return {
      remaining: 0,
      total: 0,
      planType: "free",
    };
  }

  return {
    remaining: subscription.remaining_quota,
    total: subscription.monthly_quota,
    planType: subscription.plan_type,
  };
}
