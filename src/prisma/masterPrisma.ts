import { PrismaClient } from '@prisma/client';

let masterPrisma: PrismaClient | null = null;

export function getMasterPrisma(): PrismaClient {
  if (masterPrisma) {
    console.log('[masterPrisma] Returning cached master Prisma client');
    return masterPrisma;
  }

  console.log('[masterPrisma] Creating new master Prisma client');

  const masterDbUser = process.env.MASTER_DB_USER || 'postgres';
  const masterDbPass = process.env.MASTER_DB_PASSWORD || '';
  const masterDbHost = process.env.MASTER_DB_HOST || 'localhost';
  const masterDbPort = process.env.MASTER_DB_PORT || '5432';
  const masterDbName = process.env.MASTER_DB_NAME || 'master-db';

  const safePass = encodeURIComponent(masterDbPass);
  const url = `postgresql://${masterDbUser}:${safePass}@${masterDbHost}:${masterDbPort}/${masterDbName}?schema=public&sslmode=require`;

  console.log('[masterPrisma] Connection details - Host:', masterDbHost, 'Port:', masterDbPort, 'Database:', masterDbName);

  masterPrisma = new PrismaClient({
    datasources: {
      db: { url },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

  process.on('SIGINT', async () => {
    console.log('[masterPrisma] SIGINT received, disconnecting...');
    await disconnectMasterPrisma();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[masterPrisma] SIGTERM received, disconnecting...');
    await disconnectMasterPrisma();
    process.exit(0);
  });

  console.log('[masterPrisma] Master Prisma client created and cached');
  return masterPrisma;
}

export function createMasterPrismaWithUrl(dbUrl: string): PrismaClient {
  console.log('[masterPrisma] Creating master Prisma client with custom URL');

  return new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
}

export async function disconnectMasterPrisma(): Promise<void> {
  if (masterPrisma) {
    console.log('[masterPrisma] Disconnecting master Prisma client');
    await masterPrisma.$disconnect();
    masterPrisma = null;
    console.log('[masterPrisma] Master Prisma client disconnected');
  }
}

export const master = {
  get prisma() {
    return getMasterPrisma();
  },
  disconnect: disconnectMasterPrisma,
};
