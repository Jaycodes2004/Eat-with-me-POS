"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const tenantPrisma_1 = require("./middleware/tenantPrisma");
const auth_1 = require("./middleware/auth");
// --- FIX: Use the correct import style for each specific route ---
const auth_2 = require("./routes/auth");
const staff_1 = require("./routes/staff");
const menu_1 = __importDefault(require("./routes/menu")); // Corrected to default import
const order_1 = require("./routes/order");
const table_1 = require("./routes/table");
const kitchen_1 = require("./routes/kitchen");
const categoryRole_1 = __importDefault(require("./routes/categoryRole")); // Corrected to default import
const settings_1 = __importDefault(require("./routes/settings")); // Corrected to default import
const inventory_1 = __importDefault(require("./routes/inventory")); // Corrected to default import
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
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- Public & Authentication Routes ---
app.use('/api', auth_2.authRoutes);
// --- Protected Routes ---
// All routes below this point require a tenant context and a valid authentication token.
app.use('/api', auth_1.authenticateToken);
app.use('/api', tenantPrisma_1.tenantPrisma);
// Wire up all your API routes to the /api base path
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
exports.default = app;
//# sourceMappingURL=app.js.map