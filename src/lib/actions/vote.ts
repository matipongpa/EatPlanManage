'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis, sessionKey } from '@/lib/redis'
import type { ActionResult } from '@/types'

export async function castVote(
  optionId: string,
  sessionId: string
): Promise<ActionResult<{ voted: boolean }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const mealSession = await db.mealSession.findUnique({ where: { id: sessionId } })
  if (!mealSession) return { success: false, error: 'Session not found' }
  if (mealSession.status !== 'VOTING') return { success: false, error: 'Voting is closed' }

  const isMember = await db.sessionMember.findUnique({
    where: { sessionId_userId: { sessionId, userId: session.user.id } },
  })
  if (!isMember) return { success: false, error: 'You are not a member of this session' }

  const existingVote = await db.vote.findUnique({
    where: { userId_optionId: { userId: session.user.id, optionId } },
  })

  if (existingVote) {
    await db.vote.delete({ where: { id: existingVote.id } })
  } else {
    await db.vote.create({ data: { userId: session.user.id, optionId } })
  }

  // Invalidate Redis cache so next load fetches fresh vote counts from Postgres
  await redis.del(sessionKey(sessionId))
  revalidatePath(`/sessions/${sessionId}`)

  return { success: true, data: { voted: !existingVote } }
}
