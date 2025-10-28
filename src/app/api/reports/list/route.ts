/**
 * API: 获取报告列表
 * GET /api/reports/list
 */

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resp } from "@/lib/resp";
import { getReportsList } from "@/services/candidate";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return resp({ code: 401, message: "未登录" });
    }

    const tenantId = session.user.tenant_id || session.user.uuid;

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const position = searchParams.get("position") || undefined;
    const riskLevel = searchParams.get("riskLevel") || undefined;
    const personalityType = searchParams.get("personalityType") || undefined;
    const searchName = searchParams.get("searchName") || undefined;

    const result = await getReportsList({
      tenantId,
      page,
      limit,
      position,
      riskLevel,
      personalityType,
      searchName,
    });

    return resp({
      code: 200,
      data: result,
    });
  } catch (error: any) {
    console.error("获取报告列表失败:", error);
    return resp({ code: 500, message: "服务器错误" });
  }
}
