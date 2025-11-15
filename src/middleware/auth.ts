import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  // The token is expected in the format "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];
  const headerRestaurantId = req.headers['x-restaurant-id'] as string | undefined;

  if (token == null) {
    // No token was provided
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
    if (err) {
      // The token is invalid or expired
      return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }

    // The decoded payload from your login/signup should contain the restaurant's unique code
    if (!decoded || !decoded.restaurantId) {
      return res.status(403).json({ message: 'Forbidden: Invalid token payload' });
    }

    if (headerRestaurantId && headerRestaurantId !== decoded.restaurantId) {
      return res.status(403).json({ message: 'Forbidden: Restaurant mismatch' });
    }

    // Attach the restaurantId to the request object so subsequent middleware can use it
    (req as any).restaurantId = decoded.restaurantId;
    
    // Attach the decoded user payload to the request object
    (req as any).user = decoded;
    (req as any).staffId = decoded.staffId;
    (req as any).roleId = decoded.roleId;

    // Proceed to the next middleware in the chain (e.g., the tenantPrisma middleware)
    next();
  });
}