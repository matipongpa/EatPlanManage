'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function unlinkLine(userId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id || session.user.id !== userId) throw new Error('Unauthorized')

  await db.user.update({
    where: { id: userId },
    data: { lineUserId: null },
  })
}
