'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Calendar, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

interface ActionPlan {
  when: string
  what: string
  specific: string
}

interface Report {
  id: number
  topic: string
  insights: string[]
  actionPlans: ActionPlan[]
  commitment: string | null
  generatedAt: string
  sessionDuration?: number
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportId, setReportId] = useState<string>('')

  useEffect(() => {
    params.then(p => setReportId(p.id))
  }, [params])

  useEffect(() => {
    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  const fetchReport = async () => {
    try {
      // 这里应该调用 API 获取报告
      // 为简化演示，使用模拟数据
      setTimeout(() => {
        setReport({
          id: parseInt(reportId),
          topic: '项目延期问题突破',
          insights: [
            '我发现我总是在回避和 A 的沟通,这是导致误解的主要原因',
            '我其实有能力推动这件事,只是一直在等待"完美时机"',
            '团队成员可能比我想象的更愿意帮助',
          ],
          actionPlans: [
            {
              when: '明天下午 3 点前',
              what: '主动约 A 进行 15 分钟沟通',
              specific: '澄清关于需求优先级的误解',
            },
            {
              when: '本周五前',
              what: '完成项目风险评估文档',
              specific: '列出 Top 3 风险和应对方案',
            },
          ],
          commitment: '完成后,我将在周末去看一部期待已久的电影',
          generatedAt: new Date().toISOString(),
          sessionDuration: 25,
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch report:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载报告中...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">报告不存在</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-primary-600 hover:underline"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Download className="w-5 h-5" />
              下载 PDF
            </button>
          </div>
        </div>
      </div>

      {/* 报告内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 报告头部 */}
          <div className="bg-gradient-to-r from-primary-500 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">教练对话总结报告</h1>
            <div className="flex items-center gap-4 text-primary-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(report.generatedAt), 'yyyy年MM月dd日 HH:mm')}
              </span>
              {report.sessionDuration && (
                <span>对话时长: {report.sessionDuration} 分钟</span>
              )}
            </div>
          </div>

          {/* 报告主体 */}
          <div className="p-8 space-y-8">
            {/* 本次教练议题 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">本次教练议题</h2>
              </div>
              <p className="text-lg text-gray-700 bg-primary-50 p-4 rounded-lg">
                {report.topic}
              </p>
            </section>

            {/* 关键观察与洞察 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  关键观察与洞察
                </h2>
              </div>
              <div className="space-y-3">
                {report.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 下一步行动计划 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  下一步行动计划
                </h2>
              </div>
              <div className="space-y-4">
                {report.actionPlans.map((plan, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-green-500 pl-4 py-2"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{plan.when}</p>
                        <p className="font-medium text-gray-900 mb-1">
                          {plan.what}
                        </p>
                        <p className="text-sm text-gray-600">{plan.specific}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 承诺与奖赏 */}
            {report.commitment && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    承诺与奖赏
                  </h2>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <p className="text-gray-700 text-center italic">
                    "{report.commitment}"
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* 报告底部 */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              本报告由 AI 教练伙伴生成 · 所有内容仅你可见 · 祝你顺利达成目标!
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            返回首页
          </button>
          <button
            onClick={() => router.push(`/chat/${report.id}`)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            查看完整对话
          </button>
        </div>
      </div>
    </div>
  )
}
