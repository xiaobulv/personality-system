# 感理识人系统 - 团队部署版

基于"感理分化说"理论的AI人格分析系统，帮助企业快速识别候选人特质，优化招聘决策。

## 🎯 核心功能

- **快速分析**：上传简历或粘贴文本，30秒内生成完整人格分析报告
- **人格分类**：基于感理分化说，识别感理型/理感型/理理型/感感型四种人格
- **风险预警**：自动识别高风险候选人，提供管理建议
- **岗位匹配**：评估候选人与岗位的契合度，给出匹配分数
- **协作说明书**：生成个性化的沟通、激励和管理建议
- **团队图谱**：可视化团队人格结构分布

## 🛠️ 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: NextAuth.js
- **AI**: OpenAI SDK (支持OpenRouter/DeepSeek等)

## 📦 快速开始

### 1. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 2. 配置环境变量

复制 \`.env.example\` 为 \`.env\`，并填写以下必需配置：

\`\`\`env
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/personality_system"

# AI服务 (OpenRouter)
OPENAI_API_KEY="your_openrouter_api_key"
OPENAI_BASE_URL="https://openrouter.ai/api/v1"

# NextAuth
AUTH_SECRET="your_secret_key"
AUTH_URL="http://localhost:3000/api/auth"
\`\`\`

### 3. 初始化数据库

\`\`\`bash
# 生成数据库迁移
pnpm db:generate

# 应用迁移到数据库
pnpm db:push
\`\`\`

### 4. 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

访问 http://localhost:3000

## 📊 数据库结构

### 核心表

- **tenants** - 租户表（多租户支持）
- **users** - 用户表
- **subscriptions** - 订阅表（套餐管理）
- **candidates** - 候选人表
- **reports** - 分析报告表
- **analysis_tasks** - 分析任务队列表
- **team_members** - 团队成员表

## 🔑 AI分析流程

系统采用三阶段AI分析流程：

1. **提取人格线索**：从文本中提取思维模式、沟通风格、责任心等线索
2. **人格类型判断**：基于感理分化说理论，判断人格类型并评分
3. **生成完整报告**：结合岗位需求，生成风险评估和管理建议

## 🎨 页面结构

- `/dashboard` - 首页仪表盘
- `/tasks/create` - 新建分析任务
- `/reports/[uuid]` - 报告详情页
- `/reports` - 历史记录列表
- `/team-map` - 团队人格图谱
- `/settings` - 系统设置

## 🚀 部署

### Docker部署

\`\`\`bash
# 构建镜像
docker build -t personality-system .

# 运行容器
docker run -p 3000:3000 --env-file .env personality-system
\`\`\`

### Vercel部署

\`\`\`bash
vercel --prod
\`\`\`

## 📝 开发规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- Commit 信息遵循 Conventional Commits

## 🔐 多租户隔离

系统支持多租户SaaS模式：

- 每个注册用户自动创建独立租户空间
- 所有数据通过 \`tenant_id\` 字段隔离
- 支持团队协作，可邀请成员加入

## 💳 套餐体系

- **免费版**：3次分析/月
- **基础版**：30次分析/月 (¥299)
- **专业版**：100次分析/月 (¥899)
- **企业版**：500次分析/月 (¥2999)

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**基于 [ShipAny Template](https://shipany.ai) 构建**
