import { Router } from "express";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  searchExpenses,
  getExpenseStats
} from "../controllers/expense";
import { checkPermission } from "../middleware/checkPermission";

const router = Router();

router.get("/", checkPermission("expense_management"), getAllExpenses);
router.get("/search", searchExpenses);
router.get("/stats", getExpenseStats);
router.get("/:id", getExpenseById);
router.post("/", checkPermission("expense_management"), createExpense);
router.put("/:id", checkPermission("expense_management"), updateExpense);
router.delete("/:id", checkPermission("expense_management"), deleteExpense);

export { router as expenseRoutes };
