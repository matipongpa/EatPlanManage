import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'VOTING':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'CLOSED':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'CONFIRMED':
      return 'bg-green-100 text-green-700 border-green-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'VOTING':
      return 'Voting Open'
    case 'CLOSED':
      return 'Voting Closed'
    case 'CONFIRMED':
      return 'Confirmed'
    default:
      return status
  }
}
