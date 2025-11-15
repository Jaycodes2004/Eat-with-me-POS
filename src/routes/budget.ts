import { Router } from 'express';
import {
  getBudgetCategories,
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory,
} from '../controllers/budget';
import { checkPermission } from '../middleware/checkPermission';

const router = Router();

router.get('/categories', getBudgetCategories);
router.post('/categories', checkPermission('expense_management'), createBudgetCategory);
router.put('/categories/:id', checkPermission('expense_management'), updateBudgetCategory);
router.delete('/categories/:id', checkPermission('expense_management'), deleteBudgetCategory);

export { router as budgetRoutes };
