'use client'

import { useTransition } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { joinSession } from '@/lib/actions/session'

interface JoinSessionButtonProps {
  sessionId: string
}

export function JoinSessionButton({ sessionId }: JoinSessionButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleJoin() {
    startTransition(async () => {
      const result = await joinSession(sessionId)
      if (result.success) {
        toast.success('Joined session!')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      size="sm"
      onClick={handleJoin}
      disabled={isPending}
      className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
    >
      <UserPlus className="h-4 w-4" />
      {isPending ? 'Joining...' : 'Join Session'}
    </Button>
  )
}
