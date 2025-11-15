"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetRoutes = void 0;
const express_1 = require("express");
const budget_1 = require("../controllers/budget");
const checkPermission_1 = require("../middleware/checkPermission");
const router = (0, express_1.Router)();
exports.budgetRoutes = router;
router.get('/categories', budget_1.getBudgetCategories);
router.post('/categories', (0, checkPermission_1.checkPermission)('expense_management'), budget_1.createBudgetCategory);
router.put('/categories/:id', (0, checkPermission_1.checkPermission)('expense_management'), budget_1.updateBudgetCategory);
router.delete('/categories/:id', (0, checkPermission_1.checkPermission)('expense_management'), budget_1.deleteBudgetCategory);
//# sourceMappingURL=budget.js.map