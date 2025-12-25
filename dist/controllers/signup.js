"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
const axios_1 = __importDefault(require("axios"));
const dbManager_1 = require("../utils/dbManager");
const awsSecrets_1 = require("../utils/awsSecrets");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'https://admin.easytomanage.xyz';
async function generateUniqueRestaurantId() {
    let isUnique = false;
    let restaurantId = '';
    while (!isUnique) {
        restaurantId = Math.floor(1000000 + Math.random() * 9000000).toString();
        try {
            const res = await axios_1.default.get(`${ADMIN_BASE_URL}/api/tenants/${restaurantId}`);
            if (!res.data) {
                isUnique = true;
            }
        }
        catch (_err) {
            isUnique = true;
        }
    }
    return restaurantId;
}
async function loadMasterDbConfig() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
        console.info('[Signup] Development mode - loading DB config from environment variables');
        const masterDbUser = process.env.MASTER_DB_USER || process.env.DB_USER || 'postgres';
        const masterDbPass = process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || '';
        const masterDbHost = process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost';
        const masterDbPort = process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432';
        return { masterDbUser, masterDbPass, masterDbHost, masterDbPort };
    }
    console.info('[Signup] Production mode - loading DB config from AWS SSM Parameter Store');
    const [masterDbUser, masterDbPass, masterDbHost, masterDbPort] = await Promise.all([
        (0, awsSecrets_1.getParameter)('/eatwithme/db-user'),
        (0, awsSecrets_1.getParameter)('/eatwithme/db-password'),
        (0, awsSecrets_1.getParameter)('/eatwithme/db-host'),
        (0, awsSecrets_1.getParameter)('/eatwithme/db-port'),
    ]);
    return { masterDbUser, masterDbPass, masterDbHost, masterDbPort };
}
async function signup(req, res) {
    console.log('[Signup] Request received:', { body: req.body });
    const { restaurantName, adminName, email, password, confirmPassword, useRedis, country, planId, posType, businessAddress, businessPhone, } = req.body;
    const normalizedUseRedis = typeof useRedis === 'string' ? useRedis.toLowerCase() === 'true' : Boolean(useRedis);
    const confirmedPassword = confirmPassword !== null && confirmPassword !== void 0 ? confirmPassword : password;
    console.info('[Signup] Incoming request validated', {
        restaurantName,
        adminName,
        email,
        country,
        useRedis: normalizedUseRedis,
        hasPassword: Boolean(password),
        hasConfirmPassword: Boolean(confirmPassword),
    });
    if (!password) {
        console.warn('[Signup] Validation failed - missing password', { email });
        return res.status(400).json({ message: 'Password is required' });
    }
    if (password !== confirmedPassword) {
        console.warn('[Signup] Validation failed - passwords do not match', { email });
        return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (!planId) {
        console.warn('[Signup] Validation failed - missing planId', { email });
        return res.status(400).json({ message: 'planId is required' });
    }
    let restaurantId = null;
    let dbName = null;
    let dbUser = null;
    let dbPassword = null;
    try {
        console.info('[Signup] Step 1: Checking for existing tenant', { email });
        let tenantExists = false;
        try {
            const resTenant = await axios_1.default.get(`${ADMIN_BASE_URL}/api/tenants?email=${encodeURIComponent(email)}`);
            if (resTenant.data) {
                tenantExists = true;
            }
        }
        catch (_err) {
            tenantExists = false;
        }
        if (tenantExists) {
            console.warn('[Signup] Tenant already exists', { email });
            return res.status(409).json({ message: 'A restaurant with this email already exists.' });
        }
        console.info('[Signup] Step 2: Generating identifiers');
        restaurantId = await generateUniqueRestaurantId();
        dbName = `tenant_${restaurantId}`;
        dbUser = `user_${restaurantId}`;
        dbPassword = `pass_${Math.random().toString(36).slice(-8)}`;
        console.info('[Signup] Identifiers generated', { restaurantId, dbName, dbUser });
        console.info('[Signup] Step 3: Loading master DB credentials');
        const { masterDbUser, masterDbPass, masterDbHost, masterDbPort } = await loadMasterDbConfig();
        console.info('[Signup] Master DB credentials loaded', { masterDbHost, masterDbPort, masterDbUser });
        console.info('[Signup] Step 4: Creating tenant database and user', {
            restaurantId,
            dbName,
            dbUser,
        });
        await (0, dbManager_1.createTenantDatabaseAndUser)(dbName, dbUser, dbPassword, masterDbUser, masterDbPass, masterDbHost, masterDbPort);
        console.info('[Signup] Tenant database and user created successfully', { restaurantId, dbName });
        console.info('[Signup] Step 5: Running Prisma migrations for tenant DB', { restaurantId, dbName });
        try {
            await (0, dbManager_1.runMigrationsForTenant)(dbName, masterDbUser, masterDbPass, masterDbHost, masterDbPort);
            console.info('[Signup] Migrations completed successfully - all tables created', { restaurantId, dbName });
        }
        catch (migrationError) {
            console.error('[Signup] Migration failed - aborting signup', { restaurantId, error: migrationError.message });
            throw new Error(`Failed to run migrations for tenant ${restaurantId}: ${migrationError.message}`);
        }
        console.info('[Signup] Step 6: Creating tenant Prisma client with all parameters', {
            restaurantId,
            dbName,
            dbHost: masterDbHost,
            dbPort: masterDbPort,
            dbUser,
        });
        const tenantPrisma = (0, dbManager_1.getTenantPrismaClientWithParams)(dbName, dbUser, dbPassword, masterDbHost, masterDbPort);
        console.info('[Signup] Tenant Prisma client created successfully', { restaurantId });
        console.info('[Signup] Step 7: Hashing password');
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        console.info('[Signup] Step 8: Creating default admin role in tenant DB', { restaurantId });
        const adminRole = await tenantPrisma.role.create({
            data: {
                name: 'Admin',
                permissions: [
                    'view_dashboard',
                    'manage_staff',
                    'manage_menu',
                    'manage_orders',
                    'manage_tables',
                    'view_reports',
                    'manage_settings',
                    'all_access',
                ],
            },
        });
        console.info('[Signup] Admin role created successfully', { restaurantId, roleId: adminRole.id });
        console.info('[Signup] Step 9: Creating admin user in tenant DB', {
            restaurantId,
            adminName,
            email,
        });
        const adminUser = await tenantPrisma.staff.create({
            data: {
                name: adminName,
                email,
                password: hashedPassword,
                roleId: adminRole.id,
                phone: businessPhone || '',
                pin: '0000',
                isActive: true,
            },
        });
        console.info('[Signup] Admin user created successfully', { restaurantId, staffId: adminUser.id });
        const defaultCategories = [
            { name: 'Appetizers', color: '#3B82F6', type: 'food' },
            { name: 'Main Course', color: '#8B5CF6', type: 'food' },
            { name: 'Desserts', color: '#EC4899', type: 'food' },
            { name: 'Beverages', color: '#14B8A6', type: 'beverage' },
            { name: 'Alcohol', color: '#F97316', type: 'beverage' },
            { name: 'Staff Salaries', color: '#F59E0B', type: 'expense' },
        ];
        console.info('[Signup] Step 10: Seeding default categories', {
            restaurantId,
            count: defaultCategories.length,
        });
        await tenantPrisma.category.createMany({
            data: defaultCategories,
        });
        console.info('[Signup] Default categories seeded successfully', {
            restaurantId,
            count: defaultCategories.length,
        });
        const defaultTables = Array.from({ length: 6 }).map((_, index) => ({
            number: index + 1,
            capacity: index < 4 ? 4 : 6,
            status: 'FREE',
        }));
        console.info('[Signup] Step 11: Seeding default tables', {
            restaurantId,
            count: defaultTables.length,
        });
        await tenantPrisma.table.createMany({ data: defaultTables });
        console.info('[Signup] Default tables seeded successfully', {
            restaurantId,
            count: defaultTables.length,
        });
        console.info('[Signup] Step 12: Creating tenant record in master DB', { restaurantId });
        const masterDbUrl = `postgresql://${encodeURIComponent(masterDbUser)}:${encodeURIComponent(masterDbPass)}@${masterDbHost}:${masterDbPort}/master-db?schema=public&sslmode=no-verify`;
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const masterPrisma = new PrismaClient({
            datasources: {
                db: {
                    url: masterDbUrl,
                },
            },
        });
        const newTenant = await masterPrisma.tenant.create({
            data: {
                id: restaurantId,
                name: restaurantName,
                email,
                planId,
                posType: posType || 'standard',
                country: country || 'IN',
                businessAddress: businessAddress || '',
                businessPhone: businessPhone || '',
                useRedis: normalizedUseRedis,
                dbName,
                dbUser,
                dbPassword,
                dbHost: masterDbHost,
                dbPort: masterDbPort,
                adminUserId: adminUser.id,
                isActive: true,
            },
        });
        await masterPrisma.$disconnect();
        console.info('[Signup] Tenant record saved to master DB successfully', {
            restaurantId: newTenant.id,
        });
        console.info('[Signup] Step 13: Generating JWT token', { restaurantId });
        const token = jsonwebtoken_1.default.sign({
            restaurantId: newTenant.id,
            staffId: adminUser.id,
            roleId: adminRole.id,
            email: adminUser.email,
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        console.info('[Signup] ✅ SIGNUP SUCCESSFUL', {
            restaurantId,
            email,
            message: 'All data saved successfully to both master and tenant databases',
        });
        return res.status(201).json({
            message: 'Restaurant created successfully!',
            restaurantId: newTenant.id,
            token,
            adminUser: {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
            },
        });
    }
    catch (error) {
        console.error('[Signup] ❌ SIGNUP FAILED', {
            restaurantId,
            email,
            error: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        if (restaurantId && dbName && dbUser && dbPassword) {
            console.log('[Signup] Attempting to clean up resources for failed signup', { restaurantId });
            try {
                const { masterDbUser, masterDbPass, masterDbHost, masterDbPort } = await loadMasterDbConfig();
                await (0, dbManager_1.dropTenantDatabaseAndUser)(dbName, dbUser, masterDbUser, masterDbPass, masterDbHost, masterDbPort);
                console.log('[Signup] Cleanup successful - database and user removed', { restaurantId });
                try {
                    await axios_1.default.delete(`${ADMIN_BASE_URL}/api/tenants/${restaurantId}`);
                }
                catch (_err) {
                    // Ignore cleanup API errors
                }
            }
            catch (cleanupError) {
                console.error('[Signup] CRITICAL: Cleanup failed - manual intervention needed', {
                    restaurantId,
                    dbName,
                    dbUser,
                    error: cleanupError.message,
                });
            }
        }
        return res.status(500).json({
            message: 'Failed to create restaurant.',
            error: error.message,
        });
    }
}
//# sourceMappingURL=signup.js.map