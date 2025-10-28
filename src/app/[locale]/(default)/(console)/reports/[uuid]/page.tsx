/**
 * 报告详情页面
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReportDetailClient } from "./client";

// 获取报告数据
async function getReport(uuid: string, tenantId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/reports/${uuid}`, {
      headers: {
        "x-tenant-id": tenantId,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("获取报告失败:", error);
    return null;
  }
}

export default async function ReportDetailPage({
  params,
}: {
  params: { uuid: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const tenantId = session.user.tenant_id || session.user.uuid;
  const reportData = await getReport(params.uuid, tenantId);

  return <ReportDetailClient reportData={reportData} reportUuid={params.uuid} />;
}
