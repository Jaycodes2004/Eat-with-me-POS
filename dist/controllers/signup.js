"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
// --- FIX: Use a direct relative path to the generated master client ---
const master_1 = require("../generated/master");
const dbManager_1 = require("../utils/dbManager");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const masterPrisma = new master_1.PrismaClient();
async function generateUniqueRestaurantId() {
    let isUnique = false;
    let restaurantId = '';
    while (!isUnique) {
        restaurantId = Math.floor(1000000 + Math.random() * 9000000).toString();
        const existingTenant = await masterPrisma.tenant.findUnique({ where: { restaurantId } });
        if (!existingTenant) {
            isUnique = true;
        }
    }
    return restaurantId;
}
async function signup(req, res) {
    const { restaurantName, adminName, email, password, confirmPassword, useRedis, country } = req.body;
    const normalizedUseRedis = typeof useRedis === 'string'
        ? useRedis.toLowerCase() === 'true'
        : Boolean(useRedis);
    const confirmedPassword = confirmPassword !== null && confirmPassword !== void 0 ? confirmPassword : password;
    console.info('[Signup] Incoming request', {
        restaurantName,
        adminName,
        email,
        country,
        useRedis: normalizedUseRedis,
        hasPassword: Boolean(password),
        hasConfirmPassword: Boolean(confirmPassword),
    });
    if (!password) {
        console.warn('[Signup] Missing password', { email });
        return res.status(400).json({ message: 'Password is required' });
    }
    if (password !== confirmedPassword) {
        console.warn('[Signup] Password mismatch detected', { email });
        return res.status(400).json({ message: "Passwords do not match" });
    }
    let restaurantId = null;
    let dbName = null;
    let dbUser = null;
    try {
        console.info('[Signup] Checking for existing tenant', { email });
        const existingTenant = await masterPrisma.tenant.findUnique({ where: { email } });
        if (existingTenant) {
            console.warn('[Signup] Tenant already exists', { email, restaurantId: existingTenant.restaurantId });
            return res.status(409).json({ message: 'A restaurant with this email already exists.' });
        }
        // 1. Generate unique identifiers
        console.info('[Signup] Generating identifiers');
        restaurantId = await generateUniqueRestaurantId();
        dbName = `tenant_${restaurantId}`;
        dbUser = `user_${restaurantId}`;
        const dbPassword = `pass_${Math.random().toString(36).slice(-8)}`;
        // 2. Create DB and User in PostgreSQL
        console.info('[Signup] Creating tenant database and user', { restaurantId, dbName, dbUser });
        await (0, dbManager_1.createTenantDatabaseAndUser)(dbName, dbUser, dbPassword);
        // 3. Create tenant record in Master DB
        console.info('[Signup] Creating tenant record in master DB', { restaurantId });
        const newTenant = await masterPrisma.tenant.create({
            data: {
                name: restaurantName,
                email,
                restaurantId,
                dbName,
                dbUser,
                dbPassword,
                useRedis: normalizedUseRedis,
            },
        });
        // 4. Apply migrations to the new tenant DB
        console.info('[Signup] Running migrations for tenant', { restaurantId });
        await (0, dbManager_1.runMigrationsForTenant)(dbName);
        // 5. Connect to the new tenant DB to seed initial data
        console.info('[Signup] Connecting to tenant DB', { restaurantId });
        const tenantPrisma = (0, dbManager_1.getTenantPrismaClient)(dbName);
        // 6. Seed Admin Role
        console.info('[Signup] Seeding admin role', { restaurantId });
        const adminRole = await tenantPrisma.role.create({
            data: {
                name: 'Admin',
                permissions: ['all_access'],
                dashboardModules: ['dashboard', 'pos', 'reports', 'staff', 'inventory', 'menu', 'tables'],
            },
        });
        // 7. Seed Admin User
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        console.info('[Signup] Seeding admin user', { restaurantId, adminEmail: email });
        await tenantPrisma.staff.create({
            data: {
                name: adminName,
                email,
                password: hashedPassword,
                phone: '',
                pin: '0000',
                permissions: ['all_access'],
                dashboardModules: ['dashboard', 'pos', 'reports', 'staff', 'inventory', 'menu', 'tables'],
                role: {
                    connect: {
                        id: adminRole.id,
                    },
                },
            },
        });
        // 8. Seed Restaurant Settings with sensible defaults
        console.info('[Signup] Seeding restaurant settings', { restaurantId });
        await tenantPrisma.restaurant.create({
            data: {
                id: restaurantId,
                name: restaurantName,
                country: country || 'India',
                currency: country === 'United States' ? 'USD' : country === 'United Kingdom' ? 'GBP' : 'INR',
                currencySymbol: country === 'United States' ? '$' : country === 'United Kingdom' ? '£' : '₹',
                language: 'English',
                theme: 'light',
                notifications: true,
                autoBackup: false,
            },
        });
        // 9. Seed some default categories (menu & expense)
        const defaultCategories = [
            { name: 'Starters', color: '#F97316', type: 'menu' },
            { name: 'Main Course', color: '#2563EB', type: 'menu' },
            { name: 'Desserts', color: '#EC4899', type: 'menu' },
            { name: 'Beverages', color: '#0EA5E9', type: 'menu' },
            { name: 'Utilities', color: '#14B8A6', type: 'expense' },
            { name: 'Staff Salaries', color: '#F59E0B', type: 'expense' },
        ];
        console.info('[Signup] Seeding default categories', { restaurantId, count: defaultCategories.length });
        await tenantPrisma.category.createMany({ data: defaultCategories });
        // 10. Seed a couple of tables for quick start
        const defaultTables = Array.from({ length: 6 }).map((_, index) => ({
            number: index + 1,
            capacity: index < 4 ? 4 : 6,
            status: 'FREE',
        }));
        console.info('[Signup] Seeding default tables', { restaurantId, count: defaultTables.length });
        await tenantPrisma.table.createMany({ data: defaultTables });
        console.info('[Signup] Signup successful', { restaurantId, email });
        res.status(201).json({
            message: 'Restaurant created successfully!',
            restaurantId: newTenant.restaurantId,
        });
    }
    catch (error) {
        console.error('[Signup] Failed', { restaurantId, email, error: error === null || error === void 0 ? void 0 : error.message, stack: error === null || error === void 0 ? void 0 : error.stack });
        // Cleanup logic in case of failure
        if (restaurantId && dbName && dbUser) {
            console.log(`Attempting to clean up resources for failed signup of restaurantId: ${restaurantId}`);
            try {
                await (0, dbManager_1.dropTenantDatabaseAndUser)(dbName, dbUser);
                // Also remove the record from the master DB if it was created
                await masterPrisma.tenant.delete({ where: { restaurantId } }).catch(() => { });
                console.log(`Cleanup successful for restaurantId: ${restaurantId}`);
            }
            catch (cleanupError) {
                console.error(`CRITICAL: Failed to clean up resources for restaurantId: ${restaurantId}`, cleanupError);
            }
        }
        res.status(500).json({ message: 'Failed to create restaurant.', error: error.message });
    }
}
//# sourceMappingURL=signup.js.map