'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ActionResult } from '@/types'
import { notifySessionCreated, notifyVotingClosed } from './notification'

const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  closingAt: z.string().optional(),
  options: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        address: z.string().max(200).optional(),
        imageUrl: z.string().url().optional().or(z.literal('')),
      })
    )
    .min(1)
    .max(10),
})

export async function createSession(
  formData: z.infer<typeof createSessionSchema>
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const parsed = createSessionSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.message }

  const { name, description, closingAt, options } = parsed.data

  const mealSession = await db.mealSession.create({
    data: {
      name,
      description,
      closingAt: closingAt ? new Date(closingAt) : null,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id } },
      options: {
        create: options.map((o) => ({
          name: o.name,
          address: o.address ?? null,
          imageUrl: o.imageUrl || null,
        })),
      },
    },
  })

  await notifySessionCreated(mealSession.id, session.user.id)

  revalidatePath('/')
  return { success: true, data: { id: mealSession.id } }
}

export async function joinSession(sessionId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const existing = await db.sessionMember.findUnique({
    where: { sessionId_userId: { sessionId, userId: session.user.id } },
  })
  if (existing) return { success: false, error: 'Already a member' }

  await db.sessionMember.create({ data: { sessionId, userId: session.user.id } })
  revalidatePath(`/sessions/${sessionId}`)
  return { success: true, data: undefined }
}

export async function closeVoting(sessionId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const mealSession = await db.mealSession.findUnique({ where: { id: sessionId } })
  if (!mealSession) return { success: false, error: 'Session not found' }
  if (mealSession.ownerId !== session.user.id) return { success: false, error: 'Forbidden' }
  if (mealSession.status !== 'VOTING') return { success: false, error: 'Already closed' }

  await db.mealSession.update({ where: { id: sessionId }, data: { status: 'CLOSED' } })
  await notifyVotingClosed(sessionId, session.user.id)

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/')
  return { success: true, data: undefined }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const mealSession = await db.mealSession.findUnique({ where: { id: sessionId } })
  if (!mealSession) throw new Error('Not found')
  if (mealSession.ownerId !== session.user.id) throw new Error('Forbidden')

  await db.mealSession.delete({ where: { id: sessionId } })
  revalidatePath('/')
  redirect('/')
}
