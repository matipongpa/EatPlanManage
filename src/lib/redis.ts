import { Redis } from '@upstash/redis'

// Cache TTL constants (seconds)
export const TTL = {
  SESSION: 30,       // session detail — short so votes feel live
  DASHBOARD: 15,     // dashboard list — very short, invalidated on any change
  NOTIFICATIONS: 60, // notifications — less critical to be instant
} as const

export function sessionKey(sessionId: string): string {
  return `session:${sessionId}`
}

export function notificationsKey(userId: string): string {
  return `notifications:${userId}`
}

export function dashboardMyKey(userId: string): string {
  return `dashboard:mine:${userId}`
}

export function dashboardDiscoverKey(userId: string): string {
  return `dashboard:discover:${userId}`
}

// Redis is optional — if env vars are missing (local dev without Redis),
// all cache operations become no-ops so the app still works correctly.
function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const client = createRedisClient()

// Thin wrapper that falls back to no-op when Redis is unavailable
export const redis = {
  async get<T>(key: string): Promise<T | null> {
    if (!client) return null
    try {
      return await client.get<T>(key)
    } catch {
      return null
    }
  },

  async setex(key: string, ttl: number, value: unknown): Promise<void> {
    if (!client) return
    try {
      await client.setex(key, ttl, value)
    } catch {
      // non-fatal — next request will just re-fetch from DB
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (!client || keys.length === 0) return
    try {
      await client.del(...keys)
    } catch {
      // non-fatal
    }
  },
}
