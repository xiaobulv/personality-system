"use client";

/**
 * 历史判断记录页面
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

interface Report {
  report: {
    uuid: string;
    personality_type: string;
    risk_level: string;
    maturity_score: number;
    match_score: number;
    created_at: string;
  };
  candidate: {
    uuid: string;
    name: string;
    position: string;
    is_hired: boolean;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [filterPersonality, setFilterPersonality] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 加载报告列表
  const loadReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (searchName) params.append("searchName", searchName);
      if (filterPosition) params.append("position", filterPosition);
      if (filterRisk) params.append("riskLevel", filterRisk);
      if (filterPersonality) params.append("personalityType", filterPersonality);

      const res = await fetch(`/api/reports/list?${params.toString()}`);
      const data = await res.json();

      if (data.code === 200) {
        setReports(data.data.data);
        setTotal(data.data.total);
      } else {
        toast.error(data.message || "加载失败");
      }
    } catch (error) {
      console.error("加载报告列表失败:", error);
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  // 删除报告
  const handleDelete = async (uuid: string) => {
    if (!confirm("确定要删除这份报告吗？")) return;

    try {
      const res = await fetch(`/api/reports/${uuid}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.code === 200) {
        toast.success("删除成功");
        loadReports();
      } else {
        toast.error(data.message || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("网络错误");
    }
  };

  // 初始加载
  useEffect(() => {
    loadReports();
  }, [page, filterPosition, filterRisk, filterPersonality]);

  // 搜索
  const handleSearch = () => {
    setPage(1);
    loadReports();
  };

  // 风险等级样式
  const getRiskBadge = (level: string) => {
    const variants = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    const labels = {
      high: "高",
      medium: "中",
      low: "低",
    };
    return {
      variant: variants[level as keyof typeof variants] || "secondary",
      label: labels[level as keyof typeof labels] || level,
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📂 历史判断记录</h1>
          <p className="text-muted-foreground mt-1">
            查看和管理所有候选人分析记录
          </p>
        </div>
        <Link href="/tasks/create">
          <Button>新建判断任务</Button>
        </Link>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* 搜索框 */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="搜索候选人姓名..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 岗位筛选 */}
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger>
                <SelectValue placeholder="所有岗位" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">所有岗位</SelectItem>
                <SelectItem value="运营主管">运营主管</SelectItem>
                <SelectItem value="销售专员">销售专员</SelectItem>
                <SelectItem value="客服">客服</SelectItem>
                <SelectItem value="技术">技术</SelectItem>
              </SelectContent>
            </Select>

            {/* 风险等级筛选 */}
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger>
                <SelectValue placeholder="所有风险等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">所有风险等级</SelectItem>
                <SelectItem value="high">高风险</SelectItem>
                <SelectItem value="medium">中风险</SelectItem>
                <SelectItem value="low">低风险</SelectItem>
              </SelectContent>
            </Select>

            {/* 人格类型筛选 */}
            <Select
              value={filterPersonality}
              onValueChange={setFilterPersonality}
            >
              <SelectTrigger>
                <SelectValue placeholder="所有人格类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">所有人格类型</SelectItem>
                <SelectItem value="感理型">感理型</SelectItem>
                <SelectItem value="理感型">理感型</SelectItem>
                <SelectItem value="理理型">理理型</SelectItem>
                <SelectItem value="感感型">感感型</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 报告列表 */}
      <Card>
        <CardHeader>
          <CardTitle>报告列表</CardTitle>
          <CardDescription>共 {total} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无数据
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>候选人姓名</TableHead>
                    <TableHead>岗位</TableHead>
                    <TableHead>人格类型</TableHead>
                    <TableHead>风险等级</TableHead>
                    <TableHead>匹配度</TableHead>
                    <TableHead>录用状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((item) => {
                    const risk = getRiskBadge(item.report.risk_level);
                    return (
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
                          <Badge variant={risk.variant as any}>
                            {risk.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.report.match_score}%</TableCell>
                        <TableCell>
                          {item.candidate?.is_hired ? (
                            <Badge variant="secondary">已录用</Badge>
                          ) : (
                            <Badge variant="outline">待定</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(item.report.created_at).toLocaleDateString(
                            "zh-CN"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/reports/${item.report.uuid}`}>
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.report.uuid)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* 分页 */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  第 {page} 页，共 {Math.ceil(total / 20)} 页
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / 20)}
                    onClick={() => setPage(page + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 批量操作 */}
      <Card>
        <CardHeader>
          <CardTitle>批量操作</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            导出Excel（开发中）
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
