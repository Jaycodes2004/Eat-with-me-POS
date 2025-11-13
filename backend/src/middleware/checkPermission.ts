import { Request, Response, NextFunction } from 'express';

export function checkPermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const prisma = (req as any).prisma;
    const user = (req as any).user; // This is attached by authenticateToken middleware

    if (!user || !user.roleId) {
      return res.status(401).json({ message: 'Authentication error: User role not found.' });
    }

    try {
      const userRole = await prisma.role.findUnique({
        where: { id: user.roleId },
        select: { permissions: true },
      });

      if (!userRole || !Array.isArray(userRole.permissions)) {
        return res.status(403).json({ message: 'Forbidden: Role not found or permissions are malformed.' });
      }

      const hasPermission = userRole.permissions.includes(requiredPermission) || userRole.permissions.includes('all_access');

      if (hasPermission) {
        next(); // User has permission, proceed to the next handler
      } else {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal server error during permission check.' });
    }
  };
}