#!/bin/bash

echo "🚀 教练伙伴 - 环境检查"
echo "========================"
echo ""

# 检查 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js 未安装。请先安装 Node.js 18 或更高版本。"
    exit 1
fi

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm 未安装"
    exit 1
fi

# 检查 .env.local 文件
if [ -f ".env.local" ]; then
    echo "✅ .env.local 文件存在"

    # 检查 API Key
    if grep -q "ANTHROPIC_API_KEY=\"sk-ant-" .env.local; then
        echo "✅ Claude API Key 已配置"
    else
        echo "⚠️  Claude API Key 未配置或格式错误"
        echo "   请在 .env.local 中设置 ANTHROPIC_API_KEY"
    fi
else
    echo "❌ .env.local 文件不存在"
    echo "   请复制 .env.example 为 .env.local 并填入你的配置"
    exit 1
fi

# 检查 node_modules
if [ -d "node_modules" ]; then
    echo "✅ 依赖已安装"
else
    echo "⚠️  依赖未安装，正在安装..."
    npm install
fi

# 检查 Prisma Client
if [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma Client 已生成"
else
    echo "⚠️  Prisma Client 未生成，正在生成..."
    npx prisma generate
fi

# 检查数据库
if [ -f "prisma/dev.db" ]; then
    echo "✅ 数据库已创建"
else
    echo "⚠️  数据库未创建，正在创建..."
    npx prisma db push
fi

echo ""
echo "========================"
echo "✨ 环境检查完成！"
echo ""
echo "运行以下命令启动开发服务器："
echo "  npm run dev"
echo ""
echo "然后访问: http://localhost:3000"
echo ""
