'use client'

import { useEffect, useState, useTransition } from 'react'
import { Bell, Check, Calendar, Vote, UtensilsCrossed } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { markAllRead } from '@/lib/actions/notification'
import type { NotificationType } from '@/types'

interface NotificationItem {
  id: string
  title: string
  body: string
  read: boolean
  type: string
  sessionId: string | null
  createdAt: Date
}

interface NotificationBellProps {
  initialNotifications: NotificationItem[]
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'SESSION_CREATED':
      return <UtensilsCrossed className="h-4 w-4 text-orange-500" />
    case 'VOTING_CLOSED':
      return <Vote className="h-4 w-4 text-yellow-500" />
    case 'APPOINTMENT_SET':
      return <Calendar className="h-4 w-4 text-green-500" />
  }
}

export function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [open, setOpen] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' })
        if (res.ok) {
          const data = (await res.json()) as { notifications: NotificationItem[] }
          setNotifications(data.notifications)
        }
      } catch {
        // silent — background poll
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  function handleMarkAll() {
    startTransition(async () => {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={handleMarkAll}
              disabled={isPending}
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 cursor-pointer focus:bg-accent rounded-none',
                  !notification.read && 'bg-orange-50/60'
                )}
                asChild
              >
                <a href={notification.sessionId ? `/sessions/${notification.sessionId}` : '#'}>
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm leading-snug', !notification.read && 'font-semibold')}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </a>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
