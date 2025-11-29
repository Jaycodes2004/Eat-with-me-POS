import { createTenantUserAndDatabase, dropTenantDatabaseAndUser } from '../services/tenantDbService';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';

import { getParameter } from "./awsSecrets";
import { getSecret } from "./awsSecretsManager";


// Cache for Prisma Clients
const prismaClients: Record<string, TenantPrismaClient> = {};

function encode(val: string) {
  return encodeURIComponent(val);
}

//
// Build a valid psql connection
//
// psql logic removed. Use pg service instead.

//
// Tenant Prisma Client
//
export function getTenantPrismaClientWithParams(
  dbName: string,
  dbUser: string,
  dbPass: string,
  dbHost: string,
  dbPort: string
): TenantPrismaClient {
  if (prismaClients[dbName]) return prismaClients[dbName];

  const safePass = encode(dbPass);
  const url = `postgresql://${dbUser}:${safePass}@${dbHost}:${dbPort}/${dbName}?schema=public&sslmode=require`;

  process.env.DATABASE_URL = url;
  process.env.DATABASE_URL_TENANT = url;

  const client = new TenantPrismaClient({
    datasources: { db: { url } }
  });

  prismaClients[dbName] = client;
  return client;
}

//
// Create Tenant DB + User
export async function createTenantDatabaseAndUser(
  dbName: string,
  tenantUser: string,
  tenantPass: string,
  rootUser: string,
  rootPass: string,
  host: string,
  port: string
) {
  // Use pg service for DB/user creation
  await createTenantUserAndDatabase({
    dbName,
    dbUser: tenantUser,
    dbPassword: tenantPass,
  });
}

//
// Run Prisma migrations for tenant
//
export async function runMigrationsForTenant(
  dbName: string,
  rootUser: string,
  rootPass: string,
  host: string,
  port: string
) {
  const safePass = encode(rootPass);
  const url = `postgresql://${rootUser}:${safePass}@${host}:${port}/${dbName}?schema=public&sslmode=require`;
  console.log("⚠️ MIGRATION URL:", url);
  process.env.DATABASE_URL = url;
  process.env.DATABASE_URL_TENANT = url;
  // Migration logic should be implemented here if needed.
}

//
// Drop Tenant DB
export async function dropTenantDatabaseAndUserWrapper(
  dbName: string,
  tenantUser: string,
  rootUser: string,
  rootPass: string,
  host: string,
  port: string
) {
  // Use pg service for DB/user cleanup
  await dropTenantDatabaseAndUser({
    dbName,
    dbUser: tenantUser,
  });
}
export { dropTenantDatabaseAndUserWrapper as dropTenantDatabaseAndUser };

