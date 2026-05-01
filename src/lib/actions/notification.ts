'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ActionResult } from '@/types'

async function getMemberIds(sessionId: string, excludeUserId: string): Promise<string[]> {
  const members = await db.sessionMember.findMany({
    where: { sessionId, userId: { not: excludeUserId } },
    select: { userId: true },
  })
  return members.map((m) => m.userId)
}

export async function notifySessionCreated(sessionId: string, creatorId: string): Promise<void> {
  const session = await db.mealSession.findUnique({
    where: { id: sessionId },
    select: { name: true },
  })
  if (!session) return

  const memberIds = await getMemberIds(sessionId, creatorId)
  if (memberIds.length === 0) return

  await db.notification.createMany({
    data: memberIds.map((userId) => ({
      userId,
      title: 'New meal session!',
      body: `You were invited to "${session.name}"`,
      type: 'SESSION_CREATED' as const,
      sessionId,
    })),
  })
}

export async function notifyVotingClosed(sessionId: string, ownerId: string): Promise<void> {
  const session = await db.mealSession.findUnique({
    where: { id: sessionId },
    select: { name: true },
  })
  if (!session) return

  const memberIds = await getMemberIds(sessionId, ownerId)
  if (memberIds.length === 0) return

  await db.notification.createMany({
    data: memberIds.map((userId) => ({
      userId,
      title: 'Voting closed',
      body: `Voting for "${session.name}" has been closed`,
      type: 'VOTING_CLOSED' as const,
      sessionId,
    })),
  })
}

export async function notifyAppointmentSet(sessionId: string, ownerId: string): Promise<void> {
  const session = await db.mealSession.findUnique({
    where: { id: sessionId },
    include: { appointment: true },
  })
  if (!session?.appointment) return

  const memberIds = await getMemberIds(sessionId, ownerId)
  if (memberIds.length === 0) return

  const scheduledAt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(session.appointment.scheduledAt)

  await db.notification.createMany({
    data: memberIds.map((userId) => ({
      userId,
      title: 'Appointment confirmed!',
      body: `"${session.name}" at ${session.appointment!.restaurantName} on ${scheduledAt}`,
      type: 'APPOINTMENT_SET' as const,
      sessionId,
    })),
  })
}

export async function markAllRead(): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

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

  revalidatePath('/')
  return { success: true, data: undefined }
}
