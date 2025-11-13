"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRoutes = void 0;
const express_1 = require("express");
const expense_1 = require("../controllers/expense");
const checkPermission_1 = require("../middleware/checkPermission");
const router = (0, express_1.Router)();
exports.expenseRoutes = router;
router.get("/", (0, checkPermission_1.checkPermission)("expense_management"), expense_1.getAllExpenses);
router.get("/search", expense_1.searchExpenses);
router.get("/stats", expense_1.getExpenseStats);
router.get("/:id", expense_1.getExpenseById);
router.post("/", (0, checkPermission_1.checkPermission)("expense_management"), expense_1.createExpense);
router.put("/:id", (0, checkPermission_1.checkPermission)("expense_management"), expense_1.updateExpense);
router.delete("/:id", (0, checkPermission_1.checkPermission)("expense_management"), expense_1.deleteExpense);
//# sourceMappingURL=expense.js.map