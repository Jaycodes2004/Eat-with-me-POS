/** @format */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismClientForRestaurant } from '../lib/getPrismClientForRestaurant';

export async function login(req: Request, res: Response) {
	const { email, password } = req.body;
	const restaurantId = req.headers['x-restaurant-id'] as string;

	console.info('[Login] Incoming request', {
		email,
		hasPassword: Boolean(password),
		restaurantId,
	});

	// Validate restaurant ID
	if (!restaurantId) {
		console.warn('[Login] Missing restaurant ID', { email });
		return res
			.status(400)
			.json({
				message:
					'Restaurant ID is missing or invalid. Please provide it in the X-Restaurant-Id header.',
			});
	}

	// Validate credentials
	if (!email || !password) {
		console.warn('[Login] Missing credentials', {
			emailPresent: Boolean(email),
			passwordPresent: Boolean(password),
		});
		return res
			.status(400)
			.json({ message: 'Email and password are required.' });
	}

	try {
		// Get Prisma client for the restaurant
		const prisma = await getPrismClientForRestaurant(restaurantId);

		console.info('[Login] Looking up staff by email', { email, restaurantId });
		const staff = await prisma.staff.findUnique({ where: { email } });

		if (staff && (await bcrypt.compare(password, staff.password))) {
			console.info('[Login] Staff authenticated', { staffId: staff.id, email });
			const role = await prisma.role.findUnique({
				where: { id: staff.roleId },
			});
			const staffRecord = staff as any;
			const roleRecord = role as any;

			const tokenPayload = {
				staffId: staff.id,
				roleId: staff.roleId,
				restaurantId,
			};

			const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
				expiresIn: '1d',
			});

			const permissions: string[] =
				Array.isArray(staffRecord.permissions) &&
				staffRecord.permissions.length > 0
					? staffRecord.permissions
					: Array.isArray(roleRecord?.permissions)
					? roleRecord.permissions
					: [];

			const dashboardModules: string[] =
				Array.isArray(staffRecord.dashboardModules) &&
				staffRecord.dashboardModules.length > 0
					? staffRecord.dashboardModules
					: Array.isArray(roleRecord?.dashboardModules)
					? roleRecord.dashboardModules
					: [];

      res.json({
        accessToken,
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: role?.name || 'No Role',
          permissions,
          dashboardModules,
        },
        restaurant: {
          id: restaurantId,
          useRedis: false,
        },
      });
    } else {
      console.warn('[Login] Invalid credentials', { email, hasStaffRecord: Boolean(staff) });
      res.status(401).json({ message: 'Invalid credentials.' });
    }
  } catch (error) {
    console.error('[Login] Error', { email, restaurantId, error: (error as Error)?.message, stack: (error as Error)?.stack });
    res.status(500).json({ message: 'Internal server error during login.' });
  }
}
