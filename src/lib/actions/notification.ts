'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis, notificationsKey } from '@/lib/redis'
import { sendLineMulticast } from '@/lib/line'
import type { ActionResult } from '@/types'

interface MemberInfo {
  userId: string
  lineUserId: string | null
}

async function getMembers(sessionId: string, excludeUserId: string): Promise<MemberInfo[]> {
  const members = await db.sessionMember.findMany({
    where: { sessionId, userId: { not: excludeUserId } },
    select: { userId: true, user: { select: { lineUserId: true } } },
  })
  return members.map((m) => ({ userId: m.userId, lineUserId: m.user.lineUserId }))
}

async function invalidateNotificationCaches(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return
  const keys = userIds.map(notificationsKey)
  await redis.del(...keys)
}

// Push LINE notification to all members who have linked their LINE
async function pushLineNotification(members: MemberInfo[], message: string): Promise<void> {
  const lineIds = members.map((m) => m.lineUserId).filter((id): id is string => id !== null)
  if (lineIds.length > 0) {
    await sendLineMulticast(lineIds, message)
  }
}

export async function notifySessionCreated(sessionId: string, creatorId: string): Promise<void> {
  const mealSession = await db.mealSession.findUnique({
    where: { id: sessionId },
    select: { name: true },
  })
  if (!mealSession) return

  const members = await getMembers(sessionId, creatorId)
  if (members.length === 0) return

  const appUrl = process.env.NEXTAUTH_URL ?? 'https://eat-plan-manage.vercel.app'

  await Promise.all([
    db.notification.createMany({
      data: members.map(({ userId }) => ({
        userId,
        title: 'New meal session!',
        body: `You were invited to "${mealSession.name}"`,
        type: 'SESSION_CREATED' as const,
        sessionId,
      })),
    }),
    pushLineNotification(
      members,
      `🍽️ New meal session!\n\nYou were invited to "${mealSession.name}"\n\n👉 ${appUrl}/sessions/${sessionId}`
    ),
    invalidateNotificationCaches(members.map((m) => m.userId)),
  ])
}

export async function notifyVotingClosed(sessionId: string, ownerId: string): Promise<void> {
  const mealSession = await db.mealSession.findUnique({
    where: { id: sessionId },
    select: { name: true },
  })
  if (!mealSession) return

  const members = await getMembers(sessionId, ownerId)
  if (members.length === 0) return

  const appUrl = process.env.NEXTAUTH_URL ?? 'https://eat-plan-manage.vercel.app'

  await Promise.all([
    db.notification.createMany({
      data: members.map(({ userId }) => ({
        userId,
        title: 'Voting closed',
        body: `Voting for "${mealSession.name}" has been closed`,
        type: 'VOTING_CLOSED' as const,
        sessionId,
      })),
    }),
    pushLineNotification(
      members,
      `🔒 Voting closed!\n\n"${mealSession.name}" — check the results and wait for the appointment.\n\n👉 ${appUrl}/sessions/${sessionId}`
    ),
    invalidateNotificationCaches(members.map((m) => m.userId)),
  ])
}

export async function notifyAppointmentSet(sessionId: string, ownerId: string): Promise<void> {
  const mealSession = await db.mealSession.findUnique({
    where: { id: sessionId },
    include: { appointment: true },
  })
  if (!mealSession?.appointment) return

  const members = await getMembers(sessionId, ownerId)
  if (members.length === 0) return

  const scheduledAt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(mealSession.appointment.scheduledAt)

  const appUrl = process.env.NEXTAUTH_URL ?? 'https://eat-plan-manage.vercel.app'

  await Promise.all([
    db.notification.createMany({
      data: members.map(({ userId }) => ({
        userId,
        title: 'Appointment confirmed!',
        body: `"${mealSession.name}" at ${mealSession.appointment!.restaurantName} on ${scheduledAt}`,
        type: 'APPOINTMENT_SET' as const,
        sessionId,
      })),
    }),
    pushLineNotification(
      members,
      `📅 Appointment confirmed!\n\n"${mealSession.name}"\n🍽️ ${mealSession.appointment!.restaurantName}\n🕐 ${scheduledAt}${mealSession.appointment!.address ? `\n📍 ${mealSession.appointment!.address}` : ''}\n\n👉 ${appUrl}/sessions/${sessionId}`
    ),
    invalidateNotificationCaches(members.map((m) => m.userId)),
  ])
}

export async function markAllRead(): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  // Invalidate so the bell count resets immediately
  await redis.del(notificationsKey(session.user.id))
  revalidatePath('/')
  return { success: true, data: undefined }
}

export async function markOneRead(notificationId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  await db.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  })

  await redis.del(notificationsKey(session.user.id))
  revalidatePath('/')
  return { success: true, data: undefined }
}
