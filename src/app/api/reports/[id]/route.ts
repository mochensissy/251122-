import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reportId = parseInt(id)

    if (isNaN(reportId)) {
      return NextResponse.json(
        { success: false, error: '无效的报告 ID' },
        { status: 400 }
      )
    }

    const report = await prisma.summaryReport.findUnique({
      where: { id: reportId },
      include: {
        session: true,
      },
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: '报告不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        sessionId: report.sessionId,
        topic: report.topic,
        insights: JSON.parse(report.insights),
        actionPlans: JSON.parse(report.actionPlans),
        commitment: report.commitment,
        generatedAt: report.generatedAt,
        sessionDuration: report.session?.durationMinutes,
      },
    })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { success: false, error: '获取报告失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
