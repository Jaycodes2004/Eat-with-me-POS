"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
// /** @format */
// import express from 'express';
// import cors from 'cors';
const tenantPrisma_1 = require("./middleware/tenantPrisma");
// // --- FIX: Use the correct import style for each specific route ---
// import { authRoutes } from './routes/auth';
// import { staffRoutes } from './routes/staff';
// import menuRoutes from './routes/menu'; // Corrected to default import
// import { orderRoutes } from './routes/order';
// import { tableRoutes } from './routes/table';
// import { kitchenRoutes } from './routes/kitchen';
// import categoryRoleRoutes from './routes/categoryRole'; // Corrected to default import
// import settingsRoutes from './routes/settings'; // Corrected to default import
// import inventoryRoutes from './routes/inventory'; // Corrected to default import
// import { supplierRoutes } from './routes/supplier';
// import { reportRoutes } from './routes/report';
// import { customerRoutes } from './routes/customer';
// import { reservationRoutes } from './routes/reservation';
// import { expenseRoutes } from './routes/expense';
// import { dashboardRoutes } from './routes/dashboard';
// import { aiRoutes } from './routes/ai';
// import { loyaltyRoutes } from './routes/loyalty';
// import { marketingRoutes } from './routes/marketing';
// import { shiftRoutes } from './routes/shifts';
// import { recipeRoutes } from './routes/recipe';
// import { budgetRoutes } from './routes/budget';
// // Fetch DB URLs from AWS SSM (or use Secrets Manager helpers if preferred)
// // These should be awaited before any Prisma client is initialized anywhere in your app
// export async function createApp(): Promise<express.Express> {
// 	await setMasterDbUrlFromSSM('/prod/master-db-url'); // update with your actual SSM parameter name
// 	const app = express();
// 	app.use(cors());
// 	app.use(express.json());
// 	// --- Public & Authentication Routes ---
// 	app.use('/api', authRoutes);
// 	// --- Protected Routes ---
// 	// All routes below this point require a tenant context and a valid authentication token.
// 	app.use('/api', authenticateToken);
// 	app.use('/api', );
// 	// Wire up all your API routes to the /api base path
// 	app.use('/api/staff', staffRoutes);
// 	app.use('/api/menu', menuRoutes);
// 	app.use('/api/orders', orderRoutes);
// 	app.use('/api/tables', tableRoutes);
// 	app.use('/api/kitchen', kitchenRoutes);
// 	app.use('/api/category-role', categoryRoleRoutes);
// 	app.use('/api/settings', settingsRoutes);
// 	app.use('/api/inventory', inventoryRoutes);
// 	app.use('/api/suppliers', supplierRoutes);
// 	app.use('/api/reports', reportRoutes);
// 	app.use('/api/customers', customerRoutes);
// 	app.use('/api/reservations', reservationRoutes);
// 	app.use('/api/expenses', expenseRoutes);
// 	app.use('/api/recipes', recipeRoutes);
// 	app.use('/api/budgets', budgetRoutes);
// 	app.use('/api/dashboard', dashboardRoutes);
// 	app.use('/api/ai', aiRoutes);
// 	app.use('/api/loyalty', loyaltyRoutes);
// 	app.use('/api/marketing', marketingRoutes);
// 	app.use('/api/shifts', shiftRoutes);
// 	return app;
// }
// import express from 'express';
// import cors from 'cors';
// import {  } from './middleware/';
// import { authenticateToken } from './middleware/auth';
// // Routes
// import { authRoutes } from './routes/auth';
// import { staffRoutes } from './routes/staff';
// import menuRoutes from './routes/menu';
// import { orderRoutes } from './routes/order';
// import { tableRoutes } from './routes/table';
// import { kitchenRoutes } from './routes/kitchen';
// import categoryRoleRoutes from './routes/categoryRole';
// import settingsRoutes from './routes/settings';
// import inventoryRoutes from './routes/inventory';
// import { supplierRoutes } from './routes/supplier';
// import { reportRoutes } from './routes/report';
// import { customerRoutes } from './routes/customer';
// import { reservationRoutes } from './routes/reservation';
// import { expenseRoutes } from './routes/expense';
// import { dashboardRoutes } from './routes/dashboard';
// import { aiRoutes } from './routes/ai';
// import { loyaltyRoutes } from './routes/loyalty';
// import { marketingRoutes } from './routes/marketing';
// import { shiftRoutes } from './routes/shifts';
// import { recipeRoutes } from './routes/recipe';
// import { budgetRoutes } from './routes/budget';
// export async function createApp(): Promise<express.Express> {
// 	const app = express();
// 	// ---------------------------------------
// 	// CORS — Vercel + custom domains
// 	// ---------------------------------------
// 	const allowedOrigins = [
// 		'http://localhost:3000',
// 		'http://localhost:5173',
// 		'https://eat-with-me-pos-frontend.vercel.app',
// 		'https://eat-with-me-frontend-is7z81mej-abhimaniyus-projects.vercel.app',
// 		'https://carma-devout-transcendentally.ngrok-free.dev',
// 		'https://eatwithme.easytomanage.xyz',
// 		'https://admin.easytomanage.xyz',
// 	];
// 	app.use(
// 		cors({
// 			origin: (origin, callback) => {
// 				// Allow mobile apps / curl / server-to-server
// 				if (!origin) return callback(null, true);
// 				console.log('Incoming Origin:', origin);
// 				console.log('Allowed Origins:', allowedOrigins);
// 				if (allowedOrigins.includes(origin)) {
// 					return callback(null, true);
// 				}
// 				console.warn('❌ CORS blocked:', origin);
// 				// Reject without throwing; CORS will simply not set headers
// 				return callback(null, false);
// 			},
// 			credentials: true,
// 			methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
// 			allowedHeaders: [
// 				'Content-Type',
// 				'Authorization',
// 				'X-Restaurant-Id',
// 				'X-Tenant-Id',
// 			],
// 		})
// 	);
// 	// Handle CORS preflight for all routes
// 	app.options('*', (req, res) => {
// 		const origin = req.headers.origin as string | undefined;
// 		if (!origin || allowedOrigins.includes(origin)) {
// 			if (origin) {
// 				res.header('Access-Control-Allow-Origin', origin);
// 				res.header('Vary', 'Origin');
// 			}
// 			res.header(
// 				'Access-Control-Allow-Methods',
// 				'GET,POST,PUT,PATCH,DELETE,OPTIONS'
// 			);
// 			res.header(
// 				'Access-Control-Allow-Headers',
// 				req.headers['access-control-request-headers'] ||
// 					'Content-Type,Authorization,X-Restaurant-Id,X-Tenant-Id'
// 			);
// 			res.header('Access-Control-Allow-Credentials', 'true');
// 			return res.sendStatus(204);
// 		}
// 		console.warn('❌ Preflight blocked:', origin);
// 		return res.sendStatus(403);
// 	});
// 	// Body parser
// 	app.use(express.json());
// 	// ------------------------
// 	// Public Routes (No Auth)
// 	// Used for signup + login
// 	// ------------------------
// 	app.use('/api', authRoutes);
// 	// ------------------------
// 	// Protected Routes
// 	// ------------------------
// 	app.use('/api', authenticateToken);
// 	app.use('/api', tenantPrismaMiddleware);
// 	// ------------------------
// 	// Tenant Routes
// 	// ------------------------
// 	app.use('/api/staff', staffRoutes);
// 	app.use('/api/menu', menuRoutes);
// 	app.use('/api/orders', orderRoutes);
// 	app.use('/api/tables', tableRoutes);
// 	app.use('/api/kitchen', kitchenRoutes);
// 	app.use('/api/category-role', categoryRoleRoutes);
// 	app.use('/api/settings', settingsRoutes);
// 	app.use('/api/inventory', inventoryRoutes);
// 	app.use('/api/suppliers', supplierRoutes);
// 	app.use('/api/reports', reportRoutes);
// 	app.use('/api/customers', customerRoutes);
// 	app.use('/api/reservations', reservationRoutes);
// 	app.use('/api/expenses', expenseRoutes);
// 	app.use('/api/recipes', recipeRoutes);
// 	app.use('/api/budgets', budgetRoutes);
// 	app.use('/api/dashboard', dashboardRoutes);
// 	app.use('/api/ai', aiRoutes);
// 	app.use('/api/loyalty', loyaltyRoutes);
// 	app.use('/api/marketing', marketingRoutes);
// 	app.use('/api/shifts', shiftRoutes);
// 	return app;
// }
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./middleware/auth");
// Routes
const auth_2 = require("./routes/auth");
const staff_1 = require("./routes/staff");
const menu_1 = __importDefault(require("./routes/menu"));
const order_1 = require("./routes/order");
const table_1 = require("./routes/table");
const kitchen_1 = require("./routes/kitchen");
const categoryRole_1 = __importDefault(require("./routes/categoryRole"));
const settings_1 = __importDefault(require("./routes/settings"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const supplier_1 = require("./routes/supplier");
const report_1 = require("./routes/report");
const customer_1 = require("./routes/customer");
const reservation_1 = require("./routes/reservation");
const expense_1 = require("./routes/expense");
const dashboard_1 = require("./routes/dashboard");
const ai_1 = require("./routes/ai");
const loyalty_1 = require("./routes/loyalty");
const marketing_1 = require("./routes/marketing");
const shifts_1 = require("./routes/shifts");
const recipe_1 = require("./routes/recipe");
const budget_1 = require("./routes/budget");
async function createApp() {
    const app = (0, express_1.default)();
    // ---------------------------------------
    // CORS BYPASSED (allow all origins)
    // Use only for debugging, not production
    // ---------------------------------------
    app.use((0, cors_1.default)({
        origin: true, // reflect request origin
        credentials: true, // allow cookies / auth headers
    }));
    // If you want, you can keep a generic OPTIONS handler, but it's optional:
    // app.options('*', cors());
    // Body parser
    app.use(express_1.default.json());
    // ------------------------
    // Public Routes (No Auth)
    // Used for signup + login
    // ------------------------
    app.use('/api', auth_2.authRoutes);
    // ------------------------
    // Protected Routes
    // ------------------------
    app.use('/api', auth_1.authenticateToken);
    app.use('/api', tenantPrisma_1.tenantPrismaMiddleware);
    // ------------------------
    // Tenant Routes
    // ------------------------
    app.use('/api/staff', staff_1.staffRoutes);
    app.use('/api/menu', menu_1.default);
    app.use('/api/orders', order_1.orderRoutes);
    app.use('/api/tables', table_1.tableRoutes);
    app.use('/api/kitchen', kitchen_1.kitchenRoutes);
    app.use('/api/category-role', categoryRole_1.default);
    app.use('/api/settings', settings_1.default);
    app.use('/api/inventory', inventory_1.default);
    app.use('/api/suppliers', supplier_1.supplierRoutes);
    app.use('/api/reports', report_1.reportRoutes);
    app.use('/api/customers', customer_1.customerRoutes);
    app.use('/api/reservations', reservation_1.reservationRoutes);
    app.use('/api/expenses', expense_1.expenseRoutes);
    app.use('/api/recipes', recipe_1.recipeRoutes);
    app.use('/api/budgets', budget_1.budgetRoutes);
    app.use('/api/dashboard', dashboard_1.dashboardRoutes);
    app.use('/api/ai', ai_1.aiRoutes);
    app.use('/api/loyalty', loyalty_1.loyaltyRoutes);
    app.use('/api/marketing', marketing_1.marketingRoutes);
    app.use('/api/shifts', shifts_1.shiftRoutes);
    return app;
}
//# sourceMappingURL=app.js.map