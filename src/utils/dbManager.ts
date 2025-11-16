
// new modules

import { exec } from 'child_process';
import { PrismaClient as TenantPrismaClient } from '@prisma/client';
import util from 'util';
import { getParameter } from './awsSecrets';
const execPromise = util.promisify(exec);
// A cache to hold tenant-specific Prisma Client instances
const prismaClients: { [key: string]: TenantPrismaClient } = {};

// Fetch and set master DB URL from SSM Parameter Store
export async function setMasterDbUrlFromSSM(paramName: string) {
  const url = await getParameter(paramName);
  process.env.DATABASE_URL_MASTER = url;
}

// Fetch and set tenant DB URL from SSM Parameter Store
export async function setTenantDbUrlFromSSM(paramName: string) {
  const url = await getParameter(paramName);
  process.env.DATABASE_URL_TENANT = url;
}


// Deprecated: Use getTenantPrismaClientWithParams or setTenantDbUrlFromSSM
export function getTenantPrismaClient(dbName: string): never {
  throw new Error('getTenantPrismaClient now requires DB connection params. Use getTenantPrismaClientWithParams or setTenantDbUrlFromSSM instead.');
}

/**
 * Returns a cached or new Prisma Client instance for a specific tenant.
 * @param dbName The name of the tenant's database.
 * @param dbUser, dbPass, dbHost, dbPort: DB connection params
 */
// Use getTenantPrismaClientWithParams instead


export function getTenantPrismaClientWithParams(dbName: string, dbUser: string, dbPass: string, dbHost: string, dbPort: string): TenantPrismaClient {
  if (prismaClients[dbName]) {
    return prismaClients[dbName];
  }
  const databaseUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?schema=public`;
  // Optionally set env for Prisma
  process.env.DATABASE_URL_TENANT = databaseUrl;
  const client = new TenantPrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  prismaClients[dbName] = client;
  return client;
}

/**
 * Creates a new PostgreSQL database and a dedicated user for a new tenant.
 */
export async function createTenantDatabaseAndUser(dbName: string, tenantDbUser: string, tenantDbPass: string, dbUser: string, dbPass: string, dbHost: string, dbPort: string) {
  const psqlCommand = `psql -U ${dbUser} -h ${dbHost} -p ${dbPort}`;
  const env = { ...process.env, PGPASSWORD: dbPass };
  await execPromise(`${psqlCommand} -c "CREATE USER ${tenantDbUser} WITH PASSWORD '${tenantDbPass}';"`, { env });
  await execPromise(`${psqlCommand} -c "CREATE DATABASE ${dbName};"`, { env });
  await execPromise(`${psqlCommand} -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${tenantDbUser};"`, { env });
}

/**
 * Runs 'prisma migrate deploy' for a specific tenant's database.
 * Optionally fetches DB URL from SSM if paramName is provided.
 */
export async function runMigrationsForTenant(dbName: string, dbUser: string, dbPass: string, dbHost: string, dbPort: string, paramName?: string) {
  let databaseUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?schema=public`;
  if (paramName) {
    databaseUrl = await getParameter(paramName);
  }
  const command = `npx prisma migrate deploy --schema=./prisma/schema.prisma`;
  await execPromise(command, {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DATABASE_URL_TENANT: databaseUrl,
    },
  });
}

/**
 * Drops a tenant's database and user, for cleanup after a failed signup.
 */
export async function dropTenantDatabaseAndUser(dbName: string, tenantDbUser: string, dbUser: string, dbPass: string, dbHost: string, dbPort: string) {
  const psqlCommand = `psql -U ${dbUser} -h ${dbHost} -p ${dbPort}`;
  const env = { ...process.env, PGPASSWORD: dbPass };
  // Terminate all active connections to the target database before dropping it
  await execPromise(`${psqlCommand} -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbName}' AND pid <> pg_backend_pid();"`, { env });
  await execPromise(`${psqlCommand} -c "DROP DATABASE IF EXISTS ${dbName};"`, { env });
  await execPromise(`${psqlCommand} -c "DROP USER IF EXISTS ${tenantDbUser};"`, { env });
}
