'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis, sessionKey } from '@/lib/redis'
import type { ActionResult } from '@/types'
import { notifyAppointmentSet } from './notification'

const appointmentSchema = z.object({
  sessionId: z.string().cuid(),
  restaurantName: z.string().min(1).max(100),
  address: z.string().max(200).optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
})

export async function setAppointment(
  input: z.infer<typeof appointmentSchema>
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const parsed = appointmentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.message }

  const { sessionId, restaurantName, address, scheduledAt, notes } = parsed.data

  const mealSession = await db.mealSession.findUnique({ where: { id: sessionId } })
  if (!mealSession) return { success: false, error: 'Session not found' }
  if (mealSession.ownerId !== session.user.id) return { success: false, error: 'Forbidden' }
  if (mealSession.status === 'VOTING') return { success: false, error: 'Close voting first' }

  await db.$transaction([
    db.appointment.upsert({
      where: { sessionId },
      update: { restaurantName, address: address ?? null, scheduledAt: new Date(scheduledAt), notes: notes ?? null },
      create: { sessionId, restaurantName, address: address ?? null, scheduledAt: new Date(scheduledAt), notes: notes ?? null },
    }),
    db.mealSession.update({ where: { id: sessionId }, data: { status: 'CONFIRMED' } }),
  ])

  await notifyAppointmentSet(sessionId, session.user.id)

  // Appointment set — invalidate so page shows confirmed state immediately
  await redis.del(sessionKey(sessionId))
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/')
  return { success: true, data: undefined }
}
