'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareButtonProps {
  sessionId: string
}

export function ShareButton({ sessionId }: ShareButtonProps) {
  const [copied, setCopied] = useState<boolean>(false)

  async function handleCopy() {
    const url = `${window.location.origin}/sessions/${sessionId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          Share Link
        </>
      )}
    </Button>
  )
}
