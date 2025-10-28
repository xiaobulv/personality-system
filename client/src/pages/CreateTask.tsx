import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function CreateTask() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: (data) => {
      toast.success("分析任务创建成功！");
      // 跳转到报告详情页
      setLocation(`/reports/${data.reportUuid}`);
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("请输入候选人姓名");
      return;
    }

    if (!sourceText.trim()) {
      toast.error("请输入分析文本");
      return;
    }

    if (sourceText.length < 50) {
      toast.error("分析文本至少需要50个字符");
      return;
    }

    setIsSubmitting(true);

    createTaskMutation.mutate({
      name: name.trim(),
      position: position.trim() || undefined,
      sourceText: sourceText.trim(),
    });
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 页面标题 */}
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">➕ 新建分析任务</h1>
        <p className="text-muted-foreground mt-1">输入候选人信息和相关文本，AI将进行人格分析</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>候选人信息</CardTitle>
            <CardDescription>请填写候选人的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 候选人姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                候选人姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="例如：张三"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* 应聘岗位 */}
            <div className="space-y-2">
              <Label htmlFor="position">应聘岗位（选填）</Label>
              <Input
                id="position"
                placeholder="例如：产品经理"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>分析文本</CardTitle>
            <CardDescription>
              粘贴候选人的简历、聊天记录、面试记录等文本内容（至少50个字符）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceText">
                文本内容 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sourceText"
                placeholder="请粘贴候选人的相关文本内容，例如：&#10;&#10;- 简历内容&#10;- 面试对话记录&#10;- 微信/邮件沟通记录&#10;- 自我介绍&#10;&#10;文本越详细，分析结果越准确。"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                disabled={isSubmitting}
                rows={12}
                className="font-mono text-sm"
                required
              />
              <div className="text-sm text-muted-foreground">
                已输入 {sourceText.length} 个字符 {sourceText.length < 50 && `（至少需要 50 个字符）`}
              </div>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>分析说明：</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>AI将基于"感理分化说"理论进行人格分析</li>
                  <li>分析过程约需30-60秒</li>
                  <li>将生成完整的人格报告和使用建议</li>
                  <li>每次分析将消耗1次配额</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="mt-6 flex gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI分析中...
              </>
            ) : (
              "开始分析"
            )}
          </Button>
          <Link href="/dashboard">
            <Button type="button" variant="outline" size="lg" disabled={isSubmitting}>
              取消
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
