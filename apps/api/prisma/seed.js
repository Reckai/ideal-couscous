'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const prisma_1 = require('../generated/prisma/index.js')

const prisma = new prisma_1.PrismaClient()
async function main() {
  await prisma.user.create({
    data: {
      id: 'temp-user-id-123',
      name: 'reckai',
      passwordHash: '$2b$10$dummy',
    },
  })
  await prisma.user.create({
    data: {
      id: 'temp-user-id-456',
      name: 'katro',
      passwordHash: '$2b$10$dummy',
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
// # sourceMappingURL=seed.js.map
