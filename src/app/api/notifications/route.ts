import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis, notificationsKey, TTL } from '@/lib/redis'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = notificationsKey(session.user.id)

  // Try cache first — polled every 30s so 60s TTL is fine
  const cached = await redis.get(key)
  if (cached) {
    return NextResponse.json({ notifications: cached })
  }

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  await redis.setex(key, TTL.NOTIFICATIONS, notifications)

  return NextResponse.json({ notifications })
}
