import { execSync } from 'child_process';
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

  console.log('[runTenantMigration] Setting up tenant database:', dbName);

  try {
    console.log('[runTenantMigration] Executing Prisma migrations...');

    const schemaPath = path.join(process.cwd(), 'prisma', 'tenant.schema.prisma');

    execSync(
      `npx prisma migrate deploy --schema=${schemaPath}`,
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: url,
        },
      }
    );

    console.log('[runTenantMigration] Prisma migrations completed successfully for:', dbName);
  } catch (error: any) {
    console.error('[runTenantMigration] Migration failed:', error.message);
    throw new Error(`Prisma migration failed for ${dbName}: ${error.message}`);
  }
}
