'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import type { ActionResult } from '@/types'

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

export async function registerUser(
  input: z.infer<typeof registerSchema>
): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { success: false, error: 'Email already registered' }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
    },
  })

  return { success: true, data: { email: parsed.data.email } }
}
