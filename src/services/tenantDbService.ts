import { Client } from "pg";

const MASTER_DB_URL = process.env.DATABASE_URL_MASTER!;
if (!MASTER_DB_URL) {
  throw new Error("DATABASE_URL_MASTER is not defined");
}


function createMasterClient() {
  return new Client({
    connectionString: MASTER_DB_URL,
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
    await client.query("BEGIN");
    try {
      await client.query(
        `CREATE USER "${dbUser}" WITH PASSWORD $1`,
        [dbPassword],
      );
      await client.query(
        `CREATE DATABASE "${dbName}" OWNER "${dbUser}"`,
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}

export async function dropTenantDatabaseAndUser(opts: { dbName: string; dbUser: string }) {
  const { dbName, dbUser } = opts;
  return withMasterClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE datname = $1
           AND pid <> pg_backend_pid()`,
        [dbName],
      );
      await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      await client.query(`DROP ROLE IF EXISTS "${dbUser}"`);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}
