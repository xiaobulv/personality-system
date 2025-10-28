"use client";

/**
 * 新建判断任务页面
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    inputText: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.position) {
      toast.error("请填写候选人姓名和应聘岗位");
      return;
    }

    if (!formData.inputText) {
      toast.error("请提供候选人的文本信息");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.code === 200) {
        toast.success("分析完成！");
        router.push(`/reports/${data.data.reportUuid}`);
      } else {
        toast.error(data.message || "创建失败");
      }
    } catch (error) {
      console.error("提交失败:", error);
      toast.error("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">➕ 新建判断任务</h1>
        <p className="text-muted-foreground mt-1">
          填写候选人信息，提交分析任务
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>候选人信息</CardTitle>
            <CardDescription>
              请填写候选人的基本信息和相关材料
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 候选人姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                🧾 候选人姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="请输入候选人姓名"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* 应聘岗位 */}
            <div className="space-y-2">
              <Label htmlFor="position">
                🧑‍💼 应聘岗位 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="position"
                placeholder="例如：运营主管、销售专员、客服等"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                required
              />
            </div>

            {/* 文本输入 */}
            <div className="space-y-2">
              <Label htmlFor="inputText">
                📎 候选人材料 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="inputText"
                placeholder="请粘贴候选人的简历、面试记录、聊天记录等文本信息..."
                value={formData.inputText}
                onChange={(e) =>
                  setFormData({ ...formData, inputText: e.target.value })
                }
                rows={12}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                支持粘贴微信聊天记录、面试笔记、个人自述等任何文本内容
              </p>
            </div>

            {/* 提示信息 */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>提示：</strong>
                提供的信息越详细，AI分析结果越准确。建议包含候选人的沟通记录、工作经历描述、自我介绍等内容。
              </AlertDescription>
            </Alert>

            {/* 提交按钮 */}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在分析中...
                  </>
                ) : (
                  "提交分析"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                disabled={loading}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* 分析说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">分析流程说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. 提交后，AI将自动提取候选人的人格特质线索</p>
          <p>2. 基于"感理分化说"模型进行人格类型判断</p>
          <p>3. 生成完整的分析报告，包括风险评估和管理建议</p>
          <p className="text-xs mt-4">
            ⏱️ 分析过程通常需要20-30秒，请耐心等待
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
