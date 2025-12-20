"use strict";
// /** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getPrismClientForRestaurant_1 = require("../lib/getPrismClientForRestaurant");
const awsSecrets_1 = require("../utils/awsSecrets");
async function login(req, res) {
    const { email, password, restaurantId: bodyRestaurantId } = req.body;
    const headerRestaurantId = req.headers['x-restaurant-id'];
    // Normalize restaurantId: prefer body, then header
    const restaurantId = typeof bodyRestaurantId === 'string' && bodyRestaurantId !== 'undefined'
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
            message: 'Restaurant ID is missing or invalid. Please send restaurantId in the request body or X-Restaurant-Id header.',
        });
    }
    // Validate credentials
    if (!email || !password) {
        console.warn('[Login] Missing credentials', {
            emailPresent: Boolean(email),
            passwordPresent: Boolean(password),
        });
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        console.info('[Login] Loading DB credentials from AWS SSM', {
            restaurantId,
        });
        // Load DB credentials from AWS SSM Parameter Store
        const { dbHost, dbPort, dbUser, dbPassword } = await (0, awsSecrets_1.loadTenantDbCredentials)();
        const dbName = `tenant_${restaurantId}`;
        console.info('[Login] Loaded credentials from AWS SSM', {
            restaurantId,
            dbName,
            dbHost,
            dbPort,
            dbUser,
        });
        // Pass credentials directly to getPrismClientForRestaurant
        const prisma = await (0, getPrismClientForRestaurant_1.getPrismClientForRestaurant)(restaurantId, dbHost, dbPort, dbUser, dbPassword, dbName);
        console.info('[Login] Looking up staff by email', { email, restaurantId });
        const staff = await prisma.staff.findUnique({ where: { email } });
        if (staff && (await bcryptjs_1.default.compare(password, staff.password))) {
            console.info('[Login] Staff authenticated', { staffId: staff.id, email });
            const role = await prisma.role.findUnique({
                where: { id: staff.roleId },
            });
            const staffRecord = staff;
            const roleRecord = role;
            const tokenPayload = {
                staffId: staff.id,
                roleId: staff.roleId,
                restaurantId,
            };
            const accessToken = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: '1d',
            });
            const permissions = Array.isArray(staffRecord.permissions) &&
                staffRecord.permissions.length > 0
                ? staffRecord.permissions
                : Array.isArray(roleRecord === null || roleRecord === void 0 ? void 0 : roleRecord.permissions)
                    ? roleRecord.permissions
                    : [];
            const dashboardModules = Array.isArray(staffRecord.dashboardModules) &&
                staffRecord.dashboardModules.length > 0
                ? staffRecord.dashboardModules
                : Array.isArray(roleRecord === null || roleRecord === void 0 ? void 0 : roleRecord.dashboardModules)
                    ? roleRecord.dashboardModules
                    : [];
            console.info('[Login] Login successful', {
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
                    role: (role === null || role === void 0 ? void 0 : role.name) || 'No Role',
                    permissions,
                    dashboardModules,
                },
                restaurant: {
                    id: restaurantId,
                    useRedis: false,
                },
            });
        }
        else {
            console.warn('[Login] Invalid credentials', {
                email,
                hasStaffRecord: Boolean(staff),
            });
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
    }
    catch (error) {
        const errorMsg = (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error';
        console.error('[Login] Error:', {
            email,
            restaurantId,
            error: errorMsg,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        // Handle specific error cases
        if (errorMsg.includes('Tenant') &&
            errorMsg.includes('not found')) {
            return res.status(404).json({
                message: 'Restaurant not found.',
            });
        }
        if (errorMsg.includes('Failed to create Prisma client')) {
            return res.status(502).json({
                message: 'Unable to connect to restaurant database. Please try again.',
            });
        }
        if (errorMsg.includes('Parameter') || errorMsg.includes('SecureString')) {
            return res.status(500).json({
                message: 'Internal server error: Failed to load database credentials.',
            });
        }
        return res.status(500).json({ message: 'Internal server error during login.' });
    }
}
//# sourceMappingURL=auth.js.map