import { getPrismClientForRestaurant } from "../lib/getPrismClientForRestaurant";

// Store tenant-specific Prisma clients
const tenantClients: Map<string, any> = new Map();

/**
 * Middleware to attach tenant-specific Prisma client to request
 * IMPORTANT: Must be declared as async function (not IIFE)
 */
export const tenantPrismaMiddleware = async (
  req: any,
  res: any,
  next: () => void
) => {
  // Extract restaurantId from request
  const restaurantId = req.body?.restaurantId || req.query?.restaurantId;

  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required" });
  }

  // Store restaurantId in request for use in route handlers
  req.restaurantId = restaurantId;

  try {
    // Get or create Prisma client for this tenant
    const prismaClient = await getPrismClientForRestaurant(restaurantId);
    req.prisma = prismaClient;
    
    // Call next() to continue middleware chain
    next();
  } catch (error) {
    console.error(
      `[tenantPrismaMiddleware] Error getting Prisma client for restaurant ${restaurantId}:`,
      error
    );
    
    return res.status(500).json({
      error: "Failed to connect to tenant database",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get Prisma client from request object (use in route handlers)
 * Example: const prisma = getTenantPrisma(req);
 */
export const getTenantPrisma = (req: any) => {
  if (!req.prisma) {
    throw new Error(
      "Prisma client not available. Make sure tenantPrismaMiddleware is applied."
    );
  }
  return req.prisma;
};

/**
 * Get restaurantId from request object
 */
export const getRestaurantId = (req: any) => {
  if (!req.restaurantId) {
    throw new Error(
      "restaurantId not found. Make sure tenantPrismaMiddleware is applied."
    );
  }
  return req.restaurantId;
};
