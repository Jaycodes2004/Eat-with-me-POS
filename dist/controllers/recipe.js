"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRecipes = getAllRecipes;
exports.createRecipe = createRecipe;
exports.updateRecipe = updateRecipe;
exports.deleteRecipe = deleteRecipe;
const mapRecipeRecord = (record) => {
    var _a, _b, _c, _d, _e;
    return ({
        id: record.id,
        menuItemId: record.menuItemId,
        menuItemName: (_b = (_a = record.menuItem) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : null,
        ingredients: Array.isArray(record.ingredients) ? record.ingredients : [],
        yield: Number((_c = record.yield) !== null && _c !== void 0 ? _c : 1),
        cost: Number((_d = record.cost) !== null && _d !== void 0 ? _d : 0),
        preparationTime: (_e = record.preparationTime) !== null && _e !== void 0 ? _e : null,
        instructions: Array.isArray(record.instructions) ? record.instructions : [],
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    });
};
async function getAllRecipes(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const recipes = await prisma.recipe.findMany({
            include: { menuItem: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(recipes.map(mapRecipeRecord));
    }
    catch (error) {
        console.error('[Recipe] Fetch all error', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
}
async function createRecipe(req, res) {
    var _a;
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { menuItemId, ingredients, cost, preparationTime, instructions } = req.body;
        const recipeYield = (_a = req.body) === null || _a === void 0 ? void 0 : _a['yield'];
        const recipe = await prisma.recipe.create({
            data: {
                menuItemId: menuItemId || null,
                ingredients: ingredients !== null && ingredients !== void 0 ? ingredients : [],
                yield: recipeYield !== null && recipeYield !== void 0 ? recipeYield : 1,
                cost: cost !== null && cost !== void 0 ? cost : 0,
                preparationTime: preparationTime !== null && preparationTime !== void 0 ? preparationTime : null,
                instructions: instructions !== null && instructions !== void 0 ? instructions : [],
            },
            include: { menuItem: true },
        });
        res.status(201).json(mapRecipeRecord(recipe));
    }
    catch (error) {
        console.error('[Recipe] Create error', error);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
}
async function updateRecipe(req, res) {
    var _a, _b, _c, _d, _e, _f, _g;
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        const recipe = await prisma.recipe.update({
            where: { id },
            data: {
                menuItemId: (_a = req.body.menuItemId) !== null && _a !== void 0 ? _a : undefined,
                ingredients: (_b = req.body.ingredients) !== null && _b !== void 0 ? _b : undefined,
                yield: (_d = (_c = req.body) === null || _c === void 0 ? void 0 : _c['yield']) !== null && _d !== void 0 ? _d : undefined,
                cost: (_e = req.body.cost) !== null && _e !== void 0 ? _e : undefined,
                preparationTime: (_f = req.body.preparationTime) !== null && _f !== void 0 ? _f : undefined,
                instructions: (_g = req.body.instructions) !== null && _g !== void 0 ? _g : undefined,
            },
            include: { menuItem: true },
        });
        res.json(mapRecipeRecord(recipe));
    }
    catch (error) {
        console.error('[Recipe] Update error', error);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
}
async function deleteRecipe(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        await prisma.recipe.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('[Recipe] Delete error', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
}
//# sourceMappingURL=recipe.js.map