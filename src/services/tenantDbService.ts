
import { Client } from "pg";

// Old DATABASE_URL_MASTER logic (commented out)
// const MASTER_DB_URL = process.env.DATABASE_URL_MASTER!;
// if (!MASTER_DB_URL) {
//   throw new Error("DATABASE_URL_MASTER is not defined");
// }

// New: Use individual env vars for master DB connection
const MASTER_DB_USER = process.env.MASTER_DB_USER;
const MASTER_DB_PASS = process.env.MASTER_DB_PASS;
const MASTER_DB_HOST = process.env.MASTER_DB_HOST;
const MASTER_DB_PORT = process.env.MASTER_DB_PORT || "5432";
const MASTER_DB_NAME = process.env.MASTER_DB_NAME || "master-db";

if (!MASTER_DB_USER || !MASTER_DB_PASS || !MASTER_DB_HOST) {
  throw new Error("Master DB env vars (MASTER_DB_USER/PASS/HOST) are not defined");
}

function createMasterClient() {
  const url = `postgresql://${encodeURIComponent(MASTER_DB_USER as string)}:${encodeURIComponent(MASTER_DB_PASS as string)}@${MASTER_DB_HOST as string}:${MASTER_DB_PORT}/${MASTER_DB_NAME}`;
  return new Client({
    connectionString: url,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

async function withMasterClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
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
    // 1) Create user
    await client.query(
      `CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword.replace(/'/g, "''")}'`,
    );
    // 2) Create database (must NOT be inside a transaction)
    await client.query(
      `CREATE DATABASE "${dbName}" OWNER "${dbUser}"`,
    );
  });
}

export async function dropTenantDatabaseAndUser(opts: { dbName: string; dbUser: string }) {
  const { dbName, dbUser } = opts;
  return withMasterClient(async (client) => {
    // 1) Terminate existing connections
    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName],
    );
    // 2) Drop database (must NOT be in a transaction)
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    // 3) Drop role
    await client.query(`DROP ROLE IF EXISTS "${dbUser}"`);
  });
}
