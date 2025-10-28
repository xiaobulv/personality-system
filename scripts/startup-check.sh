#!/bin/bash

echo "🚀 感理识人系统 - 启动检查"
echo "================================"

# 检查环境变量
echo ""
echo "📋 检查环境变量..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL 未设置"
  exit 1
else
  echo "✅ DATABASE_URL 已设置"
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "⚠️  OPENAI_API_KEY 未设置 (AI分析功能将无法使用)"
else
  echo "✅ OPENAI_API_KEY 已设置"
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "⚠️  AUTH_SECRET 未设置 (建议设置)"
else
  echo "✅ AUTH_SECRET 已设置"
fi

# 检查数据库连接
echo ""
echo "🔍 检查数据库连接..."
pnpm tsx scripts/init-db.ts

# 检查依赖
echo ""
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
  echo "❌ node_modules 不存在，请运行: pnpm install"
  exit 1
else
  echo "✅ 依赖已安装"
fi

echo ""
echo "================================"
echo "✅ 启动检查完成！"
echo ""
echo "运行以下命令启动开发服务器:"
echo "  pnpm dev"
echo ""
