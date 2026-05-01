import type {
  User,
  MealSession,
  SessionMember,
  RestaurantOption,
  Vote,
  Appointment,
  Notification,
} from '@prisma/client'

export type {
  User,
  MealSession,
  SessionMember,
  RestaurantOption,
  Vote,
  Appointment,
  Notification,
}

export type SessionStatus = 'VOTING' | 'CLOSED' | 'CONFIRMED'
export type NotificationType = 'SESSION_CREATED' | 'VOTING_CLOSED' | 'APPOINTMENT_SET'

export type SessionWithDetails = MealSession & {
  owner: Pick<User, 'id' | 'name' | 'email' | 'image'>
  members: (SessionMember & { user: Pick<User, 'id' | 'name' | 'email' | 'image'> })[]
  options: (RestaurantOption & { votes: Vote[]; _count: { votes: number } })[]
  appointment: Appointment | null
  _count: { members: number; options: number }
}

export type SessionCardData = MealSession & {
  owner: Pick<User, 'id' | 'name' | 'image'>
  _count: { members: number; options: number; votes?: number }
  options: { _count: { votes: number } }[]
}

export type NotificationWithSession = Notification & {
  sessionId: string | null
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
