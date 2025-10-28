# 感理识人系统 - 部署指南

本文档提供完整的部署步骤和注意事项。

## 📋 前置要求

### 必需服务
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **PostgreSQL**: >= 14.0
- **OpenRouter API Key**: 用于AI分析服务

### 可选服务
- **Redis**: 用于缓存和队列（推荐）
- **S3/COS**: 用于文件存储
- **Nginx**: 用于反向代理

## 🚀 本地开发部署

### 1. 克隆项目

\`\`\`bash
git clone <repository-url>
cd personality-system
\`\`\`

### 2. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 3. 配置环境变量

复制 \`.env.example\` 为 \`.env\`：

\`\`\`bash
cp .env.example .env
\`\`\`

编辑 \`.env\` 文件，填写以下必需配置：

\`\`\`env
# 数据库连接
DATABASE_URL="postgresql://postgres:password@localhost:5432/personality_system"

# AI服务
OPENAI_API_KEY="sk-or-v1-xxxxx"  # 从 https://openrouter.ai 获取
OPENAI_BASE_URL="https://openrouter.ai/api/v1"

# NextAuth
AUTH_SECRET="$(openssl rand -base64 32)"  # 生成随机密钥
AUTH_URL="http://localhost:3000/api/auth"
\`\`\`

### 4. 初始化数据库

\`\`\`bash
# 生成迁移文件
pnpm db:generate

# 应用到数据库
pnpm db:push

# 查看数据库（可选）
pnpm db:studio
\`\`\`

### 5. 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

访问 http://localhost:3000

## 🐳 Docker 部署

### 1. 构建镜像

\`\`\`bash
docker build -t personality-system:latest .
\`\`\`

### 2. 使用 docker-compose

创建 \`docker-compose.yml\`：

\`\`\`yaml
version: '3.8'

services:
  app:
    image: personality-system:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/personality_system
      - OPENAI_API_KEY=sk-or-v1-xxxxx
      - AUTH_SECRET=your_secret_key
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=personality_system
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
\`\`\`

启动服务：

\`\`\`bash
docker-compose up -d
\`\`\`

## ☁️ 云服务部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

\`\`\`bash
vercel --prod
\`\`\`

### 腾讯云 CVM 部署

#### 1. 服务器准备

\`\`\`bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装 Nginx
sudo apt install -y nginx
\`\`\`

#### 2. 配置 PostgreSQL

\`\`\`bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE personality_system;
CREATE USER app_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE personality_system TO app_user;
\\q
\`\`\`

#### 3. 部署应用

\`\`\`bash
# 克隆代码
cd /var/www
git clone <repository-url> personality-system
cd personality-system

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 构建应用
pnpm build

# 使用 PM2 管理进程
npm install -g pm2
pm2 start pnpm --name personality-system -- start
pm2 save
pm2 startup
\`\`\`

#### 4. 配置 Nginx

创建 \`/etc/nginx/sites-available/personality-system\`：

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

启用配置：

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/personality-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

#### 5. 配置 SSL (Let's Encrypt)

\`\`\`bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
\`\`\`

## 🔧 环境变量说明

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| \`DATABASE_URL\` | PostgreSQL连接字符串 | \`postgresql://user:pass@host:5432/db\` |
| \`OPENAI_API_KEY\` | OpenRouter API密钥 | \`sk-or-v1-xxxxx\` |
| \`AUTH_SECRET\` | NextAuth密钥 | 随机32位字符串 |
| \`AUTH_URL\` | 认证服务URL | \`https://your-domain.com/api/auth\` |

### 可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| \`OPENAI_BASE_URL\` | AI服务地址 | \`https://openrouter.ai/api/v1\` |
| \`STORAGE_ENDPOINT\` | 文件存储端点 | - |
| \`STORAGE_ACCESS_KEY\` | 存储访问密钥 | - |
| \`NEXT_PUBLIC_PROJECT_NAME\` | 产品名称 | \`感理识人系统\` |

## 📊 数据库迁移

### 生成迁移

\`\`\`bash
pnpm db:generate
\`\`\`

### 应用迁移

\`\`\`bash
pnpm db:push
\`\`\`

### 回滚迁移

\`\`\`bash
pnpm db:drop  # 谨慎使用！
\`\`\`

## 🔍 健康检查

访问以下端点检查服务状态：

- \`/api/ping\` - 服务健康检查
- \`/api/team/stats\` - 数据库连接检查（需登录）

## 📝 日志管理

### PM2 日志

\`\`\`bash
# 查看日志
pm2 logs personality-system

# 清空日志
pm2 flush
\`\`\`

### Nginx 日志

\`\`\`bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
\`\`\`

## 🔒 安全建议

1. **使用强密码**: 数据库和认证密钥使用复杂密码
2. **启用 HTTPS**: 生产环境必须使用SSL证书
3. **限制数据库访问**: 仅允许应用服务器访问数据库
4. **定期备份**: 每天自动备份数据库
5. **更新依赖**: 定期更新依赖包修复安全漏洞

## 🔄 更新部署

\`\`\`bash
# 拉取最新代码
git pull origin main

# 安装新依赖
pnpm install

# 应用数据库迁移
pnpm db:push

# 重新构建
pnpm build

# 重启服务
pm2 restart personality-system
\`\`\`

## 🐛 故障排查

### 数据库连接失败

1. 检查 \`DATABASE_URL\` 是否正确
2. 确认 PostgreSQL 服务运行中
3. 检查防火墙规则

### AI分析失败

1. 检查 \`OPENAI_API_KEY\` 是否有效
2. 确认 OpenRouter 账户有余额
3. 查看 API 调用日志

### 页面无法访问

1. 检查 Nginx 配置
2. 确认应用服务运行中
3. 查看应用日志

## 📞 技术支持

如遇到部署问题，请：

1. 查看日志文件
2. 检查环境变量配置
3. 参考 [GitHub Issues](https://github.com/your-repo/issues)
4. 联系技术支持: support@example.com

---

**最后更新**: 2025-10-28
