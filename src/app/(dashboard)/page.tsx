import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, UtensilsCrossed, Compass } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SessionCard } from '@/components/SessionCard'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Sessions' }

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  // Sessions the user is part of
  const mySessions = await db.mealSession.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, options: true } },
      options: { select: { _count: { select: { votes: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Sessions the user has NOT joined yet — so friends can discover them
  const discoverSessions = await db.mealSession.findMany({
    where: {
      AND: [
        { ownerId: { not: userId } },
        { members: { none: { userId } } },
        { status: 'VOTING' },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, options: true } },
      options: { select: { _count: { select: { votes: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const active = mySessions.filter((s) => s.status === 'VOTING')
  const closed = mySessions.filter((s) => s.status === 'CLOSED')
  const confirmed = mySessions.filter((s) => s.status === 'CONFIRMED')

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mySessions.length === 0
              ? 'Create your first session to get started'
              : `${mySessions.length} session${mySessions.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
          <Link href="/sessions/new">
            <Plus className="h-4 w-4" />
            New Session
          </Link>
        </Button>
      </div>

      {mySessions.length === 0 && discoverSessions.length === 0 && (
        <div className="rounded-2xl border border-dashed p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <UtensilsCrossed className="h-8 w-8 text-orange-400" />
          </div>
          <h2 className="text-lg font-semibold">No sessions yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            Create a session, add restaurant options, and let your group vote!
          </p>
          <Button asChild className="mt-6 bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
            <Link href="/sessions/new">
              <Plus className="h-4 w-4" />
              Create First Session
            </Link>
          </Button>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Voting Open ({active.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((s) => (
              <SessionCard key={s.id} session={s} currentUserId={userId} />
            ))}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Voting Closed ({closed.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {closed.map((s) => (
              <SessionCard key={s.id} session={s} currentUserId={userId} />
            ))}
          </div>
        </section>
      )}

      {confirmed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Confirmed ({confirmed.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {confirmed.map((s) => (
              <SessionCard key={s.id} session={s} currentUserId={userId} />
            ))}
          </div>
        </section>
      )}

      {/* Sessions from other users that this user hasn't joined */}
      {discoverSessions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Open to Join ({discoverSessions.length})
            </h2>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Sessions from others — click to view and join.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {discoverSessions.map((s) => (
              <SessionCard key={s.id} session={s} currentUserId={userId} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
