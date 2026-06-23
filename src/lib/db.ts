import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getPrismaClient = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (url && url !== 'undefined' && token && token !== 'undefined') {
    const adapter = new PrismaLibSql({
      url,
      authToken: token,
    })
    return new PrismaClient({
      adapter,
    })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['error', 'warn']
  })
}

export const db = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db