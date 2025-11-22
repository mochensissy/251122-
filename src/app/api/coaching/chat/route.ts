import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deepseek, COACHING_SYSTEM_PROMPT, SCENARIO_PROMPTS } from '@/lib/deepseek'
import type { Scenario, DeepseekMessage } from '@/lib/deepseek'

// 使用 Node runtime 因为 Prisma 在 Edge 不支持
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, username } = body

    if (!sessionId || !message || !username) {
      return new Response(
        JSON.stringify({ error: '缺少必填参数' }),
        { status: 400 }
      )
    }

    // 获取会话信息
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      return new Response(
        JSON.stringify({ error: '会话不存在' }),
        { status: 404 }
      )
    }

    // 保存用户消息
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message,
        phase: session.currentPhase,
      },
    })

    // 更新会话消息计数
    await prisma.session.update({
      where: { id: session.id },
      data: { messageCount: { increment: 1 } },
    })

    // 构建用户画像字符串
    const userProfile = `
角色：${session.user.role || '未设置'}
业务线：${session.user.businessLine || '未设置'}
工作风格：${session.user.workStyle || '未设置'}
发展目标：${session.user.developmentGoal || '未设置'}
工作挑战：${session.user.workChallenge || '未设置'}
    `.trim()

    // 构建系统提示词
    const systemPrompt = COACHING_SYSTEM_PROMPT
      .replace('{current_phase}', session.currentPhase || 'goal')
      .replace('{user_profile}', userProfile) +
      '\n\n' +
      SCENARIO_PROMPTS[session.scenario as Scenario]

    // 构建 Deepseek 消息格式（多轮对话）
    const messages: DeepseekMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ]

    // 添加历史对话
    for (const msg of session.messages) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: message,
    })

    // 调用 Deepseek API（流式响应）
    const response = await deepseek.chatStream({
      model: 'deepseek-chat',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    })

    // 创建流式响应
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let fullResponse = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response body')
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content

                  if (content) {
                    fullResponse += content
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
                    )
                  }
                } catch (e) {
                  // 忽略解析错误
                  console.error('Parse error:', e)
                }
              }
            }
          }

          // 保存 AI 响应到数据库
          await prisma.message.create({
            data: {
              sessionId: session.id,
              role: 'assistant',
              content: fullResponse,
              phase: session.currentPhase,
            },
          })

          // 更新会话消息计数
          await prisma.session.update({
            where: { id: session.id },
            data: { messageCount: { increment: 1 } },
          })

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ error: '对话失败: ' + (error as Error).message }),
      { status: 500 }
    )
  }
}
