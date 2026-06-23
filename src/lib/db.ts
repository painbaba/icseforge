import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getPrismaClient = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  const isValidUrl = url && (
    url.startsWith('libsql://') || 
    url.startsWith('https://') || 
    url.startsWith('http://') || 
    url.startsWith('file:')
  );

  if (isValidUrl && token && token !== 'undefined' && token !== 'null') {
    try {
      const adapter = new PrismaLibSql({
        url,
        authToken: token,
      })
      return new PrismaClient({
        adapter,
      })
    } catch (e) {
      console.error('Failed to initialize Prisma with Turso/Libsql adapter:', e)
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['error', 'warn']
  })
}

export const db = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db