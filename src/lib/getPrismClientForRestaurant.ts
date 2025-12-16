/** @format */

import { PrismaClient } from '@prisma/client';
import { preloadSecrets } from '../utils/awsSecrets';

const prismClientCache: Map<string, PrismaClient> = new Map();

interface DatabaseCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export async function getPrismClientForRestaurant(restaurantId: string) {
  console.log(
    `[getPrismClientForRestaurant] Creating tenant client for restaurant: ${restaurantId}`
  );

  if (prismClientCache.has(restaurantId)) {
    console.log(
      `[getPrismClientForRestaurant] Using cached Prisma client for tenant: ${restaurantId}`
    );
    return prismClientCache.get(restaurantId)!;
  }

  // For now, assume a single tenant schema per process and build URL
  // from env/Secrets using restaurantId to pick credentials if needed.
  const dbName = process.env.TENANT_DB_NAME || `tenant_${restaurantId}`;
  const credentials = await loadDatabaseCredentials(dbName, restaurantId);
  const tenantDatabaseUrl = buildConnectionString(credentials);

  const tenantPrisma = new PrismaClient({
    datasources: {
      db: {
        url: tenantDatabaseUrl,
      },
    },
  });

  // Test connection
  await tenantPrisma.$queryRaw`SELECT 1`;

  console.log(
    `[getPrismClientForRestaurant] Successfully connected to tenant database: ${dbName}`
  );

  prismClientCache.set(restaurantId, tenantPrisma);
  return tenantPrisma;
}

async function loadDatabaseCredentials(
  dbName: string,
  restaurantId: string
): Promise<DatabaseCredentials> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    console.log(
      `[loadDatabaseCredentials] Development mode - loading from environment variables`
    );

    const hostKey = `TENANT_DB_HOST_${restaurantId}`;
    const portKey = `TENANT_DB_PORT_${restaurantId}`;
    const userKey = `TENANT_DB_USER_${restaurantId}`;
    const passwordKey = `TENANT_DB_PASSWORD_${restaurantId}`;

    if (
      process.env[hostKey] &&
      process.env[userKey] &&
      process.env[passwordKey]
    ) {
      console.log(
        `[loadDatabaseCredentials] Using restaurant-specific credentials for ${restaurantId}`
      );

      return {
        host: process.env[hostKey]!,
        port: parseInt(process.env[portKey] || '5432', 10),
        username: process.env[userKey]!,
        password: process.env[passwordKey]!,
        database: dbName,
      };
    }

    console.log(
      `[loadDatabaseCredentials] Using generic tenant credentials from env`
    );

    return {
      host: process.env.TENANT_DB_HOST || 'localhost',
      port: parseInt(process.env.TENANT_DB_PORT || '5432', 10),
      username: process.env.TENANT_DB_USER || 'postgres',
      password: process.env.TENANT_DB_PASSWORD || '',
      database: dbName,
    };
  }

  console.log(
    `[loadDatabaseCredentials] Production mode - loading from AWS Secrets Manager`
  );

  try {
    // preloadSecrets takes a single key and returns a string value
    const host = await preloadSecrets(`TENANT_DB_HOST_${restaurantId}`);
    const portStr = await preloadSecrets(`TENANT_DB_PORT_${restaurantId}`);
    const user = await preloadSecrets(`TENANT_DB_USER_${restaurantId}`);
    const password = await preloadSecrets(
      `TENANT_DB_PASSWORD_${restaurantId}`
    );

    return {
      host,
      port: parseInt(portStr || '5432', 10),
      username: user,
      password,
      database: dbName,
    };
  } catch (error) {
    console.error(
      `[loadDatabaseCredentials] Failed to load credentials from Secrets Manager`,
      error
    );
    throw new Error(
      `Could not load database credentials for restaurant ${restaurantId} from Secrets Manager`
    );
  }
}

function buildConnectionString(credentials: DatabaseCredentials): string {
  const { host, port, username, password, database } = credentials;
  const encodedPassword = encodeURIComponent(password);
  const connectionString = `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}?schema=public`;
  console.log(
    `[buildConnectionString] Built connection string for database: ${database} at ${host}:${port}`
  );
  return connectionString;
}

export async function disconnectAllClients() {
  console.log(
    `[disconnectAllClients] Disconnecting ${prismClientCache.size} Prisma clients...`
  );

  for (const [restaurantId, client] of prismClientCache.entries()) {
    try {
      await client.$disconnect();
      console.log(
        `[disconnectAllClients] Disconnected client for restaurant: ${restaurantId}`
      );
    } catch (error) {
      console.error(
        `[disconnectAllClients] Error disconnecting client for restaurant ${restaurantId}:`,
        error
      );
    }
  }

  prismClientCache.clear();
}
