"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBudgetCategories = getBudgetCategories;
exports.createBudgetCategory = createBudgetCategory;
exports.updateBudgetCategory = updateBudgetCategory;
exports.deleteBudgetCategory = deleteBudgetCategory;
async function getBudgetCategories(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
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
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const category = await prisma.budgetCategory.create({ data: req.body });
        res.status(201).json(category);
    }
    catch (error) {
        console.error('[Budget] Create category error', error);
        res.status(500).json({ error: 'Failed to create budget category' });
    }
}
async function updateBudgetCategory(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        const category = await prisma.budgetCategory.update({
            where: { id },
            data: req.body,
        });
        res.json(category);
    }
    catch (error) {
        console.error('[Budget] Update category error', error);
        res.status(500).json({ error: 'Failed to update budget category' });
    }
}
async function deleteBudgetCategory(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        await prisma.budgetCategory.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('[Budget] Delete category error', error);
        res.status(500).json({ error: 'Failed to delete budget category' });
    }
}
//# sourceMappingURL=budget.js.map