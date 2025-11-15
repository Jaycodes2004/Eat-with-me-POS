"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function login(req, res) {
    const { email, password } = req.body;
    const prisma = req.prisma;
    const tenant = req.tenant;
    console.info('[Login] Incoming request', {
        email,
        hasPassword: Boolean(password),
        tenantId: tenant === null || tenant === void 0 ? void 0 : tenant.id,
        restaurantId: tenant === null || tenant === void 0 ? void 0 : tenant.restaurantId,
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
        if (staff && (await bcryptjs_1.default.compare(password, staff.password))) {
            console.info('[Login] Staff authenticated', { staffId: staff.id, email });
            const role = await prisma.role.findUnique({ where: { id: staff.roleId } });
            const staffRecord = staff;
            const roleRecord = role;
            const tokenPayload = {
                staffId: staff.id,
                roleId: staff.roleId,
                tenantId: tenant.id,
                restaurantId: tenant.restaurantId,
            };
            const accessToken = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });
            const permissions = Array.isArray(staffRecord.permissions) && staffRecord.permissions.length > 0
                ? staffRecord.permissions
                : Array.isArray(roleRecord === null || roleRecord === void 0 ? void 0 : roleRecord.permissions)
                    ? roleRecord.permissions
                    : [];
            const dashboardModules = Array.isArray(staffRecord.dashboardModules) && staffRecord.dashboardModules.length > 0
                ? staffRecord.dashboardModules
                : Array.isArray(roleRecord === null || roleRecord === void 0 ? void 0 : roleRecord.dashboardModules)
                    ? roleRecord.dashboardModules
                    : [];
            res.json({
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
                    id: tenant.restaurantId,
                    useRedis: Boolean(tenant.useRedis),
                },
            });
        }
        else {
            console.warn('[Login] Invalid credentials', { email, hasStaffRecord: Boolean(staff) });
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    }
    catch (error) {
        console.error('[Login] Error', { email, restaurantId: tenant === null || tenant === void 0 ? void 0 : tenant.restaurantId, error: error === null || error === void 0 ? void 0 : error.message, stack: error === null || error === void 0 ? void 0 : error.stack });
        res.status(500).json({ message: 'Internal server error during login.' });
    }
}
//# sourceMappingURL=auth.js.map