"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBudgetCategories = getBudgetCategories;
exports.createBudgetCategory = createBudgetCategory;
exports.updateBudgetCategory = updateBudgetCategory;
exports.deleteBudgetCategory = deleteBudgetCategory;
const library_1 = require("@prisma/client/runtime/library");
function getPrismaOr500(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        res.status(500).json({ error: 'Tenant database not available' });
        return null;
    }
    return prisma;
}
async function getBudgetCategories(req, res) {
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    try {
        const categories = await prisma.budgetCategory.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    }
    catch (error) {
        console.error('[Budget] Fetch categories error', error);
        res.status(500).json({ error: 'Failed to fetch budget categories' });
    }
}
async function createBudgetCategory(req, res) {
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { name, description } = req.body || {};
    if (!(name === null || name === void 0 ? void 0 : name.trim())) {
        return res.status(400).json({ error: 'Name is required' });
    }
    try {
        const category = await prisma.budgetCategory.create({
            data: { name: name.trim(), description: description !== null && description !== void 0 ? description : null },
        });
        res.status(201).json(category);
    }
    catch (error) {
        console.error('[Budget] Create category error', error);
        if (error instanceof library_1.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: 'Category name already exists' });
        }
        res.status(500).json({ error: 'Failed to create budget category' });
    }
}
async function updateBudgetCategory(req, res) {
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { id } = req.params;
    const { name, description } = req.body || {};
    if (!id)
        return res.status(400).json({ error: 'Missing id' });
    const data = {};
    if (name !== undefined) {
        if (!name.trim())
            return res.status(400).json({ error: 'Name cannot be empty' });
        data.name = name.trim();
    }
    if (description !== undefined)
        data.description = description !== null && description !== void 0 ? description : null;
    try {
        const category = await prisma.budgetCategory.update({
            where: { id },
            data,
        });
        res.json(category);
    }
    catch (error) {
        console.error('[Budget] Update category error', error);
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2025')
                return res.status(404).json({ error: 'Category not found' });
            if (error.code === 'P2002')
                return res.status(409).json({ error: 'Category name already exists' });
        }
        res.status(500).json({ error: 'Failed to update budget category' });
    }
}
async function deleteBudgetCategory(req, res) {
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { id } = req.params;
    if (!id)
        return res.status(400).json({ error: 'Missing id' });
    try {
        await prisma.budgetCategory.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('[Budget] Delete category error', error);
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2025')
                return res.status(404).json({ error: 'Category not found' });
            if (error.code === 'P2003')
                return res
                    .status(409)
                    .json({ error: 'Category is in use and cannot be deleted' });
        }
        res.status(500).json({ error: 'Failed to delete budget category' });
    }
}
//# sourceMappingURL=budget.js.map