'use client'

import { useOptimistic, useTransition } from 'react'
import { MapPin, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { castVote } from '@/lib/actions/vote'
import type { RestaurantOption, Vote } from '@/types'

type SessionStatus = string

interface OptionWithVotes extends RestaurantOption {
  votes: Vote[]
  _count: { votes: number }
}

interface VotePanelProps {
  options: OptionWithVotes[]
  sessionId: string
  sessionStatus: SessionStatus
  currentUserId: string
}

type OptimisticVoteState = { optionId: string; userId: string; action: 'add' | 'remove' }

export function VotePanel({ options, sessionId, sessionStatus, currentUserId }: VotePanelProps) {
  const [isPending, startTransition] = useTransition()

  const initialVoteCounts = Object.fromEntries(options.map((o) => [o.id, o._count.votes]))
  const initialUserVotes = new Set(
    options.filter((o) => o.votes.some((v) => v.userId === currentUserId)).map((o) => o.id)
  )

  const [optimisticState, addOptimistic] = useOptimistic<
    { counts: Record<string, number>; userVotes: Set<string> },
    OptimisticVoteState
  >(
    { counts: initialVoteCounts, userVotes: initialUserVotes },
    (state, action) => {
      const newCounts = { ...state.counts }
      const newVotes = new Set(state.userVotes)
      if (action.action === 'add') {
        newCounts[action.optionId] = (newCounts[action.optionId] ?? 0) + 1
        newVotes.add(action.optionId)
      } else {
        newCounts[action.optionId] = Math.max(0, (newCounts[action.optionId] ?? 0) - 1)
        newVotes.delete(action.optionId)
      }
      return { counts: newCounts, userVotes: newVotes }
    }
  )

  const totalVotes = Object.values(optimisticState.counts).reduce((a, b) => a + b, 0)
  const canVote = sessionStatus === 'VOTING'

  const sortedOptions = [...options].sort(
    (a, b) => (optimisticState.counts[b.id] ?? 0) - (optimisticState.counts[a.id] ?? 0)
  )

  function handleVote(optionId: string) {
    if (!canVote || isPending) return
    const hasVoted = optimisticState.userVotes.has(optionId)

    startTransition(async () => {
      addOptimistic({ optionId, userId: currentUserId, action: hasVoted ? 'remove' : 'add' })
      const result = await castVote(optionId, sessionId)
      if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      {sortedOptions.map((option, index) => {
        const count = optimisticState.counts[option.id] ?? 0
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
        const hasVoted = optimisticState.userVotes.has(option.id)
        const isLeading = index === 0 && count > 0

        return (
          <div
            key={option.id}
            className={cn(
              'group relative rounded-xl border p-4 transition-all duration-200',
              hasVoted
                ? 'border-orange-300 bg-orange-50/50 shadow-sm'
                : 'border-border bg-card hover:border-orange-200 hover:bg-accent/30',
              isLeading && 'ring-1 ring-orange-300'
            )}
          >
            {isLeading && (
              <span className="absolute -top-2.5 left-3 text-[11px] font-semibold uppercase tracking-wide text-orange-600 bg-white border border-orange-200 rounded-full px-2 py-0.5">
                Leading
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{option.name}</p>
                {option.address && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{option.address}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {count} vote{count !== 1 ? 's' : ''}
                </span>
                {canVote && (
                  <Button
                    size="sm"
                    variant={hasVoted ? 'default' : 'outline'}
                    disabled={isPending}
                    onClick={() => handleVote(option.id)}
                    className={cn(
                      'h-8 gap-1.5 text-xs',
                      hasVoted
                        ? 'bg-orange-500 hover:bg-orange-600 text-white border-transparent'
                        : 'hover:border-orange-300 hover:text-orange-600'
                    )}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {hasVoted ? 'Voted' : 'Vote'}
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <Progress
                value={percentage}
                className={cn(
                  'h-1.5',
                  hasVoted ? '[&>div]:bg-orange-500' : '[&>div]:bg-muted-foreground/40'
                )}
              />
              <p className="text-right text-xs text-muted-foreground">{percentage}%</p>
            </div>
          </div>
        )
      })}

      {options.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No restaurant options yet.
        </div>
      )}
    </div>
  )
}
