import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { LinkLineButton } from './LinkLineButton'

export const metadata: Metadata = { title: 'Link LINE Account' }

interface PageProps {
  searchParams: { lineUserId?: string }
}

export default async function LinkLinePage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { lineUserId } = searchParams

  // Auto-link if lineUserId is in URL (came from bot welcome message)
  if (lineUserId) {
    const alreadyTaken = await db.user.findUnique({ where: { lineUserId } })

    if (!alreadyTaken) {
      await db.user.update({
        where: { id: session.user.id },
        data: { lineUserId },
      })

      return (
        <div className="max-w-md mx-auto mt-16 text-center space-y-4 animate-fade-in">
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold">LINE Linked!</h1>
          <p className="text-muted-foreground text-sm">
            You&apos;ll now receive EatPlan notifications on LINE.
          </p>
          <a href="/" className="text-orange-600 text-sm font-medium hover:underline">
            Back to dashboard
          </a>
        </div>
      )
    }
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lineUserId: true },
  })

  const channelId = process.env.LINE_CHANNEL_ID ?? ''
  const botUrl = `https://line.me/R/ti/p/@${channelId}`

  return (
    <div className="max-w-md mx-auto mt-16 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="text-5xl">💬</div>
        <h1 className="text-xl font-bold">Link your LINE account</h1>
        <p className="text-sm text-muted-foreground">
          Get notified on LINE when voting closes, appointments are set, and more.
        </p>
      </div>

      {user?.lineUserId ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center space-y-3">
          <p className="text-green-700 font-medium text-sm">✅ LINE is linked</p>
          <p className="text-xs text-muted-foreground">
            You&apos;ll receive notifications on LINE for all your sessions.
          </p>
          <LinkLineButton userId={session.user.id} isLinked={true} />
        </div>
      ) : (
        <div className="rounded-xl border p-5 space-y-4">
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">1</span>
              Add the EatPlan bot on LINE
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">2</span>
              The bot sends you a link — tap it to connect your account
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">3</span>
              Done — notifications go straight to your LINE
            </li>
          </ol>

          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#06C755] hover:bg-[#05b34d] text-white font-semibold py-3 text-sm transition-colors"
          >
            <span className="text-lg">💬</span>
            Add EatPlan on LINE
          </a>
        </div>
      )}
    </div>
  )
}
