'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis, sessionKey } from '@/lib/redis'
import type { ActionResult } from '@/types'

type VoteResult = {
  voted: boolean
  prevOptionId: string | null // the option that was unvoted (for optimistic UI)
}

export async function castVote(
  optionId: string,
  sessionId: string
): Promise<ActionResult<VoteResult>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const mealSession = await db.mealSession.findUnique({ where: { id: sessionId } })
  if (!mealSession) return { success: false, error: 'Session not found' }
  if (mealSession.status !== 'VOTING') return { success: false, error: 'Voting is closed' }

  const isMember = await db.sessionMember.findUnique({
    where: { sessionId_userId: { sessionId, userId: session.user.id } },
  })
  if (!isMember) return { success: false, error: 'You are not a member of this session' }

  // Find ANY existing vote by this user in this session (not just this option)
  const existingVote = await db.vote.findFirst({
    where: {
      userId: session.user.id,
      option: { sessionId },
    },
  })

  if (existingVote?.optionId === optionId) {
    // Clicked the same option they already voted for → toggle off
    await db.vote.delete({ where: { id: existingVote.id } })
    await redis.del(sessionKey(sessionId))
    revalidatePath(`/sessions/${sessionId}`)
    return { success: true, data: { voted: false, prevOptionId: null } }
  }

  if (existingVote) {
    // Voted for a DIFFERENT option → switch: delete old, create new
    await db.vote.delete({ where: { id: existingVote.id } })
  }

  await db.vote.create({ data: { userId: session.user.id, optionId } })

  await redis.del(sessionKey(sessionId))
  revalidatePath(`/sessions/${sessionId}`)
  return {
    success: true,
    data: { voted: true, prevOptionId: existingVote?.optionId ?? null },
  }
}
