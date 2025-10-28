"use client";

/**
 * 报告详情客户端组件
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Home,
  UserCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ReportDetailClientProps {
  reportData: any;
  reportUuid: string;
}

export function ReportDetailClient({
  reportData,
  reportUuid,
}: ReportDetailClientProps) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);

  if (!reportData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>报告不存在</AlertTitle>
          <AlertDescription>
            未找到该报告，可能已被删除或您没有访问权限。
          </AlertDescription>
        </Alert>
        <Link href="/dashboard">
          <Button className="mt-4">返回首页</Button>
        </Link>
      </div>
    );
  }

  const { report, candidate } = reportData;
  const data = report.report_data;

  // 标记为已录用
  const handleMarkHired = async () => {
    if (!confirm(`确定要标记"${candidate?.name}"为已录用吗？`)) return;

    setMarking(true);
    try {
      const res = await fetch(`/api/reports/${reportUuid}/mark-hired`, {
        method: "POST",
      });

      const result = await res.json();

      if (result.code === 200) {
        toast.success("已标记为录用");
        router.refresh();
      } else {
        toast.error(result.message || "操作失败");
      }
    } catch (error) {
      console.error("标记失败:", error);
      toast.error("网络错误");
    } finally {
      setMarking(false);
    }
  };

  // 风险等级样式
  const getRiskVariant = (level: string) => {
    const variants = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    return variants[level as keyof typeof variants] || "secondary";
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* 页面头部 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            🧠 候选人分析报告：{candidate?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            应聘岗位：{candidate?.position}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            分析时间：{new Date(report.created_at).toLocaleString("zh-CN")}
          </p>
          {candidate?.is_hired && (
            <Badge variant="secondary" className="mt-2">
              ✓ 已录用
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>
      </div>

      {/* 核心结论卡片 */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-2xl">核心结论</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 人格类型 */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">人格类型</div>
            <div className="text-4xl font-bold text-primary">
              {data.personality.personality_type}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {data.personality.analysis_basis}
            </p>
          </div>

          {/* 评分 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                成熟度评分
              </div>
              <div className="text-2xl font-bold">
                {data.personality.maturity_score} / 10
              </div>
              <Progress
                value={data.personality.maturity_score * 10}
                className="mt-2"
              />
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                配合度评分
              </div>
              <div className="text-2xl font-bold">
                {data.personality.cooperation_score} / 10
              </div>
              <Progress
                value={data.personality.cooperation_score * 10}
                className="mt-2"
              />
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                稳定度评分
              </div>
              <div className="text-2xl font-bold">
                {data.personality.stability_score} / 10
              </div>
              <Progress
                value={data.personality.stability_score * 10}
                className="mt-2"
              />
            </div>
          </div>

          {/* 匹配度 */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              岗位匹配度
            </div>
            <div className="text-3xl font-bold">
              {data.position_match.match_score}%
            </div>
            <Progress value={data.position_match.match_score} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {data.position_match.usage_suggestions}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 风险提示卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            ⚠️ 风险提示
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Badge
              variant={getRiskVariant(data.risk.risk_level) as any}
              className="text-base"
            >
              风险等级：
              {data.risk.risk_level === "high"
                ? "高"
                : data.risk.risk_level === "medium"
                ? "中"
                : "低"}
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">具体风险点：</div>
            <ul className="list-disc list-inside space-y-1">
              {data.risk.risk_points.map((point: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <Alert>
            <AlertDescription>{data.risk.warning_details}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 使用建议卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            ✅ 使用建议（协作说明书）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">沟通风格建议：</div>
            <p className="text-sm text-muted-foreground">
              {data.collaboration_guide.communication_style}
            </p>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">激励方式：</div>
            <p className="text-sm text-muted-foreground">
              {data.collaboration_guide.motivation_method}
            </p>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">管理踩雷点：</div>
            <ul className="list-disc list-inside space-y-1">
              {data.collaboration_guide.management_pitfalls.map(
                (point: string, index: number) => (
                  <li key={index} className="text-sm text-destructive">
                    {point}
                  </li>
                )
              )}
            </ul>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">最佳对接方式：</div>
            <p className="text-sm text-muted-foreground">
              {data.collaboration_guide.best_practices}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 岗位适配 */}
      <Card>
        <CardHeader>
          <CardTitle>岗位适配分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2 text-green-600">
              ✅ 适合的岗位类型：
            </div>
            <div className="flex flex-wrap gap-2">
              {data.position_match.suitable_positions.map(
                (pos: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {pos}
                  </Badge>
                )
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2 text-destructive">
              ❌ 不适合的岗位类型：
            </div>
            <div className="flex flex-wrap gap-2">
              {data.position_match.unsuitable_positions.map(
                (pos: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {pos}
                  </Badge>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button size="lg" disabled>
          <FileDown className="mr-2 h-4 w-4" />
          生成PDF报告（开发中）
        </Button>
        {!candidate?.is_hired && (
          <Button
            variant="default"
            size="lg"
            onClick={handleMarkHired}
            disabled={marking}
          >
            {marking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                标记为已录用
              </>
            )}
          </Button>
        )}
        <Link href="/reports">
          <Button variant="outline" size="lg">
            查看所有报告
          </Button>
        </Link>
      </div>
    </div>
  );
}
