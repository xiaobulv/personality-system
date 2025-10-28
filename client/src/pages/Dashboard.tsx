import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, TrendingUp, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  // 获取剩余次数
  const { data: remainingQuota, isLoading: quotaLoading } = trpc.quota.remaining.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 获取高风险候选人
  const { data: highRiskList, isLoading: riskLoading } = trpc.team.highRisk.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 获取团队统计
  const { data: teamStats, isLoading: statsLoading } = trpc.team.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">请先登录</h2>
          <p className="text-muted-foreground mb-6">登录后即可使用感理识人系统</p>
          <a href={"/api/oauth/login"}>
            <Button>立即登录</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👁️ 识人雷达</h1>
          <p className="text-muted-foreground mt-1">快速识别候选人特质，优化招聘决策</p>
        </div>
        <Link href="/tasks/create">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            新建分析任务
          </Button>
        </Link>
      </div>

      {/* 剩余次数卡片 */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>剩余分析次数</span>
            <Badge variant={remainingQuota && remainingQuota > 0 ? "default" : "destructive"}>
              {quotaLoading ? "..." : remainingQuota || 0} 次
            </Badge>
          </CardTitle>
          <CardDescription>
            {remainingQuota && remainingQuota > 0
              ? "您还可以分析更多候选人"
              : "次数已用完，请联系管理员充值"}
          </CardDescription>
        </CardHeader>
        {remainingQuota && remainingQuota === 0 && (
          <CardContent>
            <Button variant="outline" className="w-full">
              购买更多次数
            </Button>
          </CardContent>
        )}
      </Card>

      {/* 高风险预警 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            高风险预警
          </CardTitle>
          <CardDescription>需要特别关注的候选人</CardDescription>
        </CardHeader>
        <CardContent>
          {riskLoading ? (
            <div className="text-center py-4 text-muted-foreground">加载中...</div>
          ) : !highRiskList || highRiskList.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无高风险候选人</div>
          ) : (
            <div className="space-y-3">
              {highRiskList.map((item: any) => (
                <Link key={item.report.uuid} href={`/reports/${item.report.uuid}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium">{item.candidate.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.candidate.position || "未指定岗位"} • {item.report.personalityType}
                      </div>
                    </div>
                    <Badge variant="destructive">高风险</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 团队统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">总候选人数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsLoading ? "..." : teamStats?.total_candidates || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">已录用人数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {statsLoading ? "..." : teamStats?.hired_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">平均匹配度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsLoading ? "..." : teamStats?.avg_match_score ? `${teamStats.avg_match_score.toFixed(0)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 团队人格分布 */}
      {teamStats && teamStats.personality_distribution && Object.keys(teamStats.personality_distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              团队人格分布
            </CardTitle>
            <CardDescription>查看团队成员的人格类型构成</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(teamStats.personality_distribution).map(([type, count]) => (
                <div key={type} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{count as number}</div>
                  <div className="text-sm text-muted-foreground mt-1">{type}</div>
                </div>
              ))}
            </div>
            <Link href="/team-map">
              <Button variant="outline" className="w-full mt-4">
                <TrendingUp className="mr-2 h-4 w-4" />
                查看完整团队图谱
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/tasks/create">
          <Card className="hover:bg-accent cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="font-medium">新建分析任务</div>
                <div className="text-sm text-muted-foreground mt-1">分析新候选人</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:bg-accent cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="font-medium">历史记录</div>
                <div className="text-sm text-muted-foreground mt-1">查看所有分析报告</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/team-map">
          <Card className="hover:bg-accent cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="font-medium">团队图谱</div>
                <div className="text-sm text-muted-foreground mt-1">可视化团队结构</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
