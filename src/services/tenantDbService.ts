/** @format */

import { Client } from 'pg';

// New: Use individual env vars for master DB connection
const MASTER_DB_USER = process.env.MASTER_DB_USER;
const MASTER_DB_PASS = process.env.MASTER_DB_PASS;
const MASTER_DB_HOST = process.env.MASTER_DB_HOST;
const MASTER_DB_PORT = process.env.MASTER_DB_PORT || '5432';
const MASTER_DB_NAME = process.env.MASTER_DB_NAME || 'master-db';

if (!MASTER_DB_USER || !MASTER_DB_PASS || !MASTER_DB_HOST) {
	throw new Error(
		'Master DB env vars (MASTER_DB_USER/PASS/HOST) are not defined'
	);
}

function createMasterClient() {
  const url = `postgresql://${encodeURIComponent(MASTER_DB_USER as string)}:${encodeURIComponent(MASTER_DB_PASS as string)}@${MASTER_DB_HOST as string}:${MASTER_DB_PORT}/${MASTER_DB_NAME}`;
  return new Client({
    connectionString: url,  // ← NO query params
    ssl: {
      rejectUnauthorized: false,  // ← This handles self-signed certs
    },
  });
}


async function withMasterClient<T>(
	fn: (client: Client) => Promise<T>
): Promise<T> {
	const client = createMasterClient();
	await client.connect();
	try {
		return await fn(client);
	} finally {
		await client.end();
	}
}

export async function createTenantUserAndDatabase(opts: {
	dbUser: string;
	dbPassword: string;
	dbName: string;
}) {
	const { dbUser, dbPassword, dbName } = opts;

	return withMasterClient(async (client) => {
		// 1) Create tenant user
		await client.query(`CREATE USER ${dbUser} WITH PASSWORD $1`, [dbPassword]);

		// 2) Create tenant database from template tenant_db_001, owned by master user
		await client.query(
			`CREATE DATABASE "${dbName}" OWNER "${MASTER_DB_USER}" TEMPLATE tenant_db_001`
		);

		// 3) Connect to the new tenant DB as master and grant privileges
		const tenantClient = new Client({
			connectionString: `postgresql://${encodeURIComponent(
				MASTER_DB_USER as string
			)}:${encodeURIComponent(MASTER_DB_PASS as string)}@${
				MASTER_DB_HOST as string
			}:${MASTER_DB_PORT}/${dbName}?sslmode=no-verify`,
			ssl: {
				rejectUnauthorized: false,
			},
		});

		await tenantClient.connect();
		try {
			// Allow tenant user to use and create in public schema
			await tenantClient.query(
				`GRANT USAGE, CREATE ON SCHEMA public TO "${dbUser}"`
			);

			// Grant all on existing tables and sequences
			await tenantClient.query(
				`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${dbUser}"`
			);
			await tenantClient.query(
				`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${dbUser}"`
			);

			// Ensure future tables/sequences also grant to tenant user
			await tenantClient.query(
				`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}"`
			);
			await tenantClient.query(
				`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${dbUser}"`
			);
		} finally {
			await tenantClient.end();
		}
	});
}

export async function dropTenantDatabaseAndUser(opts: {
	dbName: string;
	dbUser: string;
}) {
	const { dbName, dbUser } = opts;

	return withMasterClient(async (client) => {
		// 1) Terminate existing connections
		await client.query(
			`SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
        WHERE datname = $1
          AND pid <> pg_backend_pid()`,
			[dbName]
		);

		// 2) Drop database (master user is still the owner)
		await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);

		// 3) Drop role
		await client.query(`DROP ROLE IF EXISTS "${dbUser}"`);
	});
}
