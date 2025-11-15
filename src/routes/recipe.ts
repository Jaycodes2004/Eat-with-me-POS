import { Router } from 'express';
import {
  getAllRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../controllers/recipe';
import { checkPermission } from '../middleware/checkPermission';

const router = Router();

router.get('/', getAllRecipes);
router.post('/', checkPermission('menu_management'), createRecipe);
router.put('/:id', checkPermission('menu_management'), updateRecipe);
router.delete('/:id', checkPermission('menu_management'), deleteRecipe);

export { router as recipeRoutes };
