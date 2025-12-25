"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantPrismaClientWithParams = getTenantPrismaClientWithParams;
exports.createTenantDatabaseAndUser = createTenantDatabaseAndUser;
exports.runMigrationsForTenant = runMigrationsForTenant;
exports.dropTenantDatabaseAndUserWrapper = dropTenantDatabaseAndUserWrapper;
exports.dropTenantDatabaseAndUser = dropTenantDatabaseAndUserWrapper;
exports.clearPrismaClientCache = clearPrismaClientCache;
exports.getPrismaClientStats = getPrismaClientStats;
// src/utils/dbManager.ts
const tenantDbService_1 = require("../services/tenantDbService");
const tenant_1 = require("../generated/tenant");
const runTenantMigration_1 = require("./runTenantMigration");
// Cache for Prisma Clients
const prismaClients = {};
function encode(val) {
    return encodeURIComponent(val);
}
//
// Tenant Prisma Client with all 5 parameters
//
function getTenantPrismaClientWithParams(dbName, dbUser, dbPass, dbHost, dbPort) {
    const cacheKey = dbName;
    if (prismaClients[cacheKey]) {
        console.log('[dbManager] Using cached Prisma client for tenant database:', dbName);
        return prismaClients[cacheKey];
    }
    const safePass = encode(dbPass);
    const url = `postgresql://${dbUser}:${safePass}@${dbHost}:${dbPort}/${dbName}?schema=public&sslmode=require`;
    console.log('[dbManager] Creating new Prisma client for:', dbName);
    console.log('[dbManager] Database connection details - Host:', dbHost, 'Port:', dbPort, 'Database:', dbName);
    // Keep envs in sync for Prisma tools that might read DATABASE_URL
    process.env.DATABASE_URL = url;
    process.env.DATABASE_URL_TENANT = url;
    const client = new tenant_1.PrismaClient({
        datasources: { db: { url } },
    });
    prismaClients[cacheKey] = client;
    console.log('[dbManager] Prisma client created and cached for:', dbName);
    return client;
}
//
// Create Tenant DB + User
//
async function createTenantDatabaseAndUser(dbName, tenantUser, tenantPass, rootUser, rootPass, host, port) {
    console.info('[dbManager] Creating tenant database and user', {
        dbName,
        tenantUser,
        host,
        port,
    });
    try {
        // rootUser/rootPass/host/port are kept for signature compatibility,
        // but creation is delegated to tenantDbService, which uses its own master config.
        await (0, tenantDbService_1.createTenantUserAndDatabase)({
            dbName,
            dbUser: tenantUser,
            dbPassword: tenantPass,
        });
        console.info('[dbManager] Tenant database and user created successfully', {
            dbName,
            tenantUser,
        });
    }
    catch (error) {
        console.error('[dbManager] Failed to create tenant database and user', {
            dbName,
            tenantUser,
            error: error.message,
        });
        throw error;
    }
}
//
// Run Prisma migrations for tenant
//
async function runMigrationsForTenant(dbName, rootUser, rootPass, host, port) {
    console.info('[dbManager] Starting migrations for tenant:', dbName);
    try {
        console.info('[dbManager] Calling runTenantMigration with connection details', {
            dbName,
            host,
            port,
        });
        await (0, runTenantMigration_1.runTenantMigration)(dbName, rootUser, rootPass, host, port);
        console.info('[dbManager] Migrations completed successfully for:', dbName);
    }
    catch (error) {
        console.error('[dbManager] Migration execution failed for:', dbName);
        console.error('[dbManager] Error details:', error.message);
        throw new Error(`Failed to run migrations for ${dbName}: ${error.message}`);
    }
}
//
// Drop Tenant DB + User
//
async function dropTenantDatabaseAndUserWrapper(dbName, tenantUser, rootUser, rootPass, host, port) {
    console.info('[dbManager] Dropping tenant database and user', {
        dbName,
        tenantUser,
        host,
        port,
    });
    try {
        // rootUser/rootPass/host/port kept for compatibility; actual drop uses tenantDbService
        await (0, tenantDbService_1.dropTenantDatabaseAndUser)({
            dbName,
            dbUser: tenantUser,
        });
        console.info('[dbManager] Tenant database and user dropped successfully', {
            dbName,
            tenantUser,
        });
    }
    catch (error) {
        console.error('[dbManager] Failed to drop tenant database and user', {
            dbName,
            tenantUser,
            error: error.message,
        });
        throw error;
    }
}
//
// Clear Prisma Client Cache (Helper function)
//
function clearPrismaClientCache() {
    console.log('[dbManager] Clearing Prisma client cache');
    Object.entries(prismaClients).forEach(([key, client]) => {
        client
            .$disconnect()
            .then(() => console.log(`[dbManager] Disconnected client for ${key}`))
            .catch((err) => console.error(`[dbManager] Error disconnecting ${key}:`, err));
    });
    Object.keys(prismaClients).forEach((key) => delete prismaClients[key]);
}
//
// Get Prisma Client Cache Stats (Helper function)
//
function getPrismaClientStats() {
    return {
        cachedClients: Object.keys(prismaClients),
        count: Object.keys(prismaClients).length,
    };
}
//# sourceMappingURL=dbManager.js.map