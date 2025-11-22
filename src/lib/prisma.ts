import { PrismaClient } from '@prisma/client'

const ensureDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const fallbackUrl = 'file:./dev.db'
  console.warn(
    '[prisma] DATABASE_URL not set, falling back to local prisma/dev.db (SQLite)'
  )
  process.env.DATABASE_URL = fallbackUrl
  return fallbackUrl
}

ensureDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
