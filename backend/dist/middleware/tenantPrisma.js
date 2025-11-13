"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantPrisma = tenantPrisma;
// --- FIX: Use a direct relative path to the generated master client ---
const master_1 = require("../generated/master");
const dbManager_1 = require("../utils/dbManager");
const masterPrisma = new master_1.PrismaClient();
async function tenantPrisma(req, res, next) {
    const headerRestaurantId = req.headers['x-restaurant-id'];
    const bodyRestaurantId = (req.body && typeof req.body === 'object') ? req.body.restaurantId : undefined;
    const restaurantId = headerRestaurantId || bodyRestaurantId || req.restaurantId;
    // Public routes like /signup don't need this middleware's logic.
    // They will be handled before this middleware is even called.
    // For /login, we need the restaurantId to connect to the right DB.
    if (!restaurantId) {
        // Allow login path to proceed to its controller, which will show a more specific error.
        if (req.path === '/login') {
            return next();
        }
        return res.status(400).json({ message: 'Restaurant ID is required in the X-Restaurant-Id header.' });
    }
    try {
        const tenant = await masterPrisma.tenant.findUnique({
            where: { restaurantId },
        });
        if (!tenant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }
        const tenantPrismaClient = (0, dbManager_1.getTenantPrismaClient)(tenant.dbName);
        req.prisma = tenantPrismaClient;
        req.tenant = tenant; // Attach tenant info for use in controllers (e.g., login JWT)
        req.useRedis = Boolean(tenant.useRedis);
        next();
    }
    catch (error) {
        console.error('Error connecting to tenant database:', error);
        return res.status(500).json({ message: 'Internal server error during DB connection.' });
    }
}
//# sourceMappingURL=tenantPrisma.js.map