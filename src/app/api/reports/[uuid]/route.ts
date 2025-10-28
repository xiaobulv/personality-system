/**
 * API: 获取报告详情
 * GET /api/reports/[uuid]
 */

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resp } from "@/lib/resp";
import { getReportByUuid, markCandidateAsHired, deleteReport } from "@/services/candidate";

export async function GET(
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

    const report = await getReportByUuid(reportUuid, tenantId);

    if (!report) {
      return resp({ code: 404, message: "报告不存在" });
    }

    return resp({
      code: 200,
      data: report,
    });
  } catch (error: any) {
    console.error("获取报告失败:", error);
    return resp({ code: 500, message: "服务器错误" });
  }
}

// 删除报告
export async function DELETE(
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

    await deleteReport(reportUuid, tenantId);

    return resp({
      code: 200,
      message: "删除成功",
    });
  } catch (error: any) {
    console.error("删除报告失败:", error);
    return resp({ code: 500, message: "服务器错误" });
  }
}
