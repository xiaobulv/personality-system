/**
 * 首页 Dashboard - 感理识人系统
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, AlertTriangle, Users, TrendingUp } from "lucide-react";

// 获取团队统计数据
async function getTeamStats(tenantId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/team/stats`, {
      headers: {
        "x-tenant-id": tenantId,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const tenantId = session.user.tenant_id || session.user.uuid;
  const stats = await getTeamStats(tenantId);

  // 风险等级颜色
  const getRiskBadge = (level: string) => {
    const colors = {
      high: "destructive",
      medium: "warning",
      low: "secondary",
    };
    return colors[level as keyof typeof colors] || "secondary";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👁️ 团队识人雷达系统</h1>
          <p className="text-muted-foreground mt-1">
            快速判断候选人，洞察团队结构
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tasks/create">
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              新建判断任务
            </Button>
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 剩余次数卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剩余分析次数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.quota?.remaining || 0} / {stats?.quota?.total || 0}
            </div>
            <Progress
              value={
                ((stats?.quota?.remaining || 0) / (stats?.quota?.total || 1)) *
                100
              }
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              当前套餐：
              <Badge variant="outline" className="ml-1">
                {stats?.quota?.planType === "free"
                  ? "免费版"
                  : stats?.quota?.planType === "basic"
                  ? "基础版"
                  : stats?.quota?.planType === "pro"
                  ? "专业版"
                  : "企业版"}
              </Badge>
            </p>
            {(stats?.quota?.remaining || 0) < 5 && (
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  升级套餐
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* 团队人数卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已录用人数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.personalityStats?.reduce(
                (sum: number, item: any) => sum + Number(item.count),
                0
              ) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              已完成人格分析的团队成员
            </p>
          </CardContent>
        </Card>

        {/* 高风险预警卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高风险预警</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.highRiskCandidates?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              需要重点关注的候选人
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 高风险预警列表 */}
      {stats?.highRiskCandidates && stats.highRiskCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              🔥 高风险预警名单
            </CardTitle>
            <CardDescription>
              以下候选人存在较高风险，建议谨慎考虑
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>岗位</TableHead>
                  <TableHead>人格类型</TableHead>
                  <TableHead>风险等级</TableHead>
                  <TableHead>风险描述</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.highRiskCandidates.map((item: any) => (
                  <TableRow key={item.report.uuid}>
                    <TableCell className="font-medium">
                      {item.candidate?.name}
                    </TableCell>
                    <TableCell>{item.candidate?.position}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.report.personality_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadge(item.report.risk_level) as any}>
                        {item.report.risk_level === "high"
                          ? "高"
                          : item.report.risk_level === "medium"
                          ? "中"
                          : "低"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.report.report_data?.risk?.risk_points?.[0] ||
                        "暂无描述"}
                    </TableCell>
                    <TableCell>
                      <Link href={`/reports/${item.report.uuid}`}>
                        <Button variant="ghost" size="sm">
                          查看详情
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 团队人格分布 */}
      {stats?.personalityStats && stats.personalityStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 团队人格结构分布</CardTitle>
            <CardDescription>已录用员工的人格类型统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.personalityStats.map((item: any) => (
                <div
                  key={item.personality_type}
                  className="flex flex-col items-center p-4 border rounded-lg"
                >
                  <div className="text-3xl font-bold text-primary">
                    {item.count}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.personality_type}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/team-map">
              <Button variant="outline" className="w-full mt-4">
                查看完整团队图谱
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Link href="/tasks/create">
            <Button variant="outline" className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              新建判断任务
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="w-full">
              📂 历史判断记录
            </Button>
          </Link>
          <Link href="/team-map">
            <Button variant="outline" className="w-full">
              🌐 团队人格图谱
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
