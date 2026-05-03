import { NextRequest, NextResponse } from 'next/server'
import { verifyLineSignature, sendLineMessage } from '@/lib/line'
import { db } from '@/lib/db'

interface LineEvent {
  type: string
  source: { userId: string; type: string }
  message?: { type: string; text: string }
  replyToken?: string
}

interface LineWebhookBody {
  events: LineEvent[]
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''

  // Reject if signature doesn't match — prevents fake webhook calls
  if (!verifyLineSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body) as LineWebhookBody

  for (const event of payload.events) {
    const lineUserId = event.source.userId

    // User added the bot as a friend
    if (event.type === 'follow') {
      // Check if this LINE user ID is already linked to an account
      const existingLink = await db.user.findUnique({ where: { lineUserId } })

      if (!existingLink) {
        // Send them a link to connect their app account
        const appUrl = process.env.NEXTAUTH_URL ?? 'https://eat-plan-manage.vercel.app'
        await sendLineMessage(
          lineUserId,
          `👋 Welcome to EatPlan!\n\nTo receive notifications, link your account:\n${appUrl}/settings/line?lineUserId=${lineUserId}`
        )
      } else {
        await sendLineMessage(
          lineUserId,
          `✅ Your LINE is already linked to EatPlan!\nYou'll receive notifications here.`
        )
      }
    }

    // User sent a message to the bot
    if (event.type === 'message' && event.message?.type === 'text') {
      await sendLineMessage(
        lineUserId,
        `Thanks for your message! Visit the app to manage your sessions. 🍽️`
      )
    }

    // User removed the bot — unlink their account
    if (event.type === 'unfollow') {
      await db.user.updateMany({
        where: { lineUserId },
        data: { lineUserId: null },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
