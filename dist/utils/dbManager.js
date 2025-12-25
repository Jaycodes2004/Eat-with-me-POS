"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantPrismaClientWithParams = getTenantPrismaClientWithParams;
exports.createTenantDatabaseAndUser = createTenantDatabaseAndUser;
exports.runMigrationsForTenant = runMigrationsForTenant;
exports.dropTenantDatabaseAndUserWrapper = dropTenantDatabaseAndUserWrapper;
exports.dropTenantDatabaseAndUser = dropTenantDatabaseAndUserWrapper;
const tenantDbService_1 = require("../services/tenantDbService");
const tenant_1 = require("../generated/tenant");
const runTenantMigration_1 = require("./runTenantMigration");
// Cache for Prisma Clients
const prismaClients = {};
function encode(val) {
    return encodeURIComponent(val);
}
//
// Tenant Prisma Client
//
function getTenantPrismaClientWithParams(dbName, dbUser, dbPass, dbHost, dbPort) {
    if (prismaClients[dbName])
        return prismaClients[dbName];
    const safePass = encode(dbPass);
    const url = `postgresql://${dbUser}:${safePass}@${dbHost}:${dbPort}/${dbName}?schema=public&sslmode=require`;
    // Keep envs in sync for Prisma tools that might read DATABASE_URL
    process.env.DATABASE_URL = url;
    process.env.DATABASE_URL_TENANT = url;
    const client = new tenant_1.PrismaClient({
        datasources: { db: { url } },
    });
    prismaClients[dbName] = client;
    return client;
}
//
// Create Tenant DB + User
//
async function createTenantDatabaseAndUser(dbName, tenantUser, tenantPass, rootUser, rootPass, host, port) {
    // rootUser/rootPass/host/port are kept for signature compatibility,
    // but creation is delegated to tenantDbService, which uses its own master config.
    await (0, tenantDbService_1.createTenantUserAndDatabase)({
        dbName,
        dbUser: tenantUser,
        dbPassword: tenantPass,
    });
}
//
// Run Prisma migrations for tenant
//
async function runMigrationsForTenant(dbName, rootUser, rootPass, host, port) {
    console.info('[dbManager] Running migrations for tenant:', dbName);
    try {
        // Call the async migration function with connection details
        await (0, runTenantMigration_1.runTenantMigration)(dbName, rootUser, rootPass, host, port);
        console.info('[dbManager] Migrations completed successfully for:', dbName);
    }
    catch (error) {
        console.error('[dbManager] Migration execution failed:', error.message);
        throw new Error(`Failed to run migrations for ${dbName}: ${error.message}`);
    }
}
//
// Drop Tenant DB + User
//
async function dropTenantDatabaseAndUserWrapper(dbName, tenantUser, rootUser, rootPass, host, port) {
    // rootUser/rootPass/host/port kept for compatibility; actual drop uses tenantDbService
    await (0, tenantDbService_1.dropTenantDatabaseAndUser)({
        dbName,
        dbUser: tenantUser,
    });
}
//# sourceMappingURL=dbManager.js.map