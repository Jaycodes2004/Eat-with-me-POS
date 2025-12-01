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
    console.info('[getPrismClientForRestaurant] Fetching tenant info for restaurant:', restaurantId);
    
    // Query the admin backend API to get tenant info
    let tenant;
    try {
      const resTenant = await axios.get(
      `${ADMIN_BACKEND_URL}/api/tenants?restaurantId=${restaurantId}`,        { timeout: 5000 } // Add timeout
      );
      tenant = resTenant.data;
      console.info('[getPrismClientForRestaurant] Got tenant info:', { dbName: tenant?.dbName, restaurantId });
    } catch (axiosError: any) {
      console.error('[getPrismClientForRestaurant] Axios error fetching tenant:', {
        status: axiosError.response?.status,
        message: axiosError.message,
        url: axiosError.config?.url
      });
      throw new Error(`Failed to fetch tenant info from admin backend: ${axiosError.message}`);
    }

    if (!tenant || !tenant.dbName) {
      throw new Error(`Invalid tenant data for restaurant ${restaurantId}`);
    }

    // Load database credentials from AWS Secrets Manager
    console.info('[getPrismClientForRestaurant] Loading database credentials');
    const secrets = await preloadSecrets([
      '/eatwithme/db-user',
      '/eatwithme/db-password',
      '/eatwithme/db-host',
      '/eatwithme/db-port',
    ]);

    if (!secrets['/eatwithme/db-user'] || !secrets['/eatwithme/db-password']) {
      throw new Error('Database credentials not found in AWS Secrets Manager');
    }

    console.info('[getPrismClientForRestaurant] Creating Prisma client for tenant database');
    
    // Create and return a Prisma client for the tenant database
    const prisma = getTenantPrismaClientWithParams(
      tenant.dbName,
      secrets['/eatwithme/db-user'],
      secrets['/eatwithme/db-password'],
      secrets['/eatwithme/db-host'],
      secrets['/eatwithme/db-port']
    );

    console.info('[getPrismClientForRestaurant] Prisma client created successfully');
    return prisma;
  } catch (error) {
    const errorMsg = (error as Error)?.message || String(error);
    console.error('[getPrismClientForRestaurant] Error connecting to tenant database:', errorMsg);
    throw error; // Re-throw for the controller to handle
  }
}
