import { Redis } from '@upstash/redis'

// Singleton Redis client — works on Vercel serverless via HTTP (not TCP)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache TTL constants (seconds)
export const TTL = {
  SESSION: 30,        // session detail — short TTL so votes feel live
  NOTIFICATIONS: 60, // notifications — less critical to be instant
} as const

export function sessionKey(sessionId: string): string {
  return `session:${sessionId}`
}

export function notificationsKey(userId: string): string {
  return `notifications:${userId}`
}
