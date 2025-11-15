import { execSync } from 'child_process';

/**
 * This script is executed as a separate process to avoid file-locking issues on Windows.
 * It receives the tenant's database URL via an environment variable and runs 'prisma db push'.
 */
function runMigration() {
  const tenantDbUrl = process.env.DATABASE_URL_TENANT;

  if (!tenantDbUrl) {
    console.error('[Migration Script] Error: DATABASE_URL_TENANT environment variable not provided.');
    process.exit(1);
  }

  console.log(`[Migration Script] Starting 'prisma db push' for database...`);

  try {
    // Execute the prisma command. It will use the DATABASE_URL_TENANT from the environment.
    execSync(`npx prisma db push --schema=./prisma/schema.prisma --force-reset`, {
      stdio: 'inherit', // Show the output of the command in your server's console
    });
    console.log(`[Migration Script] Successfully applied schema to the new tenant database.`);
  } catch (error) {
    console.error(`[Migration Script] Failed to apply schema:`, error);
    process.exit(1); // Exit with an error code
  }
}

runMigration();