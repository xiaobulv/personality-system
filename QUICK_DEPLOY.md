# 感理识人系统 - 快速部署指南

本文档提供最快速的部署方式，让系统在10分钟内上线。

## 🚀 方式一：Docker Compose 部署（推荐）

### 1. 准备服务器

- **最低配置**: 2核4G，20GB硬盘
- **推荐配置**: 4核8G，50GB硬盘
- **操作系统**: Ubuntu 22.04 LTS

### 2. 安装Docker

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 安装Docker Compose
sudo apt install docker-compose -y

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. 克隆项目

```bash
cd /var/www
git clone <repository-url> personality-system
cd personality-system
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑配置（必须修改以下项）
nano .env.production
```

**必须修改的配置：**
- `NEXT_PUBLIC_WEB_URL`: 你的域名
- `DATABASE_URL`: 数据库连接（可以使用docker-compose自带的）
- `OPENAI_API_KEY`: OpenRouter API Key
- `AUTH_SECRET`: 随机32位字符串

### 5. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 等待服务启动（约30秒）
```

### 6. 初始化数据库

```bash
# 进入应用容器
docker-compose exec app sh

# 运行数据库迁移
pnpm db:push

# 退出容器
exit
```

### 7. 访问系统

打开浏览器访问: http://your-server-ip:3000

**默认端口：**
- 应用: 3000
- 数据库: 5432
- Nginx: 80/443（如果启用）

---

## 🌐 方式二：Vercel 部署（最简单）

### 1. 准备数据库

在 [Supabase](https://supabase.com) 或 [Neon](https://neon.tech) 创建PostgreSQL数据库。

### 2. 部署到Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署
vercel --prod
```

### 3. 配置环境变量

在Vercel Dashboard中设置以下环境变量：

```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-or-v1-...
AUTH_SECRET=your-secret-key
AUTH_URL=https://your-app.vercel.app/api/auth
NEXT_PUBLIC_WEB_URL=https://your-app.vercel.app
```

### 4. 初始化数据库

```bash
# 本地运行迁移
pnpm db:push
```

---

## 🖥️ 方式三：传统VPS部署

### 1. 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 安装pnpm
npm install -g pnpm

# 安装PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装PM2
npm install -g pm2
```

### 2. 配置PostgreSQL

```bash
# 切换到postgres用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE personality_system;
CREATE USER app_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE personality_system TO app_user;
\q
```

### 3. 部署应用

```bash
# 克隆代码
cd /var/www
git clone <repository-url> personality-system
cd personality-system

# 安装依赖
pnpm install

# 配置环境变量
cp .env.production.example .env.production
nano .env.production

# 初始化数据库
pnpm db:push

# 构建应用
pnpm build

# 使用PM2启动
pm2 start pnpm --name personality-system -- start
pm2 save
pm2 startup
```

### 4. 配置Nginx

```bash
# 安装Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/personality-system
```

粘贴以下配置：

```nginx
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
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/personality-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. 配置SSL（Let's Encrypt）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## ✅ 部署检查清单

部署完成后，检查以下项目：

- [ ] 应用可以正常访问
- [ ] 可以注册/登录
- [ ] 可以创建分析任务
- [ ] AI分析功能正常
- [ ] 数据库连接正常
- [ ] 环境变量配置正确
- [ ] SSL证书配置（生产环境）
- [ ] 日志正常输出

## 🐛 常见问题

### 1. 数据库连接失败

**原因**: DATABASE_URL配置错误或数据库未启动

**解决**:
```bash
# 检查数据库状态
sudo systemctl status postgresql

# 测试连接
psql $DATABASE_URL
```

### 2. AI分析失败

**原因**: OPENAI_API_KEY未配置或无效

**解决**:
- 检查环境变量是否正确
- 访问 https://openrouter.ai 检查API Key
- 查看应用日志确认错误信息

### 3. 页面404

**原因**: 路由配置错误或构建失败

**解决**:
```bash
# 重新构建
pnpm build

# 重启服务
pm2 restart personality-system
```

### 4. 端口被占用

**原因**: 3000端口已被其他服务使用

**解决**:
```bash
# 查看端口占用
sudo lsof -i :3000

# 修改端口（在.env中）
PORT=3001
```

## 📞 获取帮助

如遇到问题：

1. 查看日志: `docker-compose logs -f` 或 `pm2 logs`
2. 查看文档: `README.md` 和 `DEPLOYMENT.md`
3. 提交Issue: GitHub Issues
4. 联系支持: support@example.com

---

**部署完成！** 🎉

访问你的域名开始使用感理识人系统。
