// import { createTenantUserAndDatabase, dropTenantDatabaseAndUser } from '../services/tenantDbService';
// import { PrismaClient as TenantPrismaClient } from '../generated/tenant';

// import { getParameter } from "./awsSecrets";
// import { getSecret } from "./awsSecretsManager";


// // Cache for Prisma Clients
// const prismaClients: Record<string, TenantPrismaClient> = {};

// function encode(val: string) {
//   return encodeURIComponent(val);
// }

// //
// // Build a valid psql connection
// //
// // psql logic removed. Use pg service instead.

// //
// // Tenant Prisma Client
// //
// export function getTenantPrismaClientWithParams(
//   dbName: string,
//   dbUser: string,
//   dbPass: string,
//   dbHost: string,
//   dbPort: string
// ): TenantPrismaClient {
//   if (prismaClients[dbName]) return prismaClients[dbName];

//   const safePass = encode(dbPass);
//   const url = `postgresql://${dbUser}:${safePass}@${dbHost}:${dbPort}/${dbName}?schema=public&sslmode=require`;

//   process.env.DATABASE_URL = url;
//   process.env.DATABASE_URL_TENANT = url;

//   const client = new TenantPrismaClient({
//     datasources: { db: { url } }
//   });

//   prismaClients[dbName] = client;
//   return client;
// }

// //
// // Create Tenant DB + User
// export async function createTenantDatabaseAndUser(
//   dbName: string,
//   tenantUser: string,
//   tenantPass: string,
//   rootUser: string,
//   rootPass: string,
//   host: string,
//   port: string
// ) {
//   // Use pg service for DB/user creation
//   await createTenantUserAndDatabase({
//     dbName,
//     dbUser: tenantUser,
//     dbPassword: tenantPass,
//   });
// }

// //
// // Run Prisma migrations for tenant
// //
// export async function runMigrationsForTenant(
//   dbName: string,
//   rootUser: string,
//   rootPass: string,
//   host: string,
//   port: string
// ) {
//   const safePass = encode(rootPass);
//   const url = `postgresql://${rootUser}:${safePass}@${host}:${port}/${dbName}?schema=public&sslmode=require`;
//   console.log("⚠️ MIGRATION URL:", url);
//   process.env.DATABASE_URL = url;
//   process.env.DATABASE_URL_TENANT = url;
//   // Migration logic should be implemented here if needed.
// }

// //
// // Drop Tenant DB
// export async function dropTenantDatabaseAndUserWrapper(
//   dbName: string,
//   tenantUser: string,
//   rootUser: string,
//   rootPass: string,
//   host: string,
//   port: string
// ) {
//   // Use pg service for DB/user cleanup
//   await dropTenantDatabaseAndUser({
//     dbName,
//     dbUser: tenantUser,
//   });
// }
// export { dropTenantDatabaseAndUserWrapper as dropTenantDatabaseAndUser };



/** @format */

import { createTenantUserAndDatabase, dropTenantDatabaseAndUser } from '../services/tenantDbService';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';
import { runTenantMigration } from './runTenantMigration';

// Cache for Prisma Clients
const prismaClients: Record<string, TenantPrismaClient> = {};

function encode(val: string) {
  return encodeURIComponent(val);
}

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

  // Keep envs in sync for Prisma tools that might read DATABASE_URL
  process.env.DATABASE_URL = url;
  process.env.DATABASE_URL_TENANT = url;

  const client = new TenantPrismaClient({
    datasources: { db: { url } },
  });

  prismaClients[dbName] = client;
  return client;
}

//
// Create Tenant DB + User
//
export async function createTenantDatabaseAndUser(
  dbName: string,
  tenantUser: string,
  tenantPass: string,
  rootUser: string,
  rootPass: string,
  host: string,
  port: string
) {
  // rootUser/rootPass/host/port are kept for signature compatibility,
  // but creation is delegated to tenantDbService, which uses its own master config.
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
  console.info('[dbManager] Running migrations for tenant:', dbName);

  try {
    // Call the async migration function with connection details
    await runTenantMigration(dbName, rootUser, rootPass, host, port);
    console.info('[dbManager] Migrations completed successfully for:', dbName);
  } catch (error: any) {
    console.error('[dbManager] Migration execution failed:', error.message);
    throw new Error(`Failed to run migrations for ${dbName}: ${error.message}`);
  }
}

//
// Drop Tenant DB + User
//
export async function dropTenantDatabaseAndUserWrapper(
  dbName: string,
  tenantUser: string,
  rootUser: string,
  rootPass: string,
  host: string,
  port: string
) {
  // rootUser/rootPass/host/port kept for compatibility; actual drop uses tenantDbService
  await dropTenantDatabaseAndUser({
    dbName,
    dbUser: tenantUser,
  });
}

export { dropTenantDatabaseAndUserWrapper as dropTenantDatabaseAndUser };
