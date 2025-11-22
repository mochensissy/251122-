'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store'

export default function Home() {
  const router = useRouter()
  const { username } = useUserStore()

  useEffect(() => {
    if (username) {
      router.push('/dashboard')
    } else {
      router.push('/onboarding')
    }
  }, [username, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  )
}
