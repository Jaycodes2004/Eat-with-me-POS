"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestaurantId = exports.getTenantPrisma = exports.tenantPrismaMiddleware = void 0;
const getPrismClientForRestaurant_1 = require("../lib/getPrismClientForRestaurant");
// Store tenant-specific Prisma clients
const tenantClients = new Map();
const tenantPrismaMiddleware = (req, res, next) => {
    var _a, _b;
    // Extract restaurantId from request
    const restaurantId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.restaurantId) || ((_b = req.query) === null || _b === void 0 ? void 0 : _b.restaurantId);
    if (!restaurantId) {
        return res.status(400).json({ error: "restaurantId is required" });
    }
    // Store restaurantId in request for use in route handlers
    req.restaurantId = restaurantId;
    // Get or create Prisma client for this tenant
    (async () => {
        try {
            const prismaClient = await (0, getPrismClientForRestaurant_1.getPrismClientForRestaurant)(restaurantId);
            req.prisma = prismaClient;
            next();
        }
        catch (error) {
            console.error(`[tenantPrismaMiddleware] Error getting Prisma client for restaurant ${restaurantId}:`, error);
            return res.status(500).json({
                error: "Failed to connect to tenant database",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    })();
};
exports.tenantPrismaMiddleware = tenantPrismaMiddleware;
/**
 * Get Prisma client from request object (use in route handlers)
 * Example: const prisma = getTenantPrisma(req);
 */
const getTenantPrisma = (req) => {
    if (!req.prisma) {
        throw new Error("Prisma client not available. Make sure tenantPrismaMiddleware is applied.");
    }
    return req.prisma;
};
exports.getTenantPrisma = getTenantPrisma;
/**
 * Get restaurantId from request object
 */
const getRestaurantId = (req) => {
    if (!req.restaurantId) {
        throw new Error("restaurantId not found. Make sure tenantPrismaMiddleware is applied.");
    }
    return req.restaurantId;
};
exports.getRestaurantId = getRestaurantId;
//# sourceMappingURL=tenantPrisma.js.map