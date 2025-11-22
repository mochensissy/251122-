import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deepseek } from '@/lib/deepseek'

const SUMMARY_REPORT_PROMPT = `
你是一个报告分析助手。你的任务是从教练对话记录中提取信息，绝不编造。

## 第一步：阅读对话记录

{conversation_history}

## 第二步：严格提取信息

按照以下规则提取，如果对话中没有明确内容，宁可留空，绝不编造：

1. **topic（议题）**
   - 必须是用户在对话开头明确描述的问题
   - 用用户的原话或直接提炼，不要美化或概括
   - 示例：✅ "和同事沟通困难" / ❌ "提升人际沟通能力"（太宽泛）

2. **insights（洞察）**
   - 只能写用户明确说出的洞察，例如："我意识到..."、"我发现..."、"原来是..."
   - 必须使用第一人称（"我..."）
   - 如果用户没有明确表达洞察，返回空数组 []
   - 示例：
     * ✅ "我意识到问题的根源是我害怕冲突"（用户在对话中说的）
     * ❌ "我需要提升沟通能力"（用户没说过，是你猜的）

3. **action_plans（行动计划）**
   - 只能写用户说"我打算..."、"我要..."、"我会..."的具体行动
   - 必须包含用户承诺的时间和具体做法
   - 如果用户没有明确行动计划，返回空数组 []
   - 示例：
     * ✅ {"when": "下周一", "what": "和主管约1对1谈话", "specific": "提前准备3个问题"}（用户说的）
     * ❌ {"what": "每周阅读一本书"}（用户没说要做这个）

4. **commitment（承诺与奖赏）**
   - 只写用户说会如何庆祝或奖励自己
   - 如果对话中未涉及，填 null

## 第三步：自查（重要！）

生成JSON前，逐条问自己：
- 这句话是用户在对话中说的，还是我推测的？
- 如果找不到用户的原话支持，删除它！
- 宁可内容少，也不能编造！

## 第四步：输出JSON

{
  "topic": "从对话开头提取的议题",
  "insights": ["用户实际说的洞察1", "用户实际说的洞察2"],
  "action_plans": [
    {
      "when": "用户承诺的时间",
      "what": "用户决定的行动",
      "specific": "用户描述的细节"
    }
  ],
  "commitment": "用户提到的庆祝方式或null"
}

只输出JSON，不要有任何解释或其他文字。
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: '会话 ID 是必填项' },
        { status: 400 }
      )
    }

    // 获取完整对话记录
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      )
    }

    // 检查是否已经生成过报告，如果有则删除旧报告（确保每次都生成最新内容）
    const existingReport = await prisma.summaryReport.findUnique({
      where: { sessionId: session.id },
    })

    if (existingReport) {
      console.log('检测到旧报告，删除后重新生成。旧报告ID:', existingReport.id)
      await prisma.summaryReport.delete({
        where: { id: existingReport.id },
      })
    }

    // 构建对话历史字符串
    const conversationHistory = session.messages
      .map(msg => `${msg.role === 'user' ? '用户' : 'AI教练'}: ${msg.content}`)
      .join('\n\n')

    // 调试日志
    console.log('=== 报告生成调试信息 ===')
    console.log('会话ID:', sessionId)
    console.log('消息数量:', session.messages.length)
    console.log('对话历史前500字符:', conversationHistory.substring(0, 500))
    console.log('对话历史总长度:', conversationHistory.length, '字符')
    console.log('\n=== 完整对话历史 ===')
    console.log(conversationHistory)
    console.log('=== 对话历史结束 ===\n')
    console.log('========================')

    // 调用 Deepseek 生成报告
    const response = await deepseek.chat({
      model: 'deepseek-chat',
      max_tokens: 2048,
      temperature: 0.1,  // 极低temperature，确保严格基于对话内容，避免编造
      messages: [{
        role: 'user',
        content: SUMMARY_REPORT_PROMPT.replace('{conversation_history}', conversationHistory),
      }],
    })

    // 提取 JSON 响应
    const result = await response.json()
    const content = result.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Invalid response from Deepseek')
    }

    console.log('\n=== AI 原始响应 ===')
    console.log(content)
    console.log('=== AI 响应结束 ===\n')

    // 解析 JSON
    let reportData
    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[0])
      } else {
        reportData = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('无法解析的内容:', content)
      throw new Error('Failed to parse report data')
    }

    console.log('\n=== 解析后的报告数据 ===')
    console.log(JSON.stringify(reportData, null, 2))
    console.log('=== 报告数据结束 ===\n')

    // 保存报告到数据库
    const report = await prisma.summaryReport.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        topic: reportData.topic,
        insights: JSON.stringify(reportData.insights),
        actionPlans: JSON.stringify(reportData.action_plans),
        commitment: reportData.commitment || null,
      },
    })

    // 更新会话状态
    await prisma.session.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        endedAt: new Date(),
        durationMinutes: Math.round(
          (Date.now() - session.startedAt.getTime()) / (1000 * 60)
        ),
      },
    })

    // 记录分析日志
    await prisma.analyticsLog.create({
      data: {
        eventType: 'report_generated',
        scenario: session.scenario,
        phase: session.currentPhase,
        durationSeconds: Math.round(
          (Date.now() - session.startedAt.getTime()) / 1000
        ),
      },
    })

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        topic: report.topic,
        insights: JSON.parse(report.insights),
        actionPlans: JSON.parse(report.actionPlans),
        commitment: report.commitment,
        generatedAt: report.generatedAt,
      },
    })
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { error: '生成报告失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
