/**
 * API: 获取团队统计数据
 * GET /api/team/stats
 */

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resp } from "@/lib/resp";
import {
  getTeamPersonalityStats,
  getHighRiskCandidates,
} from "@/services/candidate";
import { getRemainingQuota } from "@/services/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return resp({ code: 401, message: "未登录" });
    }

    const tenantId = session.user.tenant_id || session.user.uuid;

    // 获取团队人格分布
    const personalityStats = await getTeamPersonalityStats(tenantId);

    // 获取高风险候选人
    const highRiskCandidates = await getHighRiskCandidates(tenantId);

    // 获取剩余次数
    const quota = await getRemainingQuota(tenantId);

    return resp({
      code: 200,
      data: {
        personalityStats,
        highRiskCandidates,
        quota,
      },
    });
  } catch (error: any) {
    console.error("获取团队统计失败:", error);
    return resp({ code: 500, message: "服务器错误" });
  }
}
