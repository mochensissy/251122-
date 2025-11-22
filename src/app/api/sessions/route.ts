import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, scenario } = body

    if (!username || !scenario) {
      return NextResponse.json(
        { error: '用户名和场景是必填项' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在，请先完成画像采集' },
        { status: 404 }
      )
    }

    // 创建新会话
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        scenario,
        status: 'in_progress',
        currentPhase: 'goal',
      },
    })

    // 记录分析日志
    await prisma.analyticsLog.create({
      data: {
        eventType: 'session_start',
        scenario,
        phase: 'goal',
        metadata: JSON.stringify({
          roleType: user.role,
          businessLine: user.businessLine,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        scenario: session.scenario,
        currentPhase: session.currentPhase,
      },
    })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: '创建会话失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: '用户名是必填项' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          include: {
            summaryReport: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sessions: user.sessions,
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: '获取会话列表失败' },
      { status: 500 }
    )
  }
}
