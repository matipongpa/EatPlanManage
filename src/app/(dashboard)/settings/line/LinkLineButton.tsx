'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { unlinkLine } from './actions'

interface LinkLineButtonProps {
  userId: string
  isLinked: boolean
}

export function LinkLineButton({ userId, isLinked }: LinkLineButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleUnlink() {
    startTransition(async () => {
      await unlinkLine(userId)
      toast.success('LINE unlinked')
      router.refresh()
    })
  }

  if (!isLinked) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUnlink}
      disabled={isPending}
      className="text-destructive border-destructive/30 hover:bg-destructive/10"
    >
      {isPending ? 'Unlinking...' : 'Unlink LINE'}
    </Button>
  )
}
