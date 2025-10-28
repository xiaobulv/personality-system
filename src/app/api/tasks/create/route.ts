/**
 * API: 创建分析任务
 * POST /api/tasks/create
 */

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resp } from "@/lib/resp";
import { createCandidate, createAnalysisTask } from "@/services/candidate";
import { checkAndDeductQuota } from "@/services/tenant";
import { performCompleteAnalysis } from "@/services/aiAnalysis";
import { createReport } from "@/services/candidate";

export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户登录
    const session = await auth();
    if (!session?.user?.uuid) {
      return resp({ code: 401, message: "未登录" });
    }

    // 2. 获取请求参数
    const body = await req.json();
    const { name, position, inputText, fileUrl } = body;

    // 验证必填字段
    if (!name || !position) {
      return resp({ code: 400, message: "候选人姓名和岗位为必填项" });
    }

    if (!inputText && !fileUrl) {
      return resp({ code: 400, message: "请提供文本内容或上传文件" });
    }

    // 3. 获取租户ID (从用户信息中获取)
    const tenantId = session.user.tenant_id || session.user.uuid;

    // 4. 检查并扣除分析次数
    try {
      await checkAndDeductQuota(tenantId);
    } catch (error: any) {
      return resp({ code: 403, message: error.message });
    }

    // 5. 创建候选人记录
    const candidate = await createCandidate({
      tenantId,
      createdBy: session.user.uuid,
      name,
      position,
    });

    // 6. 创建分析任务
    const task = await createAnalysisTask({
      tenantId,
      candidateId: candidate.id,
      createdBy: session.user.uuid,
      inputText,
      fileUrl,
    });

    // 7. 异步执行AI分析 (实际应该放到队列中)
    // 这里为了简化，直接在请求中执行
    try {
      const analysisText = inputText || ""; // TODO: 如果是文件，需要先提取文本

      const reportData = await performCompleteAnalysis(analysisText, position);

      // 保存报告
      const report = await createReport({
        tenantId,
        candidateId: candidate.id,
        createdBy: session.user.uuid,
        reportData,
      });

      return resp({
        code: 200,
        message: "分析完成",
        data: {
          taskUuid: task.uuid,
          reportUuid: report.uuid,
          candidateUuid: candidate.uuid,
        },
      });
    } catch (error: any) {
      console.error("AI分析失败:", error);
      return resp({
        code: 500,
        message: "AI分析失败: " + error.message,
      });
    }
  } catch (error: any) {
    console.error("创建任务失败:", error);
    return resp({ code: 500, message: "服务器错误: " + error.message });
  }
}
