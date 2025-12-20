"use strict";
// import { getPrismClientForRestaurant } from "../lib/getPrismClientForRestaurant";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestaurantId = exports.getTenantPrisma = exports.tenantPrismaMiddleware = void 0;
// // Store tenant-specific Prisma clients
// const tenantClients: Map<string, any> = new Map();
// /**
//  * Middleware to attach tenant-specific Prisma client to request
//  * IMPORTANT: Must be declared as async function (not IIFE)
//  */
// export const tenantPrismaMiddleware = async (
//   req: any,
//   res: any,
//   next: () => void
// ) => {
//   // Extract restaurantId from request
//   const restaurantId = req.body?.restaurantId || req.query?.restaurantId;
//   if (!restaurantId) {
//     return res.status(400).json({ error: "restaurantId is required" });
//   }
//   // Store restaurantId in request for use in route handlers
//   req.restaurantId = restaurantId;
//   try {
//     // Get or create Prisma client for this tenant
//     const prismaClient = await getPrismClientForRestaurant(restaurantId);
//     req.prisma = prismaClient;
//     // Call next() to continue middleware chain
//     next();
//   } catch (error) {
//     console.error(
//       `[tenantPrismaMiddleware] Error getting Prisma client for restaurant ${restaurantId}:`,
//       error
//     );
//     return res.status(500).json({
//       error: "Failed to connect to tenant database",
//       message: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// };
// /**
//  * Get Prisma client from request object (use in route handlers)
//  * Example: const prisma = getTenantPrisma(req);
//  */
// export const getTenantPrisma = (req: any) => {
//   if (!req.prisma) {
//     throw new Error(
//       "Prisma client not available. Make sure tenantPrismaMiddleware is applied."
//     );
//   }
//   return req.prisma;
// };
// /**
//  * Get restaurantId from request object
//  */
// export const getRestaurantId = (req: any) => {
//   if (!req.restaurantId) {
//     throw new Error(
//       "restaurantId not found. Make sure tenantPrismaMiddleware is applied."
//     );
//   }
//   return req.restaurantId;
// };
const getPrismClientForRestaurant_1 = require("../lib/getPrismClientForRestaurant");
const awsSecrets_1 = require("../utils/awsSecrets");
// Store tenant-specific Prisma clients
const tenantClients = new Map();
/**
 * Middleware to attach tenant-specific Prisma client to request
 * IMPORTANT: Must be declared as async function (not IIFE)
 */
const tenantPrismaMiddleware = async (req, res, next) => {
    var _a, _b, _c;
    // Extract restaurantId from request
    const restaurantId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.restaurantId) ||
        ((_b = req.query) === null || _b === void 0 ? void 0 : _b.restaurantId) ||
        ((_c = req.headers) === null || _c === void 0 ? void 0 : _c['x-restaurant-id']);
    if (!restaurantId) {
        return res.status(400).json({ error: 'restaurantId is required' });
    }
    // Store restaurantId in request for use in route handlers
    req.restaurantId = restaurantId;
    try {
        console.info('[tenantPrismaMiddleware] Getting Prisma client', {
            restaurantId,
        });
        // Load DB credentials from AWS SSM Parameter Store
        const { dbHost, dbPort, dbUser, dbPassword } = await (0, awsSecrets_1.loadTenantDbCredentials)();
        const dbName = `tenant_${restaurantId}`;
        console.info('[tenantPrismaMiddleware] Loaded credentials from AWS SSM', {
            restaurantId,
            dbName,
            dbHost,
            dbPort,
            dbUser,
        });
        // Get or create Prisma client for this tenant with all 6 parameters
        const prismaClient = await (0, getPrismClientForRestaurant_1.getPrismClientForRestaurant)(restaurantId, dbHost, dbPort, dbUser, dbPassword, dbName);
        req.prisma = prismaClient;
        console.info('[tenantPrismaMiddleware] Prisma client attached to request', {
            restaurantId,
        });
        // Call next() to continue middleware chain
        next();
    }
    catch (error) {
        console.error(`[tenantPrismaMiddleware] Error getting Prisma client for restaurant ${restaurantId}:`, error.message);
        return res.status(500).json({
            error: 'Failed to connect to tenant database',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.tenantPrismaMiddleware = tenantPrismaMiddleware;
/**
 * Get Prisma client from request object (use in route handlers)
 * Example: const prisma = getTenantPrisma(req);
 */
const getTenantPrisma = (req) => {
    if (!req.prisma) {
        throw new Error('Prisma client not available. Make sure tenantPrismaMiddleware is applied.');
    }
    return req.prisma;
};
exports.getTenantPrisma = getTenantPrisma;
/**
 * Get restaurantId from request object
 */
const getRestaurantId = (req) => {
    if (!req.restaurantId) {
        throw new Error('restaurantId not found. Make sure tenantPrismaMiddleware is applied.');
    }
    return req.restaurantId;
};
exports.getRestaurantId = getRestaurantId;
//# sourceMappingURL=tenantPrisma.js.map