import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function ReportList() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: reportList, isLoading } = trpc.reports.list.useQuery(
    { limit: 100 },
    {
      enabled: isAuthenticated,
    }
  );

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">请先登录</h2>
          <a href={"/api/oauth/login"}>
            <Button>立即登录</Button>
          </a>
        </div>
      </div>
    );
  }

  // 过滤报告
  const filteredReports = reportList?.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.candidate?.name.toLowerCase().includes(query) ||
      item.candidate?.position?.toLowerCase().includes(query) ||
      item.report.personalityType?.toLowerCase().includes(query)
    );
  });

  // 风险等级颜色
  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "high":
        return "高风险";
      case "medium":
        return "中风险";
      case "low":
        return "低风险";
      default:
        return level;
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📂 历史记录</h1>
            <p className="text-muted-foreground mt-1">查看所有候选人分析报告</p>
          </div>
          <Link href="/tasks/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建任务
            </Button>
          </Link>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索候选人姓名、岗位或人格类型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 报告列表 */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : !filteredReports || filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery ? "没有找到匹配的报告" : "暂无分析报告"}
          </div>
          {!searchQuery && (
            <Link href="/tasks/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                创建第一个分析任务
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((item) => (
            <Link key={item.report.uuid} href={`/reports/${item.report.uuid}`}>
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{item.candidate?.name}</h3>
                        {item.candidate?.isHired && <Badge variant="secondary">已录用</Badge>}
                        <Badge variant={getRiskColor(item.report.riskLevel)}>
                          {getRiskLabel(item.report.riskLevel)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{item.candidate?.position || "未指定岗位"}</span>
                        <span>•</span>
                        <span>{item.report.personalityType}</span>
                        <span>•</span>
                        <span>成熟度 {item.report.maturityScore}/10</span>
                        <span>•</span>
                        <span>匹配度 {item.report.matchScore}%</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        分析时间：{new Date(item.report.createdAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {filteredReports && filteredReports.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          共 {filteredReports.length} 条记录
          {searchQuery && ` (搜索: "${searchQuery}")`}
        </div>
      )}
    </div>
  );
}
