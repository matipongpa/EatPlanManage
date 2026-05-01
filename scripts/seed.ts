import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await db.vote.deleteMany()
  await db.notification.deleteMany()
  await db.appointment.deleteMany()
  await db.sessionMember.deleteMany()
  await db.restaurantOption.deleteMany()
  await db.mealSession.deleteMany()
  await db.account.deleteMany()
  await db.user.deleteMany()

  const password = await bcrypt.hash('password123', 12)

  const [alice, bob, charlie] = await Promise.all([
    db.user.create({
      data: { name: 'Alice Chen', email: 'alice@example.com', password },
    }),
    db.user.create({
      data: { name: 'Bob Kim', email: 'bob@example.com', password },
    }),
    db.user.create({
      data: { name: 'Charlie Tan', email: 'charlie@example.com', password },
    }),
  ])

  const session1 = await db.mealSession.create({
    data: {
      name: 'Friday Team Lunch',
      description: 'Our weekly team lunch — let\'s pick somewhere good!',
      status: 'VOTING',
      ownerId: alice.id,
      closingAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      members: {
        create: [{ userId: alice.id }, { userId: bob.id }, { userId: charlie.id }],
      },
      options: {
        create: [
          { name: 'Sushi Paradise', address: '123 Ocean Dr', imageUrl: null },
          { name: 'Thai Orchid', address: '45 Main St', imageUrl: null },
          { name: 'Burger Republic', address: '88 Grill Lane', imageUrl: null },
        ],
      },
    },
    include: { options: true },
  })

  await db.vote.create({ data: { userId: alice.id, optionId: session1.options[0]!.id } })
  await db.vote.create({ data: { userId: bob.id, optionId: session1.options[1]!.id } })
  await db.vote.create({ data: { userId: charlie.id, optionId: session1.options[0]!.id } })

  const session2 = await db.mealSession.create({
    data: {
      name: 'Birthday Dinner',
      description: 'Celebrating Charlie\'s birthday!',
      status: 'CONFIRMED',
      ownerId: bob.id,
      members: {
        create: [{ userId: alice.id }, { userId: bob.id }, { userId: charlie.id }],
      },
      options: {
        create: [
          { name: 'La Maison', address: '7 Rue de Paris', imageUrl: null },
          { name: 'Steak House 99', address: '99 Prime Ave', imageUrl: null },
        ],
      },
      appointment: {
        create: {
          restaurantName: 'La Maison',
          address: '7 Rue de Paris',
          scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          notes: 'Reservation under Bob, 7pm. Dress smart casual!',
        },
      },
    },
  })

  await db.notification.create({
    data: {
      userId: alice.id,
      title: 'Appointment confirmed!',
      body: '"Birthday Dinner" at La Maison — confirmed!',
      type: 'APPOINTMENT_SET',
      sessionId: session2.id,
    },
  })

  console.log('✅ Seed complete!')
  console.log('  Users: alice@example.com, bob@example.com, charlie@example.com')
  console.log('  Password: password123')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
