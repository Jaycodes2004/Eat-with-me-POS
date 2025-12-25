/** @format */

// src/utils/dbManager.ts

import {
	createTenantUserAndDatabase,
	dropTenantDatabaseAndUser,
} from '../services/tenantDbService';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';
import { runTenantMigration } from './runTenantMigration';

// Cache for Prisma Clients
const prismaClients: Record<string, TenantPrismaClient> = {};

function encode(val: string) {
	return encodeURIComponent(val);
}

//
// Tenant Prisma Client with all 5 parameters
//
export function getTenantPrismaClientWithParams(
	dbName: string,
	dbUser: string,
	dbPass: string,
	dbHost: string,
	dbPort: string
): TenantPrismaClient {
	const cacheKey = dbName;

	if (prismaClients[cacheKey]) {
		console.log(
			'[dbManager] Using cached Prisma client for tenant database:',
			dbName
		);
		return prismaClients[cacheKey];
	}

	const safePass = encode(dbPass);
	const url = `postgresql://${dbUser}:${safePass}@${dbHost}:${dbPort}/${dbName}?schema=public&sslmode=require`;

	console.log('[dbManager] Creating new Prisma client for:', dbName);
	console.log(
		'[dbManager] Database connection details - Host:',
		dbHost,
		'Port:',
		dbPort,
		'Database:',
		dbName
	);

	// Keep envs in sync for Prisma tools that might read DATABASE_URL
	process.env.DATABASE_URL = url;
	process.env.DATABASE_URL_TENANT = url;

	const client = new TenantPrismaClient({
		datasources: { db: { url } },
	});

	prismaClients[cacheKey] = client;
	console.log('[dbManager] Prisma client created and cached for:', dbName);
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
	console.info('[dbManager] Creating tenant database and user', {
		dbName,
		tenantUser,
		host,
		port,
	});

	try {
		// rootUser/rootPass/host/port are kept for signature compatibility,
		// but creation is delegated to tenantDbService, which uses its own master config.
		await createTenantUserAndDatabase({
			dbName,
			dbUser: tenantUser,
			dbPassword: tenantPass,
		});

		console.info('[dbManager] Tenant database and user created successfully', {
			dbName,
			tenantUser,
		});
	} catch (error: any) {
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
export async function runMigrationsForTenant(
	dbName: string,
	rootUser: string,
	rootPass: string,
	host: string,
	port: string
) {
	console.info('[dbManager] Starting migrations for tenant:', dbName);

	try {
		console.info(
			'[dbManager] Calling runTenantMigration with connection details',
			{
				dbName,
				host,
				port,
			}
		);

		await runTenantMigration(dbName, rootUser, rootPass, host, port);

		console.info('[dbManager] Migrations completed successfully for:', dbName);
	} catch (error: any) {
		console.error('[dbManager] Migration execution failed for:', dbName);
		console.error('[dbManager] Error details:', error.message);
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
	console.info('[dbManager] Dropping tenant database and user', {
		dbName,
		tenantUser,
		host,
		port,
	});

	try {
		// rootUser/rootPass/host/port kept for compatibility; actual drop uses tenantDbService
		await dropTenantDatabaseAndUser({
			dbName,
			dbUser: tenantUser,
		});

		console.info('[dbManager] Tenant database and user dropped successfully', {
			dbName,
			tenantUser,
		});
	} catch (error: any) {
		console.error('[dbManager] Failed to drop tenant database and user', {
			dbName,
			tenantUser,
			error: error.message,
		});
		throw error;
	}
}

export { dropTenantDatabaseAndUserWrapper as dropTenantDatabaseAndUser };

//
// Clear Prisma Client Cache (Helper function)
//
export function clearPrismaClientCache(): void {
	console.log('[dbManager] Clearing Prisma client cache');
	Object.entries(prismaClients).forEach(([key, client]) => {
		client
			.$disconnect()
			.then(() => console.log(`[dbManager] Disconnected client for ${key}`))
			.catch((err: any) =>
				console.error(`[dbManager] Error disconnecting ${key}:`, err)
			);
	});
	Object.keys(prismaClients).forEach((key) => delete prismaClients[key]);
}

//
// Get Prisma Client Cache Stats (Helper function)
//
export function getPrismaClientStats() {
	return {
		cachedClients: Object.keys(prismaClients),
		count: Object.keys(prismaClients).length,
	};
}
