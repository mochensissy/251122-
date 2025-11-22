import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '教练伙伴 - AI 教练助手',
  description: '基于 ICF 标准的智能教练对话系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}
