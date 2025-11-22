# 快速开始指南

## 前置要求

- Node.js 18.0 或更高版本
- npm 或 yarn
- Claude API Key（从 [Anthropic Console](https://console.anthropic.com/) 获取）

## 步骤 1：配置环境变量

1. 复制环境变量模板：
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. 编辑 \`.env.local\` 文件，填入你的 Claude API Key：
   \`\`\`env
   ANTHROPIC_API_KEY="sk-ant-your-actual-api-key-here"
   \`\`\`

## 步骤 2：自动化设置

运行自动设置脚本（推荐）：

\`\`\`bash
./setup.sh
\`\`\`

这个脚本会自动：
- 检查 Node.js 和 npm
- 安装依赖
- 生成 Prisma Client
- 创建数据库

## 或者：手动设置

如果自动脚本无法运行，可以手动执行：

\`\`\`bash
# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 创建数据库
npx prisma db push
\`\`\`

## 步骤 3：启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

服务器启动后，访问：[http://localhost:3000](http://localhost:3000)

## 首次使用

1. **完成画像采集**：首次访问会引导你完成用户画像问卷（5个步骤）
2. **选择场景**：在仪表盘选择"工作难题"或"职业发展"
3. **开始对话**：与 AI 教练进行结构化对话
4. **生成报告**：对话结束后可生成总结报告

## 常见问题

### Q: Claude API 报错 "Invalid API Key"
**A:** 请检查 \`.env.local\` 中的 API Key 是否正确，确保以 \`sk-ant-\` 开头

### Q: 数据库文件在哪里？
**A:** 开发环境使用 SQLite，数据库文件位于 \`prisma/dev.db\`

### Q: 如何重置数据？
**A:** 删除 \`prisma/dev.db\` 文件，然后重新运行 \`npx prisma db push\`

### Q: 如何查看 Claude API 使用情况？
**A:** 访问 [Anthropic Console](https://console.anthropic.com/) 查看 API 使用统计

## 开发命令

- \`npm run dev\` - 启动开发服务器
- \`npm run build\` - 构建生产版本
- \`npm start\` - 启动生产服务器
- \`npm run lint\` - 运行 ESLint
- \`npx prisma studio\` - 打开 Prisma Studio 查看数据库

## 下一步

- 阅读完整的 [README.md](README.md) 了解项目详情
- 查看 [文档](coaching_agent_prompt.md) 了解产品设计
- 探索 \`src/app/api/\` 了解 API 实现

---

**祝你使用愉快！** 🎉
