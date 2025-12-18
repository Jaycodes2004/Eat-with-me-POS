import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function runTenantMigration(
  dbName: string,
  user: string,
  password: string,
  host: string,
  port: string
): Promise<void> {
  const encodedPassword = encodeURIComponent(password);
  const url = `postgresql://${user}:${encodedPassword}@${host}:${port}/${dbName}?schema=public&sslmode=no-verify`;

  const client = new Client({
    connectionString: url,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('[runTenantMigration] Connected to tenant database:', dbName);

    // Read migration SQL file
    const migrationPath = path.join(
      process.cwd(),
      'prisma/migrations/001_create_tenant_tables.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('[runTenantMigration] Executing migration SQL...');

    // Execute migrations
    await client.query(migrationSQL);

    console.log('[runTenantMigration] Migration completed successfully for:', dbName);
  } catch (error: any) {
    console.error('[runTenantMigration] Migration failed:', error.message);
    throw new Error(`Migration failed for ${dbName}: ${error.message}`);
  } finally {
    await client.end();
  }
}