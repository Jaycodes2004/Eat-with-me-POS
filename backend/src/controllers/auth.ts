import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const prisma = (req as any).prisma;
  const tenant = (req as any).tenant;

  console.info('[Login] Incoming request', {
    email,
    hasPassword: Boolean(password),
    tenantId: tenant?.id,
    restaurantId: tenant?.restaurantId,
  });

  if (!prisma) {
    console.warn('[Login] Missing tenant prisma instance', { email });
    return res.status(400).json({ message: 'Restaurant ID is missing or invalid. Please provide it in the X-Restaurant-Id header.' });
  }
  if (!email || !password) {
    console.warn('[Login] Missing credentials', { emailPresent: Boolean(email), passwordPresent: Boolean(password) });
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    console.info('[Login] Looking up staff by email', { email });
    const staff = await prisma.staff.findUnique({ where: { email } });

    if (staff && (await bcrypt.compare(password, staff.password))) {
      console.info('[Login] Staff authenticated', { staffId: staff.id, email });
      const role = await prisma.role.findUnique({ where: { id: staff.roleId } });
      const staffRecord = staff as any;
      const roleRecord = role as any;

      const tokenPayload = {
        staffId: staff.id,
        roleId: staff.roleId,
        tenantId: tenant.id,
        restaurantId: tenant.restaurantId,
      };
      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '1d' });

      const permissions: string[] = Array.isArray(staffRecord.permissions) && staffRecord.permissions.length > 0
        ? staffRecord.permissions
        : Array.isArray(roleRecord?.permissions)
          ? roleRecord.permissions
          : [];

      const dashboardModules: string[] = Array.isArray(staffRecord.dashboardModules) && staffRecord.dashboardModules.length > 0
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
          id: tenant.restaurantId,
          useRedis: Boolean(tenant.useRedis),
        },
      });
    } else {
      console.warn('[Login] Invalid credentials', { email, hasStaffRecord: Boolean(staff) });
      res.status(401).json({ message: 'Invalid credentials.' });
    }
  } catch (error) {
    console.error('[Login] Error', { email, restaurantId: tenant?.restaurantId, error: (error as Error)?.message, stack: (error as Error)?.stack });
    res.status(500).json({ message: 'Internal server error during login.' });
  }
}

