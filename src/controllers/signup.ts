/** @format */

// import axios from 'axios';
// import { Request, Response } from 'express';
// // --- FIX: Use a direct relative path to the generated master client ---
// import { createTenantDatabaseAndUser, getTenantPrismaClientWithParams, runMigrationsForTenant, dropTenantDatabaseAndUser } from '../utils/dbManager';
// import { preloadSecrets } from '../utils/awsSecrets';
// import bcrypt from 'bcryptjs';

// async function generateUniqueRestaurantId(): Promise<string> {
//   let isUnique = false;
//   let restaurantId = '';
//   while (!isUnique) {
//     restaurantId = Math.floor(1000000 + Math.random() * 9000000).toString();
//     // Use admin backend API to check tenant by restaurantId
//     try {
//       const res = await axios.get(`https://admin.easytomanage.xyz/api/tenants/${restaurantId}`);
//       if (!res.data) {
//         isUnique = true;
//       }
//     } catch (err) {
//       // If 404, it's unique
//       isUnique = true;
//     }
//   }
//   return restaurantId;
// }

// export async function signup(req: Request, res: Response) {
//   // masterPrisma should be initialized at app startup, not here
//   const { restaurantName, adminName, email, password, confirmPassword, useRedis, country, plan } = req.body;

//   const normalizedUseRedis = typeof useRedis === 'string'
//     ? useRedis.toLowerCase() === 'true'
//     : Boolean(useRedis);
//   const confirmedPassword = confirmPassword ?? password;

//   console.info('[Signup] Incoming request', {
//     restaurantName,
//     adminName,
//     email,
//     country,
//     useRedis: normalizedUseRedis,
//     hasPassword: Boolean(password),
//     hasConfirmPassword: Boolean(confirmPassword),
//   });

//   if (!password) {
//     console.warn('[Signup] Missing password', { email });
//     return res.status(400).json({ message: 'Password is required' });
//   }

//   if (password !== confirmedPassword) {
//     console.warn('[Signup] Password mismatch detected', { email });
//     return res.status(400).json({ message: "Passwords do not match" });
//   }

//   let restaurantId: string | null = null;
//   let dbName: string | null = null;
//   let dbUser: string | null = null;
//   let dbPassword: string | null = null;
//     let masterDbUser: string | null = null;
//     let masterDbPass: string | null = null;
//     let masterDbHost: string | null = null;
//     let masterDbPort: string | null = null;

//   try {
//     console.info('[Signup] Checking for existing tenant', { email });
//     // Use admin backend API to check tenant by email
//     let tenantExists = false;
//     try {
//       const resTenant = await axios.get(`https://admin.easytomanage.xyz/api/tenants?email=${encodeURIComponent(email)}`);
//       if (resTenant.data) {
//         tenantExists = true;
//       }
//     } catch (err) {
//       // If 404, tenant does not exist
//       tenantExists = false;
//     }
//     if (tenantExists) {
//       console.warn('[Signup] Tenant already exists', { email });
//       return res.status(409).json({ message: 'A restaurant with this email already exists.' });
//     }

//     // 1. Generate unique identifiers
//     console.info('[Signup] Generating identifiers');
//     restaurantId = await generateUniqueRestaurantId();
//     dbName = `tenant_${restaurantId}`;
//     dbUser = `user_${restaurantId}`;
//     dbPassword = `pass_${Math.random().toString(36).slice(-8)}`;

//     // Load DB connection secrets from AWS Parameter Store
//     const secrets = await preloadSecrets([
//       '/eatwithme/db-user',
//       '/eatwithme/db-password',
//       '/eatwithme/db-host',
//       '/eatwithme/db-port',
//     ]);
//       masterDbUser = secrets['/eatwithme/db-user'];
//       masterDbPass = secrets['/eatwithme/db-password'];
//       masterDbHost = secrets['/eatwithme/db-host'];
//       masterDbPort = secrets['/eatwithme/db-port'];

//     // 2. Create DB and User in PostgreSQL
//     console.info('[Signup] Creating tenant database and user', { restaurantId, dbName, dbUser });
//     await createTenantDatabaseAndUser(
//       dbName,
//       dbUser,
//       dbPassword,
//       masterDbUser,
//       masterDbPass,
//       masterDbHost,
//       masterDbPort
//     );

//     // 3. Create tenant record in Master DB
//     console.info('[Signup] Creating tenant record in master DB', { restaurantId });
//     // Use admin backend API to create tenant
//     let newTenantId = restaurantId;
//     try {
//       const resNewTenant = await axios.post(`https://admin.easytomanage.xyz/api/tenants`, {
//         name: restaurantName,
//         email,
//         restaurantId,
//         dbName,
//         dbUser,
//         dbPassword,
//         useRedis: normalizedUseRedis,
//         plan,
//       });
//       if (resNewTenant.data && resNewTenant.data.restaurantId) {
//         newTenantId = resNewTenant.data.restaurantId;
//       }
//     } catch (err: any) {
//       console.error("[Signup] Admin backend tenant create failed", {
//         restaurantId,
//         email,
//         status: err?.response?.status,
//         data: err?.response?.data,
//         message: err?.message,
//       });
//       return res.status(500).json({ message: 'Failed to create tenant in master DB.' });
//     }

//     // 4. Apply migrations to the new tenant DB
//     console.info('[Signup] Running migrations for tenant', { restaurantId });
//     await runMigrationsForTenant(
//       dbName,
//       masterDbUser,
//       masterDbPass,
//       masterDbHost,
//       masterDbPort
//     );

//     // 5. Connect to the new tenant DB to seed initial data
//     console.info('[Signup] Connecting to tenant DB', { restaurantId });
//     const tenantPrisma = getTenantPrismaClientWithParams(
//       dbName,
//       masterDbUser,
//       masterDbPass,
//       masterDbHost,
//       masterDbPort
//     );

//     // 6. Seed Admin Role
//   console.info('[Signup] Seeding admin role', { restaurantId });
//   const adminRole = await tenantPrisma.role.create({
//       data: {
//         name: 'Admin',
//         permissions: ['all_access'],
//         dashboardModules: ['dashboard', 'pos', 'reports', 'staff', 'inventory', 'menu', 'tables'],
//       } as any,
//     });

//     // 7. Seed Admin User
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//   console.info('[Signup] Seeding admin user', { restaurantId, adminEmail: email });
//   await tenantPrisma.staff.create({
//       data: {
//         name: adminName,
//         email,
//         password: hashedPassword,
//         phone: '',
//         pin: '0000',
//         permissions: ['all_access'],
//         dashboardModules: ['dashboard', 'pos', 'reports', 'staff', 'inventory', 'menu', 'tables'],
//         role: {
//           connect: {
//             id: adminRole.id,
//           },
//         },
//       } as any,
//     });

//     // 8. Seed Restaurant Settings with sensible defaults
//   console.info('[Signup] Seeding restaurant settings', { restaurantId });
//   await tenantPrisma.restaurant.create({
//       data: {
//         id: restaurantId,
//         name: restaurantName,
//         country: country || 'India',
//         currency: country === 'United States' ? 'USD' : country === 'United Kingdom' ? 'GBP' : 'INR',
//         currencySymbol: country === 'United States' ? '$' : country === 'United Kingdom' ? '£' : '₹',
//         language: 'English',
//         theme: 'light',
//         notifications: true,
//         autoBackup: false,
//       } as any,
//     });

//     // 9. Seed some default categories (menu & expense)
//     const defaultCategories = [
//       { name: 'Starters', color: '#F97316', type: 'menu' },
//       { name: 'Main Course', color: '#2563EB', type: 'menu' },
//       { name: 'Desserts', color: '#EC4899', type: 'menu' },
//       { name: 'Beverages', color: '#0EA5E9', type: 'menu' },
//       { name: 'Utilities', color: '#14B8A6', type: 'expense' },
//       { name: 'Staff Salaries', color: '#F59E0B', type: 'expense' },
//     ];
//   console.info('[Signup] Seeding default categories', { restaurantId, count: defaultCategories.length });
//   await tenantPrisma.category.createMany({ data: defaultCategories as any });

//     // 10. Seed a couple of tables for quick start
//     const defaultTables = Array.from({ length: 6 }).map((_, index) => ({
//       number: index + 1,
//       capacity: index < 4 ? 4 : 6,
//       status: 'FREE',
//     }));
//     console.info('[Signup] Seeding default tables', { restaurantId, count: defaultTables.length });
//     await tenantPrisma.table.createMany({ data: defaultTables as any });

//     console.info('[Signup] Signup successful', { restaurantId, email });
//     res.status(201).json({
//       message: 'Restaurant created successfully!',
//       restaurantId: newTenantId,
//     });

//   } catch (error: any) {
//   console.error('[Signup] Failed', { restaurantId, email, error: error?.message, stack: error?.stack });
//     // Cleanup logic in case of failure
//     if (restaurantId && dbName && dbUser && dbPassword) {
//       console.log(`Attempting to clean up resources for failed signup of restaurantId: ${restaurantId}`);
//       try {
//         await dropTenantDatabaseAndUser(
//           dbName,
//           dbUser,
//           masterDbUser || '',
//           masterDbPass || '',
//           masterDbHost || '',
//           masterDbPort || ''
//         );
//         // Also remove the record from the master DB if it was created
//         // Use admin backend API to delete tenant by restaurantId
//         try {
//           await axios.delete(`https://admin.easytomanage.xyz/api/tenants/${restaurantId}`);
//         } catch (err) {
//           // Ignore cleanup errors
//         }
//         console.log(`Cleanup successful for restaurantId: ${restaurantId}`);
//       } catch (cleanupError) {
//         console.error(`CRITICAL: Failed to clean up resources for restaurantId: ${restaurantId}`, cleanupError);
//       }
//     }
//     res.status(500).json({ message: 'Failed to create restaurant.', error: error.message });
//   }
// }

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

		// 6. Connect to tenant DB
		console.info('[Signup] Connecting to tenant DB', { restaurantId });
		// const tenantPrisma = getTenantPrismaClientWithParams(
		//   dbName,
		//   masterDbUser,
		//   masterDbPass,
		//   masterDbHost,
		//   masterDbPort
		// );

		const tenantPrisma = getTenantPrismaClientWithParams(
			dbName,
			dbUser!,
			dbPassword!,
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

		// 8. Seed admin user
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		console.info('[Signup] Seeding admin user', {
			restaurantId,
			adminEmail: email,
		});
		await tenantPrisma.staff.create({
			data: {
				name: adminName,
				email,
				password: hashedPassword,
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

		// 9. Seed restaurant settings
		console.info('[Signup] Seeding restaurant settings', { restaurantId });
		await tenantPrisma.restaurant.create({
			data: {
				id: restaurantId,
				name: restaurantName,
				country: country || 'India',
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
				// REMOVE old `plan` field if present
				planId, // NEW: bind admin plan id
			} as any,
		});

		// 10. Seed default categories
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

		// 11. Seed default tables
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

		console.info('[Signup] Signup successful', { restaurantId, email });
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
