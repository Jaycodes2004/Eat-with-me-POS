// /** @format */

// import { PrismaClient } from '@prisma/client';
// import { preloadSecrets } from '../utils/awsSecrets';

// const prismClientCache: Map<string, PrismaClient> = new Map();

// interface DatabaseCredentials {
// 	host: string;
// 	port: number;
// 	username: string;
// 	password: string;
// 	database: string;
// }

// export async function getPrismClientForRestaurant(restaurantId: string) {
// 	console.log(
// 		`[getPrismClientForRestaurant] Creating tenant client for restaurant: ${restaurantId}`
// 	);

// 	if (prismClientCache.has(restaurantId)) {
// 		console.log(
// 			`[getPrismClientForRestaurant] Using cached Prisma client for tenant: ${restaurantId}`
// 		);
// 		return prismClientCache.get(restaurantId)!;
// 	}

// 	// For now, assume a single tenant schema per process and build URL
// 	// from env/Secrets using restaurantId to pick credentials if needed.
// 	const dbName = process.env.TENANT_DB_NAME || `tenant_${restaurantId}`;
// 	const credentials = await loadDatabaseCredentials(dbName, restaurantId);
// 	const tenantDatabaseUrl = buildConnectionString(credentials);

// 	const tenantPrisma = new PrismaClient({
// 		datasources: {
// 			db: {
// 				url: tenantDatabaseUrl,
// 			},
// 		},
// 	});

// 	// Test connection
// 	await tenantPrisma.$queryRaw`SELECT 1`;

// 	console.log(
// 		`[getPrismClientForRestaurant] Successfully connected to tenant database: ${dbName}`
// 	);

// 	prismClientCache.set(restaurantId, tenantPrisma);
// 	return tenantPrisma;
// }

// async function loadDatabaseCredentials(
// 	dbName: string,
// 	restaurantId: string
// ): Promise<DatabaseCredentials> {
// 	const isDevelopment = process.env.NODE_ENV === 'development';

// 	if (isDevelopment) {
// 		console.log(
// 			`[loadDatabaseCredentials] Development mode - loading from environment variables`
// 		);

// 		const hostKey = `TENANT_DB_HOST_${restaurantId}`;
// 		const portKey = `TENANT_DB_PORT_${restaurantId}`;
// 		const userKey = `TENANT_DB_USER_${restaurantId}`;
// 		const passwordKey = `TENANT_DB_PASSWORD_${restaurantId}`;

// 		if (
// 			process.env[hostKey] &&
// 			process.env[userKey] &&
// 			process.env[passwordKey]
// 		) {
// 			console.log(
// 				`[loadDatabaseCredentials] Using restaurant-specific credentials for ${restaurantId}`
// 			);

// 			return {
// 				host: process.env[hostKey]!,
// 				port: parseInt(process.env[portKey] || '5432', 10),
// 				username: process.env[userKey]!,
// 				password: process.env[passwordKey]!,
// 				database: dbName,
// 			};
// 		}

// 		console.log(
// 			`[loadDatabaseCredentials] Using generic tenant credentials from env`
// 		);

// 		return {
// 			host: process.env.TENANT_DB_HOST || 'localhost',
// 			port: parseInt(process.env.TENANT_DB_PORT || '5432', 10),
// 			username: process.env.TENANT_DB_USER || 'postgres',
// 			password: process.env.TENANT_DB_PASSWORD || '',
// 			database: dbName,
// 		};
// 	}

// 	console.log(
// 		`[loadDatabaseCredentials]
//     Secrets Manager`
// 	);

// 	try {
// 		const secrets = await preloadSecrets([
// 			`TENANT_DB_HOST_${restaurantId}`,
// 			`TENANT_DB_PORT_${restaurantId}`,
// 			`TENANT_DB_USER_${restaurantId}`,
// 			`TENANT_DB_PASSWORD_${restaurantId}`,
// 		]);

// 		const hostKey = `TENANT_DB_HOST_${restaurantId}`;
// 		const portKey = `TENANT_DB_PORT_${restaurantId}`;
// 		const userKey = `TENANT_DB_USER_${restaurantId}`;
// 		const passwordKey = `TENANT_DB_PASSWORD_${restaurantId}`;

// 		return {
// 			host: secrets[hostKey],
// 			port: parseInt(secrets[portKey] || '5432', 10),
// 			username: secrets[userKey],
// 			password: secrets[passwordKey],
// 			database: dbName,
// 		};
// 	} catch (error) {
// 		console.error(
// 			`[loadDatabaseCredentials] Failed to load credentials from Secrets Manager`,
// 			error
// 		);
// 		throw new Error(
// 			`Could not load database credentials for restaurant ${restaurantId} from Secrets Manager`
// 		);
// 	}
// }

// function buildConnectionString(credentials: DatabaseCredentials): string {
// 	return `postgresql://${encodeURIComponent(
// 		credentials.username
// 	)}:${encodeURIComponent(credentials.password)}@${credentials.host}:${
// 		credentials.port
// 	}/${credentials.database}?sslmode=no-verify`;
// }



/** @format */
import { PrismaClient } from '../generated/tenant';

const prismClientCache: Map<string, PrismaClient> = new Map();

interface DatabaseCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export async function getPrismClientForRestaurant(
  restaurantId: string,
  dbHost: string,
  dbPort: number,
  dbUser: string,
  dbPassword: string,
  dbName: string
) {
  console.log(
    `[getPrismClientForRestaurant] Creating tenant client for restaurant: ${restaurantId}`
  );

  const cacheKey = restaurantId;

  if (prismClientCache.has(cacheKey)) {
    console.log(
      `[getPrismClientForRestaurant] Using cached Prisma client for tenant: ${restaurantId}`
    );
    return prismClientCache.get(cacheKey)!;
  }

  try {
    const tenantDatabaseUrl = buildConnectionString({
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPassword,
      database: dbName,
    });

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
      `[getPrismClientForRestaurant] Successfully connected to tenant database for restaurant: ${restaurantId}`
    );

    // Cache the client
    prismClientCache.set(cacheKey, tenantPrisma);

    return tenantPrisma;
  } catch (error: any) {
    console.error(
      `[getPrismClientForRestaurant] Failed to create client for restaurant ${restaurantId}:`,
      error.message
    );
    throw new Error(
      `Failed to create Prisma client for restaurant ${restaurantId}: ${error.message}`
    );
  }
}

function buildConnectionString(credentials: DatabaseCredentials): string {
  return `postgresql://${encodeURIComponent(
    credentials.username
  )}:${encodeURIComponent(credentials.password)}@${credentials.host}:${
    credentials.port
  }/${credentials.database}?schema=public&sslmode=no-verify`;
}

/**
 * Clear cache (useful for testing or forced reconnection)
 */
export function clearPrismClientCache(): void {
  console.log('[getPrismClientForRestaurant] Clearing Prisma client cache');
  prismClientCache.forEach((client) => {
    client.$disconnect().catch((err: any) =>
      console.error('Error disconnecting cached client:', err)
    );
  });
  prismClientCache.clear();
}
