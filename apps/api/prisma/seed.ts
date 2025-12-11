import { PrismaClient } from 'generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Создать тестовых пользователей
  await prisma.user.create({
    data: {
      id: 'temp-user-id-123',
      name: 'reckai',
    },
  })

  await prisma.user.create({
    data: {
      id: 'temp-user-id-456',
      name: 'katro',

    },
  })

  console.log('✅ Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
