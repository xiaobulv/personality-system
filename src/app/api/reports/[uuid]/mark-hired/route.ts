/**
 * API: 标记候选人为已录用
 * POST /api/reports/[uuid]/mark-hired
 */

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resp } from "@/lib/resp";
import { markCandidateAsHired, getReportByUuid } from "@/services/candidate";

export async function POST(
  req: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return resp({ code: 401, message: "未登录" });
    }

    const tenantId = session.user.tenant_id || session.user.uuid;
    const reportUuid = params.uuid;

    // 获取报告信息
    const report = await getReportByUuid(reportUuid, tenantId);
    if (!report || !report.candidate) {
      return resp({ code: 404, message: "报告不存在" });
    }

    // 标记为已录用
    await markCandidateAsHired(report.candidate.uuid, tenantId);

    return resp({
      code: 200,
      message: "已标记为录用",
    });
  } catch (error: any) {
    console.error("标记录用失败:", error);
    return resp({ code: 500, message: "服务器错误" });
  }
}
