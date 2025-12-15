/** @format */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismClientForRestaurant } from '../lib/getPrismClientForRestaurant';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export async function login(req: Request, res: Response) {
  const { email, password, restaurantId: bodyRestaurantId } = req.body;
  const headerRestaurantId = req.headers['x-restaurant-id'];

  // Normalize restaurantId: prefer body, then header; ignore literal "undefined"
  const restaurantId =
    typeof bodyRestaurantId === 'string' && bodyRestaurantId !== 'undefined'
      ? bodyRestaurantId
      : typeof headerRestaurantId === 'string' &&
        headerRestaurantId !== 'undefined'
      ? headerRestaurantId
      : undefined;

  console.info('[Login] Incoming request', {
    email,
    hasPassword: Boolean(password),
    restaurantId,
    bodyRestaurantId,
    headerRestaurantId,
  });

  // Validate restaurant ID
  if (!restaurantId) {
    console.warn('[Login] Missing restaurant ID', {
      email,
      bodyRestaurantId,
      headerRestaurantId,
    });
    return res.status(400).json({
      message:
        'Restaurant ID is missing or invalid. Please send restaurantId in the request body or X-Restaurant-Id header.',
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

    console.info('[Login] Looking up staff by email', {
      email,
      restaurantId,
    });

    const staff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!staff) {
      console.warn('[Login] Staff not found', { email });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!staff.isActive) {
      console.warn('[Login] Staff inactive', { staffId: staff.id, email });
      return res
        .status(403)
        .json({ message: 'Account is inactive. Please contact admin.' });
    }

    const passwordMatch = await bcrypt.compare(password, staff.password);
    if (!passwordMatch) {
      console.warn('[Login] Invalid password', {
        email,
        staffId: staff.id,
      });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const staffRecord = staff as any;
    const roleRecord = (staff as any).role as any | null;

    // Merge role + staff permissions/modules
    const rolePermissions: string[] = Array.isArray(roleRecord?.permissions)
      ? roleRecord.permissions
      : [];
    const staffPermissions: string[] = Array.isArray(staffRecord.permissions)
      ? staffRecord.permissions
      : [];
    const permissions = Array.from(
      new Set([...rolePermissions, ...staffPermissions])
    );

    const roleModules: string[] = Array.isArray(roleRecord?.dashboardModules)
      ? roleRecord.dashboardModules
      : [];
    const staffModules: string[] = Array.isArray(staffRecord.dashboardModules)
      ? staffRecord.dashboardModules
      : [];
    const dashboardModules = Array.from(
      new Set([...roleModules, ...staffModules])
    );

    const tokenPayload = {
      sub: staff.id,
      staffId: staff.id,
      roleId: staff.roleId,
      restaurantId,
      permissions,
      dashboardModules,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    console.info('[Login] Staff authenticated', {
      staffId: staff.id,
      email,
      restaurantId,
    });

    return res.json({
      accessToken,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role?.name || 'No Role',
        permissions,
        dashboardModules,
      },
      restaurant: {
        id: restaurantId,
        useRedis: false,
      },
    });
  } catch (error) {
    const errorMsg = (error as Error)?.message || 'Unknown error';
    console.error('[Login] Error:', {
      email,
      restaurantId,
      error: errorMsg,
      stack: (error as Error)?.stack,
    });

    if (errorMsg.includes('Failed to fetch tenant info')) {
      return res.status(502).json({
        message: 'Unable to connect to restaurant service. Please try again.',
      });
    }

    if (
      errorMsg.includes('Database credentials') ||
      errorMsg.includes('Invalid tenant')
    ) {
      return res.status(500).json({
        message: 'Internal server error: Database configuration issue.',
      });
    }

    return res
      .status(500)
      .json({ message: 'Internal server error during login.' });
  }
}
