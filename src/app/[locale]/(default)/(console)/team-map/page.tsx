"use client";

/**
 * 团队人格图谱页面
 */

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Home, Users } from "lucide-react";
import { toast } from "sonner";

interface TeamStats {
  total_candidates: number;
  hired_count: number;
  personality_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  avg_maturity_score: number;
  avg_match_score: number;
}

export default function TeamMapPage() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载团队统计
  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team/stats");
      const data = await res.json();

      if (data.code === 200) {
        setStats(data.data);
      } else {
        toast.error(data.message || "加载失败");
      }
    } catch (error) {
      console.error("加载团队统计失败:", error);
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 计算百分比
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // 人格类型颜色
  const getPersonalityColor = (type: string) => {
    const colors: Record<string, string> = {
      感理型: "bg-blue-500",
      理感型: "bg-green-500",
      理理型: "bg-purple-500",
      感感型: "bg-orange-500",
    };
    return colors[type] || "bg-gray-500";
  };

  // 风险等级颜色
  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return colors[level] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">暂无数据</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🌐 团队人格图谱</h1>
          <p className="text-muted-foreground mt-1">
            可视化展示团队人格结构分布
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <Home className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </Link>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总候选人数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_candidates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已录用人数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.hired_count}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均成熟度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.avg_maturity_score.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均匹配度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.avg_match_score.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 人格类型分布 */}
      <Card>
        <CardHeader>
          <CardTitle>人格类型分布</CardTitle>
          <CardDescription>
            基于"感理分化说"理论的四种人格类型分布情况
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.personality_distribution).map(
            ([type, count]) => {
              const percentage = getPercentage(count, stats.total_candidates);
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getPersonalityColor(
                          type
                        )}`}
                      />
                      <span className="font-medium">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {count} 人
                      </span>
                      <Badge variant="secondary">{percentage}%</Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            }
          )}
        </CardContent>
      </Card>

      {/* 风险等级分布 */}
      <Card>
        <CardHeader>
          <CardTitle>风险等级分布</CardTitle>
          <CardDescription>候选人风险评估结果统计</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.risk_distribution).map(([level, count]) => {
            const percentage = getPercentage(count, stats.total_candidates);
            const labels: Record<string, string> = {
              high: "高风险",
              medium: "中风险",
              low: "低风险",
            };
            return (
              <div key={level}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getRiskColor(level)}`}
                    />
                    <span className="font-medium">{labels[level]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {count} 人
                    </span>
                    <Badge variant="secondary">{percentage}%</Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 人格类型说明 */}
      <Card>
        <CardHeader>
          <CardTitle>人格类型说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-bold">感理型</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                情感表达丰富，但行为结构化。适合需要情感沟通但有明确流程的岗位。
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <h3 className="font-bold">理感型</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                表达克制，但行为灵活。适合需要理性分析和灵活应对的岗位。
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <h3 className="font-bold">理理型</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                表达克制，行为结构化。适合需要严谨执行和规范操作的岗位。
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <h3 className="font-bold">感感型</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                情感表达丰富，行为灵活。适合需要创意和人际互动的岗位。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Link href="/tasks/create">
          <Button>
            <Users className="mr-2 h-4 w-4" />
            新建判断任务
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline">查看历史记录</Button>
        </Link>
      </div>
    </div>
  );
}
