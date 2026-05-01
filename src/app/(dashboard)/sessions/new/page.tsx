import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateSessionForm } from '@/components/CreateSessionForm'

export const metadata: Metadata = { title: 'New Session' }

export default function NewSessionPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Create Session</h1>
          <p className="text-sm text-muted-foreground">Set up a new group meal planning session</p>
        </div>
      </div>

      <CreateSessionForm />
    </div>
  )
}
