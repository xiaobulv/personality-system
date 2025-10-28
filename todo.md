# 感理识人系统 - TODO

## Phase 1: 数据库Schema迁移
- [x] 创建tenants表（租户）
- [x] 创建subscriptions表（订阅）
- [x] 创建candidates表（候选人）
- [x] 创建reports表（分析报告）
- [x] 创建analysis_tasks表（任务队列）
- [x] 创建team_members表（团队成员）
- [x] 创建quota_logs表（次数日志）
- [x] 扩展users表（添加tenant_id, phone等字段）

## Phase 2: 业务逻辑层
- [x] 创建AI分析服务（三阶段分析）
- [x] 创建租户管理服务
- [x] 创建候选人管理服务
- [x] 创建报告管理服务

## Phase 3: tRPC API路由
- [x] tasks.create - 创建分析任务
- [x] reports.getById - 获取报告详情
- [x] reports.list - 获取报告列表
- [x] reports.markHired - 标记已录用
- [x] reports.delete - 删除报告
- [x] team.stats - 获取团队统计

## Phase 4: 前端页面
- [x] Dashboard首页（剩余次数、高风险预警、团队分布）
- [x] 创建任务页面（候选人信息表单、文本输入）
- [x] 报告详情页（完整报告展示、标记已录用）
- [x] 历史记录列表页（搜索筛选、分页）
- [x] 团队图谱页（人格分布、风险统计）

## Phase 5: 用户注册流程
- [x] 注册时自动创建租户
- [x] 初始化免费订阅（3次）
- [x] 配置次数管理

## Phase 6: 环境变量配置
- [x] 配置OpenRouter API Key
- [x] 配置DeepSeek模型
- [x] 配置数据库连接

## Phase 7: 测试和优化
- [x] 测试完整分析流程
- [x] 测试所有页面功能
- [x] 优化加载状态
- [x] 优化错误处理

## Phase 8: 部署上线
- [x] 推送数据库Schema
- [x] 创建检查点
- [x] 发布到线上
