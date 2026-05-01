import Link from 'next/link'
import { Calendar, Users, UtensilsCrossed, MapPin, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, formatDate, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { SessionCardData } from '@/types'

interface SessionCardProps {
  session: SessionCardData
  currentUserId: string
}

export function SessionCard({ session, currentUserId }: SessionCardProps) {
  const isOwner = session.ownerId === currentUserId
  const totalVotes = session.options.reduce((sum, o) => sum + o._count.votes, 0)

  return (
    <Link href={`/sessions/${session.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/60">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <UtensilsCrossed className="h-5 w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">{session.name}</h3>
                  {isOwner && (
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                      Owner
                    </span>
                  )}
                </div>
                {session.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                    {session.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                className={cn('text-xs border', getStatusColor(session.status))}
                variant="outline"
              >
                {getStatusLabel(session.status)}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {session._count.members} member{session._count.members !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {session._count.options} option{session._count.options !== 1 ? 's' : ''}
            </span>
            {totalVotes > 0 && (
              <span className="flex items-center gap-1.5 text-orange-600 font-medium">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </span>
            )}
            {session.closingAt && (
              <span className="flex items-center gap-1.5 ml-auto">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">Closes {formatDate(session.closingAt)}</span>
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1">
            <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border">
              <AvatarImage src={session.owner.image ?? undefined} alt={session.owner.name ?? ''} />
              <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                {getInitials(session.owner.name)}
              </AvatarFallback>
            </Avatar>
            <span className="ml-1.5 text-xs text-muted-foreground">
              Created by <span className="font-medium text-foreground">{session.owner.name ?? 'Unknown'}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
