import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, AlertTriangle, User, Briefcase, TrendingUp } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function ReportDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const { isAuthenticated } = useAuth();

  const { data, isLoading, refetch } = trpc.reports.getById.useQuery(
    { uuid: uuid || "" },
    {
      enabled: isAuthenticated && !!uuid,
    }
  );

  const markHiredMutation = trpc.reports.markHired.useMutation({
    onSuccess: () => {
      toast.success("已标记为录用");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "操作失败");
    },
  });

  const handleMarkHired = () => {
    if (!uuid) return;
    markHiredMutation.mutate({ uuid });
  };

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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (!data || !data.candidate) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">报告不存在</h2>
          <Link href="/reports">
            <Button>返回列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { report, candidate } = data;
  const reportData = report.reportData;

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
    <div className="container mx-auto p-6 max-w-5xl">
      {/* 页面标题 */}
      <div className="mb-6">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{candidate.name}</h1>
            <p className="text-muted-foreground mt-1">
              {candidate.position || "未指定岗位"} • 分析时间：
              {new Date(report.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>
          {!candidate.isHired && (
            <Button onClick={handleMarkHired} disabled={markHiredMutation.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              标记已录用
            </Button>
          )}
          {candidate.isHired && <Badge variant="secondary">已录用</Badge>}
        </div>
      </div>

      {/* 核心结论 */}
      <Card className="mb-6 border-2 border-primary">
        <CardHeader>
          <CardTitle>核心结论</CardTitle>
          <CardDescription>{reportData.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 人格类型 */}
            <div className="text-center p-4 border rounded-lg">
              <User className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">人格类型</div>
              <div className="text-xl font-bold mt-1">{report.personalityType}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {report.personalityDimension1} + {report.personalityDimension2}
              </div>
            </div>

            {/* 成熟度评分 */}
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">成熟度评分</div>
              <div className="text-xl font-bold mt-1">{report.maturityScore}/10</div>
            </div>

            {/* 匹配度评分 */}
            <div className="text-center p-4 border rounded-lg">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">匹配度评分</div>
              <div className="text-xl font-bold mt-1">{report.matchScore}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 风险提示 */}
      {report.riskLevel !== "low" && (
        <Alert variant={report.riskLevel === "high" ? "destructive" : "default"} className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-2 mb-2">
              <strong>风险等级：</strong>
              <Badge variant={getRiskColor(report.riskLevel)}>{getRiskLabel(report.riskLevel)}</Badge>
            </div>
            {report.riskFactors && report.riskFactors.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                {report.riskFactors.map((factor: string, index: number) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 使用建议 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>💡 使用建议</CardTitle>
          <CardDescription>如何用好这个人</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{reportData.usageSuggestions}</p>
          </div>
        </CardContent>
      </Card>

      {/* 沟通指南 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🤝 沟通指南</CardTitle>
          <CardDescription>如何与TA高效协作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{reportData.communicationGuide}</p>
          </div>
        </CardContent>
      </Card>

      {/* 岗位适配 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🎯 岗位适配分析</CardTitle>
          <CardDescription>适合什么岗位，不适合什么岗位</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{reportData.positionMatch}</p>
          </div>
        </CardContent>
      </Card>

      {/* 人格线索 */}
      {reportData.clues && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔍 人格线索</CardTitle>
            <CardDescription>AI提取的关键特征</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{reportData.clues}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Link href="/reports">
          <Button variant="outline">返回列表</Button>
        </Link>
        <Link href="/tasks/create">
          <Button>分析下一个候选人</Button>
        </Link>
      </div>
    </div>
  );
}
