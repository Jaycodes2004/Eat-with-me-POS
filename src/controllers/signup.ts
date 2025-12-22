/** @format */

import axios from 'axios';
import { Request, Response } from 'express';
import {
  createTenantDatabaseAndUser,
  getTenantPrismaClientWithParams,
  runMigrationsForTenant,
  dropTenantDatabaseAndUser,
} from '../utils/dbManager';
import { getParameter } from '../utils/awsSecrets';
import bcrypt from 'bcryptjs';

const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL || 'https://admin.easytomanage.xyz';

async function generateUniqueRestaurantId(): Promise<string> {
  let isUnique = false;
  let restaurantId = '';

  while (!isUnique) {
    restaurantId = Math.floor(1000000 + Math.random() * 9000000).toString();

    try {
      const res = await axios.get(
        `${ADMIN_BASE_URL}/api/tenants/${restaurantId}`
      );

      if (!res.data) {
        isUnique = true;
      }
    } catch (_err) {
      // If 404 or network error, assume unique
      isUnique = true;
    }
  }

  return restaurantId;
}

// Load master DB credentials (dev: from env, prod: from SSM)
async function loadMasterDbConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    const masterDbUser =
      process.env.MASTER_DB_USER || process.env.DB_USER || 'postgres';
    const masterDbPass =
      process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || '';
    const masterDbHost =
      process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost';
    const masterDbPort =
      process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432';

    return { masterDbUser, masterDbPass, masterDbHost, masterDbPort };
  }

  // Production: get from SSM one by one (string, not string[])
  const [masterDbUser, masterDbPass, masterDbHost, masterDbPort] =
    await Promise.all([
      getParameter('/eatwithme/db-user'),
      getParameter('/eatwithme/db-password'),
      getParameter('/eatwithme/db-host'),
      getParameter('/eatwithme/db-port'),
    ]);

  return { masterDbUser, masterDbPass, masterDbHost, masterDbPort };
}

export async function signup(req: Request, res: Response) {
  console.log('[Signup] Raw request body:', req.body);

  const {
    restaurantName,
    adminName,
    email,
    password,
    confirmPassword,
    useRedis,
    country,
    planId,
    posType,
    businessAddress,
    businessPhone,
  } = req.body;

  const normalizedUseRedis =
    typeof useRedis === 'string'
      ? useRedis.toLowerCase() === 'true'
      : Boolean(useRedis);

  const confirmedPassword = confirmPassword ?? password;

  console.info('[Signup] Incoming request', {
    restaurantName,
    adminName,
    email,
    country,
    useRedis: normalizedUseRedis,
    hasPassword: Boolean(password),
    hasConfirmPassword: Boolean(confirmPassword),
  });

  if (!password) {
    console.warn('[Signup] Missing password', { email });
    return res.status(400).json({ message: 'Password is required' });
  }

  if (password !== confirmedPassword) {
    console.warn('[Signup] Password mismatch detected', { email });
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (!planId) {
    console.warn('[Signup] Missing planId', { email });
    return res.status(400).json({ message: 'planId is required' });
  }

  let restaurantId: string | null = null;
  let dbName: string | null = null;
  let dbUser: string | null = null;
  let dbPassword: string | null = null;

  try {
    console.info('[Signup] Checking for existing tenant', { email });

    // Check tenant by email via admin backend
    let tenantExists = false;

    try {
      const resTenant = await axios.get(
        `${ADMIN_BASE_URL}/api/tenants?email=${encodeURIComponent(email)}`
      );

      if (resTenant.data) {
        tenantExists = true;
      }
    } catch (_err) {
      tenantExists = false;
    }

    if (tenantExists) {
      console.warn('[Signup] Tenant already exists', { email });
      return res
        .status(409)
        .json({ message: 'A restaurant with this email already exists.' });
    }

    // 1. Generate identifiers
    console.info('[Signup] Generating identifiers');
    restaurantId = await generateUniqueRestaurantId();
    dbName = `tenant_${restaurantId}`;
    dbUser = `user_${restaurantId}`;
    dbPassword = `pass_${Math.random().toString(36).slice(-8)}`;

    // 2. Load master DB credentials (dev: env, prod: SSM)
    console.info('[Signup] Loading master DB config');
    const { masterDbUser, masterDbPass, masterDbHost, masterDbPort } =
      await loadMasterDbConfig();

    // 3. Create tenant DB and user
    console.info('[Signup] Creating tenant database and user', {
      restaurantId,
      dbName,
      dbUser,
    });

    await createTenantDatabaseAndUser(
      dbName,
      dbUser,
      dbPassword,
      masterDbUser,
      masterDbPass,
      masterDbHost,
      masterDbPort
    );

    // 4. Create tenant record in master DB via admin backend
    console.info('[Signup] Creating tenant record in master DB', {
      restaurantId,
    });

    let newTenantId = restaurantId;

    try {
      const resNewTenant = await axios.post(`${ADMIN_BASE_URL}/api/tenants`, {
        name: restaurantName,
        email,
        restaurantId,
        dbName,
        dbUser,
        dbPassword,
        useRedis: normalizedUseRedis,
        planId,
        address: businessAddress || '',
        phone: businessPhone || '',
        posType: posType || 'restaurant',
      });

      if (resNewTenant.data && resNewTenant.data.restaurantId) {
        newTenantId = resNewTenant.data.restaurantId;
      }
    } catch (err: any) {
      console.error('[Signup] Admin backend tenant create failed', {
        restaurantId,
        email,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });

      return res
        .status(500)
        .json({ message: 'Failed to create tenant in master DB.' });
    }

    // 5. Run migrations for tenant DB
    console.info('[Signup] Running migrations for tenant', { restaurantId });
    await runMigrationsForTenant(
      dbName,
      masterDbUser,
      masterDbPass,
      masterDbHost,
      masterDbPort
    );

    // 6. Connect to tenant DB using TENANT credentials (not master!)
    // ✅ FIX: Use dbUser and dbPassword (tenant user), not masterDbUser/masterDbPass
    console.info('[Signup] Connecting to tenant DB', { restaurantId });
    const tenantPrisma = getTenantPrismaClientWithParams(
      dbName,
      dbUser,           // ✅ TENANT user
      dbPassword,       // ✅ TENANT password
      masterDbHost,
      masterDbPort
    );

    // 7. Seed admin role
    console.info('[Signup] Seeding admin role', { restaurantId });
    const adminRole = await tenantPrisma.role.create({
      data: {
        name: 'Admin',
        permissions: ['all_access'],
        dashboardModules: [
          'dashboard',
          'pos',
          'reports',
          'staff',
          'inventory',
          'menu',
          'tables',
        ],
      } as any,
    });

    // 8. Seed admin user - Save adminName and email to tenant DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.info('[Signup] Seeding admin user', {
      restaurantId,
      adminEmail: email,
      adminName: adminName,
    });

    await tenantPrisma.staff.create({
      data: {
        name: adminName,                      // ✅ From signup
        email,                                 // ✅ From signup
        password: hashedPassword,              // ✅ From signup (hashed)
        phone: '',
        pin: '0000',
        permissions: ['all_access'],
        dashboardModules: [
          'dashboard',
          'pos',
          'reports',
          'staff',
          'inventory',
          'menu',
          'tables',
        ],
        role: {
          connect: {
            id: adminRole.id,
          },
        },
      } as any,
    });

    // 9. Fetch plan name from admin backend
    let planName = planId; // Default to planId if fetch fails
    try {
      const planRes = await axios.get(`${ADMIN_BASE_URL}/api/plans/${planId}`);
      if (planRes.data && planRes.data.name) {
        planName = planRes.data.name;
        console.info('[Signup] Plan name fetched successfully', { planId, planName });
      }
    } catch (err: any) {
      console.warn('[Signup] Failed to fetch plan name, using planId as fallback', {
        planId,
        error: err?.message,
      });
    }

    // 10. Seed restaurant settings - Save ALL signup data to tenant DB
    console.info('[Signup] Seeding restaurant settings in tenant DB', {
      restaurantId,
      signupData: {
        restaurantName,          // ✅
        country,                 // ✅
        businessPhone,           // ✅
        businessAddress,         // ✅
        planName,                // ✅ Plan name (not ID)
      },
    });

    await tenantPrisma.restaurant.create({
      data: {
        id: restaurantId,
        name: restaurantName,           // ✅ From signup
        country: country || 'India',    // ✅ From signup
        currency:
          country === 'United States'
            ? 'USD'
            : country === 'United Kingdom'
            ? 'GBP'
            : 'INR',
        currencySymbol:
          country === 'United States'
            ? '$'
            : country === 'United Kingdom'
            ? '£'
            : '₹',
        language: 'English',
        theme: 'light',
        notifications: true,
        autoBackup: false,
        planId: planName,                 // ✅ Plan name (instead of planId)
        address: businessAddress || '', // ✅ From signup
        phone: businessPhone || '',     // ✅ From signup
      } as any,
    });

    console.info('[Signup] Restaurant settings successfully saved to tenant DB', {
      restaurantId,
      savedFields: {
        id: restaurantId,
        name: restaurantName,
        country: country,
        phone: businessPhone,
        address: businessAddress,
        plan: planName,
      },
    });

    // 11. Seed default categories
    const defaultCategories = [
      { name: 'Starters', color: '#F97316', type: 'menu' },
      { name: 'Main Course', color: '#2563EB', type: 'menu' },
      { name: 'Desserts', color: '#EC4899', type: 'menu' },
      { name: 'Beverages', color: '#0EA5E9', type: 'menu' },
      { name: 'Utilities', color: '#14B8A6', type: 'expense' },
      { name: 'Staff Salaries', color: '#F59E0B', type: 'expense' },
    ];

    console.info('[Signup] Seeding default categories', {
      restaurantId,
      count: defaultCategories.length,
    });

    await tenantPrisma.category.createMany({
      data: defaultCategories as any,
    });

    // 12. Seed default tables
    const defaultTables = Array.from({ length: 6 }).map((_, index) => ({
      number: index + 1,
      capacity: index < 4 ? 4 : 6,
      status: 'FREE',
    }));

    console.info('[Signup] Seeding default tables', {
      restaurantId,
      count: defaultTables.length,
    });

    await tenantPrisma.table.createMany({ data: defaultTables as any });

    console.info('[Signup] Signup successful', {
      restaurantId,
      email,
      message: 'All signup data saved to both master DB and tenant DB',
    });

    return res.status(201).json({
      message: 'Restaurant created successfully!',
      restaurantId: newTenantId,
    });
  } catch (error: any) {
    console.error('[Signup] Failed', {
      restaurantId,
      email,
      error: error?.message,
      stack: error?.stack,
    });

    // Cleanup resources on failure
    if (restaurantId && dbName && dbUser && dbPassword) {
      console.log(
        `Attempting to clean up resources for failed signup of restaurantId: ${restaurantId}`
      );

      try {
        const { masterDbUser, masterDbPass, masterDbHost, masterDbPort } =
          await loadMasterDbConfig();

        await dropTenantDatabaseAndUser(
          dbName,
          dbUser,
          masterDbUser,
          masterDbPass,
          masterDbHost,
          masterDbPort
        );

        // Also remove the record from the master DB if it was created
        try {
          await axios.delete(`${ADMIN_BASE_URL}/api/tenants/${restaurantId}`);
        } catch (_err) {
          // Ignore cleanup API errors
        }

        console.log(`Cleanup successful for restaurantId: ${restaurantId}`);
      } catch (cleanupError) {
        console.error(
          `CRITICAL: Failed to clean up resources for restaurantId: ${restaurantId}`,
          cleanupError
        );
      }
    }

    return res
      .status(500)
      .json({ message: 'Failed to create restaurant.', error: error.message });
  }
}