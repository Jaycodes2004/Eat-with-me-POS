"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantPrismaClient = getTenantPrismaClient;
exports.createTenantDatabaseAndUser = createTenantDatabaseAndUser;
exports.runMigrationsForTenant = runMigrationsForTenant;
exports.dropTenantDatabaseAndUser = dropTenantDatabaseAndUser;
const child_process_1 = require("child_process");
const client_1 = require("@prisma/client");
const util_1 = __importDefault(require("util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
// A cache to hold tenant-specific Prisma Client instances
const prismaClients = {};
/**
 * Returns a cached or new Prisma Client instance for a specific tenant.
 * @param dbName The name of the tenant's database.
 */
function getTenantPrismaClient(dbName) {
    if (prismaClients[dbName]) {
        return prismaClients[dbName];
    }
    const databaseUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}?schema=public`;
    const client = new client_1.PrismaClient({
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
async function createTenantDatabaseAndUser(dbName, dbUser, dbPass) {
    const psqlCommand = `psql -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT}`;
    const env = Object.assign(Object.assign({}, process.env), { PGPASSWORD: process.env.DB_PASSWORD });
    await execPromise(`${psqlCommand} -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPass}';"`, { env });
    await execPromise(`${psqlCommand} -c "CREATE DATABASE ${dbName};"`, { env });
    await execPromise(`${psqlCommand} -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`, { env });
}
/**
 * Runs 'prisma migrate deploy' for a specific tenant's database.
 */
async function runMigrationsForTenant(dbName) {
    const databaseUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}?schema=public`;
    const command = `npx prisma migrate deploy --schema=./prisma/schema.prisma`;
    await execPromise(command, {
        env: Object.assign(Object.assign({}, process.env), { DATABASE_URL: databaseUrl, DATABASE_URL_TENANT: databaseUrl }),
    });
}
/**
 * Drops a tenant's database and user, for cleanup after a failed signup.
 */
async function dropTenantDatabaseAndUser(dbName, dbUser) {
    const psqlCommand = `psql -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT}`;
    const env = Object.assign(Object.assign({}, process.env), { PGPASSWORD: process.env.DB_PASSWORD });
    // Terminate all active connections to the target database before dropping it
    await execPromise(`${psqlCommand} -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbName}' AND pid <> pg_backend_pid();"`, { env });
    await execPromise(`${psqlCommand} -c "DROP DATABASE IF EXISTS ${dbName};"`, { env });
    await execPromise(`${psqlCommand} -c "DROP USER IF EXISTS ${dbUser};"`, { env });
}
//# sourceMappingURL=dbManager.js.map