import { PrismaClient } from '../src/generated/master';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: {
      restaurantId: true,
      dbName: true,
      dbUser: true,
      dbPassword: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenants.length) {
    console.log('No tenants found in master_db.');
    return;
  }

  console.table(tenants);
}

main()
  .catch((error) => {
    console.error('Failed to list tenants:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
