"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllExpenses = getAllExpenses;
exports.getExpenseById = getExpenseById;
exports.createExpense = createExpense;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
exports.searchExpenses = searchExpenses;
exports.getExpenseStats = getExpenseStats;
// All expenses
async function getAllExpenses(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ message: 'Tenant database not available.' });
    }
    try {
        const expenses = await prisma.expense.findMany();
        res.json(expenses);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to get expenses." });
    }
}
// By ID
async function getExpenseById(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available.' });
    }
    const { id } = req.params;
    try {
        const expense = await prisma.expense.findUnique({ where: { id } });
        expense ? res.json(expense) : res.status(404).json({ error: "Not found" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to get expense." });
    }
}
// Create
async function createExpense(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ message: 'Tenant database not available.' });
    }
    try {
        const expense = await prisma.expense.create({ data: req.body });
        res.status(201).json(expense);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create expense." });
    }
}
// Update
async function updateExpense(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available.' });
    }
    const { id } = req.params;
    try {
        const updatedExpense = await prisma.expense.update({
            where: { id },
            data: req.body,
        });
        res.json(updatedExpense);
    }
    catch (error) {
        console.error(`Error updating expense ${id}:`, error);
        res.status(500).json({ error: "Failed to update expense" });
    }
}
// Delete
async function deleteExpense(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available.' });
    }
    const { id } = req.params;
    try {
        await prisma.expense.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error deleting expense ${id}:`, error);
        res.status(500).json({ error: "Failed to delete expense" });
    }
}
// Filter/search by timeframe, category, vendor
async function searchExpenses(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available.' });
    }
    const { from, to, category, vendor } = req.query;
    const where = {
        AND: [
            from ? { date: { gte: new Date(from) } } : {},
            to ? { date: { lte: new Date(to) } } : {},
            category ? { category: category } : {},
            vendor ? { vendor: { contains: vendor, mode: "insensitive" } } : {},
        ],
    };
    const expenses = await prisma.expense.findMany({ where });
    res.json(expenses);
}
// Expenses summary/stats
async function getExpenseStats(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available.' });
    }
    const { from, to } = req.query;
    try {
        const summary = await prisma.expense.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where: {
                date: {
                    gte: from ? new Date(from) : undefined,
                    lte: to ? new Date(to) : undefined,
                },
            },
        });
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to calculate expense stats." });
    }
}
//# sourceMappingURL=expense.js.map