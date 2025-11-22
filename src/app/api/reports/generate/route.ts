import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deepseek } from '@/lib/deepseek'

const SUMMARY_REPORT_PROMPT = `
基于以下教练对话记录，生成一份结构化的总结报告。

对话记录：
{conversation_history}

请以 JSON 格式输出，包含以下字段：
{
  "topic": "本次教练议题（一句话概括）",
  "insights": [
    "关键观察1（第一人称，用户的语气）",
    "关键观察2",
    "关键观察3"
  ],
  "action_plans": [
    {
      "when": "时间点",
      "what": "具体行动",
      "specific": "详细说明"
    }
  ],
  "commitment": "用户的承诺与奖赏（如果对话中有提到）"
}

要求：
1. insights 必须是用户在对话中的真实观察，使用第一人称
2. action_plans 必须符合 SMART 原则
3. 如果用户没有明确承诺，commitment 字段留空
4. 保持简洁、可行动
5. 只输出 JSON，不要有其他文字
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

    // 检查是否已经生成过报告
    const existingReport = await prisma.summaryReport.findUnique({
      where: { sessionId: session.id },
    })

    if (existingReport) {
      return NextResponse.json({
        success: true,
        report: {
          id: existingReport.id,
          topic: existingReport.topic,
          insights: JSON.parse(existingReport.insights),
          actionPlans: JSON.parse(existingReport.actionPlans),
          commitment: existingReport.commitment,
          generatedAt: existingReport.generatedAt,
        },
      })
    }

    // 构建对话历史字符串
    const conversationHistory = session.messages
      .map(msg => `${msg.role === 'user' ? '用户' : 'AI教练'}: ${msg.content}`)
      .join('\n\n')

    // 调用 Deepseek 生成报告
    const response = await deepseek.chat({
      model: 'deepseek-chat',
      max_tokens: 2048,
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
      throw new Error('Failed to parse report data')
    }

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
