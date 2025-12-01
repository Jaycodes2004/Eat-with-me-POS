import axios from 'axios';
import { getTenantPrismaClientWithParams } from '../utils/dbManager';
import { preloadSecrets } from '../utils/awsSecrets';

const ADMIN_BACKEND_URL = process.env.ADMIN_BACKEND_URL || 'https://admin.easytomanage.xyz';

/**
 * Get a Prisma client connected to a specific restaurant's tenant database
 * @param restaurantId - The restaurant ID to connect to
 * @returns A Prisma client for the tenant database
 */
export async function getPrismClientForRestaurant(restaurantId: string) {
  try {
    // Query the admin backend API to get tenant info
    const resTenant = await axios.get(`${ADMIN_BACKEND_URL}/api/tenants/${restaurantId}`);
    const tenant = resTenant.data;

    if (!tenant) {
      throw new Error(`Tenant not found for restaurant ID: ${restaurantId}`);
    }

    // Load database credentials from AWS Secrets Manager
    const secrets = await preloadSecrets([
      '/eatwithme/db-user',
      '/eatwithme/db-password',
      '/eatwithme/db-host',
      '/eatwithme/db-port',
    ]);

    // Create and return a Prisma client for the tenant database
    const prisma = getTenantPrismaClientWithParams(
      tenant.dbName,
      secrets['/eatwithme/db-user'],
      secrets['/eatwithme/db-password'],
      secrets['/eatwithme/db-host'],
      secrets['/eatwithme/db-port']
    );

    return prisma;
  } catch (error) {
    console.error('[getPrismClientForRestaurant] Error connecting to tenant database:', error);
    throw new Error(`Failed to connect to tenant database for restaurant ${restaurantId}: ${(error as Error)?.message}`);
  }
}
