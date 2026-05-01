'use client'

import { useTransition } from 'react'
import { LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { closeVoting } from '@/lib/actions/session'

interface CloseVotingButtonProps {
  sessionId: string
}

export function CloseVotingButton({ sessionId }: CloseVotingButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    startTransition(async () => {
      const result = await closeVoting(sessionId)
      if (result.success) {
        toast.success('Voting closed. Now set the appointment!')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClose}
      disabled={isPending}
      className="gap-1.5 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
    >
      <LockKeyhole className="h-4 w-4" />
      {isPending ? 'Closing...' : 'Close Voting'}
    </Button>
  )
}
