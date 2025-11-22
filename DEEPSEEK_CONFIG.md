# Deepseek API 配置完成

## ✅ 已完成的配置

### 1. 添加了 Deepseek 客户端
- 创建了 [src/lib/deepseek.ts](src/lib/deepseek.ts)
- 实现了流式对话和非流式请求
- 按照 Deepseek 官方文档的多轮对话格式

### 2. 更新了环境变量
- `.env.local` 中添加了 `DEEPSEEK_API_KEY`
- 你的 API Key 已配置：`sk-d1878ae2ae404464ac795269c5157d00`

### 3. 修改了 API 路由
- `/api/coaching/chat` - 使用 Deepseek 进行流式对话
- `/api/reports/generate` - 使用 Deepseek 生成报告
- 实现了完整的多轮对话历史传递

## 🚀 当前状态

**服务器已启动**: http://localhost:3000 ✅

你现在可以：
1. 访问 http://localhost:3000
2. 完成用户画像采集
3. 开始与 Deepseek 进行教练对话
4. 生成总结报告

## 💰 成本优势

使用 Deepseek API 的成本优势：
- **Deepseek-chat**: ¥0.001/1K tokens (输入) + ¥0.002/1K tokens (输出)
- 比 Claude 3.5 Sonnet 便宜约 **10-15 倍**

一次完整对话（约 5000 tokens）的成本：
- Deepseek: 约 ¥0.01 元
- Claude: 约 ¥0.15 元

## 📝 Deepseek API 特点

### 支持的功能
- ✅ 多轮对话（System + User + Assistant 格式）
- ✅ 流式响应（SSE）
- ✅ 温度参数控制（0-2）
- ✅ max_tokens 限制

### 与 Claude 的主要区别
1. **消息格式**:
   - Deepseek: 单独的 `system` 消息
   - Claude: `system` 参数

2. **流式响应格式**:
   - Deepseek: `data: {"choices":[{"delta":{"content":"文本"}}]}`
   - Claude: 自定义流式格式

3. **多轮对话**:
   - Deepseek: 直接在 messages 数组中传递所有历史
   - Claude: 需要 messages 数组

## 🔧 如何切换回 Claude

如果以后想切换回 Claude API，只需：

1. 在 `.env.local` 中配置 Claude API Key:
   ```
   ANTHROPIC_API_KEY="sk-ant-your-key-here"
   ```

2. 修改 API 路由引入:
   ```typescript
   // 从
   import { deepseek } from '@/lib/deepseek'

   // 改为
   import { anthropic } from '@/lib/claude'
   ```

3. 修改 API 调用代码（已经在原 claude.ts 中）

## 📖 Deepseek 官方文档

- API 文档: https://api-docs.deepseek.com/zh-cn/
- 多轮对话: https://api-docs.deepseek.com/zh-cn/guides/multi_round_chat
- 定价: https://platform.deepseek.com/api-docs/zh-cn/pricing/

## 🎯 下一步

现在可以开始测试对话功能了：

1. 打开浏览器访问 http://localhost:3000
2. 完成用户画像采集（5步）
3. 选择一个场景（工作难题/职业发展）
4. 开始与 AI 教练对话
5. 观察 Deepseek 的响应质量

如果遇到任何问题，可以：
- 查看浏览器控制台的错误信息
- 查看服务器终端的日志输出
- 检查 Network 标签查看 API 请求详情

祝测试顺利！🎉
