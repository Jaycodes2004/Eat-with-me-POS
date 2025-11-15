"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeRoutes = void 0;
const express_1 = require("express");
const recipe_1 = require("../controllers/recipe");
const checkPermission_1 = require("../middleware/checkPermission");
const router = (0, express_1.Router)();
exports.recipeRoutes = router;
router.get('/', recipe_1.getAllRecipes);
router.post('/', (0, checkPermission_1.checkPermission)('menu_management'), recipe_1.createRecipe);
router.put('/:id', (0, checkPermission_1.checkPermission)('menu_management'), recipe_1.updateRecipe);
router.delete('/:id', (0, checkPermission_1.checkPermission)('menu_management'), recipe_1.deleteRecipe);
//# sourceMappingURL=recipe.js.map