import { PrismaClient } from 'generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Создать тестовых пользователей
  await prisma.user.create({
    data: {
      id: 'temp-user-id-123',
      name: 'reckai',
      passwordHash: '$2b$10$dummy',
    },
  });

  await prisma.user.create({
    data: {
      id: 'temp-user-id-456',
      name: 'katro',
      passwordHash: '$2b$10$dummy',
    },
  });

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
