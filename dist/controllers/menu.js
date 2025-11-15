"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMenuItems = getAllMenuItems;
exports.getMenuItemById = getMenuItemById;
exports.createMenuItem = createMenuItem;
exports.updateMenuItem = updateMenuItem;
exports.deleteMenuItem = deleteMenuItem;
exports.searchMenuItems = searchMenuItems;
exports.getMenuInsights = getMenuInsights;
async function getAllMenuItems(req, res) {
    var _a;
    // FIX: Use the tenant-specific prisma client from the request
    const prisma = req.prisma;
    const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
    try {
        console.info('[Menu] List request received', { tenantId });
        const menu = await prisma.menuItem.findMany({
            orderBy: [
                {
                    category: {
                        name: 'asc',
                    },
                },
                { name: 'asc' },
            ],
            include: { category: true },
        });
        console.info('[Menu] List success', {
            tenantId,
            count: menu.length,
        });
        res.json(menu);
    }
    catch (err) {
        console.error('[Menu] List failed', {
            tenantId,
            message: err === null || err === void 0 ? void 0 : err.message,
            stack: err === null || err === void 0 ? void 0 : err.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getMenuItemById(req, res) {
    var _a, _b;
    const prisma = req.prisma;
    try {
        const { id } = req.params;
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        console.info('[Menu] Detail request received', { tenantId, id });
        const menuItem = await prisma.menuItem.findUnique({ where: { id } });
        if (!menuItem) {
            console.warn('[Menu] Detail not found', { tenantId, id });
            return res.status(404).json({ error: "Menu item not found" });
        }
        console.info('[Menu] Detail success', { tenantId, id });
        res.json(menuItem);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[Menu] Detail failed', {
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
            id: req.params.id,
            message: errorMessage,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: errorMessage });
    }
}
async function createMenuItem(req, res) {
    var _a, _b;
    const prisma = req.prisma;
    try {
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        const { name, price, category, description, available, isVeg, spiceLevel, cookingTime, isPopular, allergens, calories, protein, carbs, fat } = req.body;
        console.info('[Menu] Create request received', {
            tenantId,
            name,
            category,
            price,
            flags: { available, isVeg, isPopular },
        });
        if (!category) {
            console.warn('[Menu] Missing category in create request', { tenantId, name });
            return res.status(400).json({ error: 'Category is required.' });
        }
        // Find the category by name to get its ID
        const categoryRecord = await prisma.category.findFirst({ where: { name: category } });
        if (!categoryRecord) {
            console.warn('[Menu] Category not found when creating item', { tenantId, category });
            return res.status(400).json({ error: `Category '${category}' not found.` });
        }
        const item = await prisma.menuItem.create({
            data: {
                name, price, description, available, isVeg, spiceLevel, cookingTime,
                isPopular, allergens, calories, protein, carbs, fat,
                // FIX: Connect to the category using its ID
                category: { connect: { id: categoryRecord.id } }
            }
        });
        console.info('[Menu] Create success', {
            tenantId,
            id: item.id,
            name: item.name,
            category: categoryRecord.name,
        });
        res.status(201).json(item);
    }
    catch (err) {
        console.error('[Menu] Create item error', {
            message: err === null || err === void 0 ? void 0 : err.message,
            stack: err === null || err === void 0 ? void 0 : err.stack,
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateMenuItem(req, res) {
    var _a, _b;
    const prisma = req.prisma;
    try {
        const { id } = req.params;
        const _c = req.body, { category } = _c, data = __rest(_c, ["category"]);
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        console.info('[Menu] Update request received', {
            id,
            tenantId,
            updatedFields: Object.keys(req.body),
        });
        if (category) {
            const categoryRecord = await prisma.category.findFirst({ where: { name: category } });
            if (categoryRecord) {
                data.categoryId = categoryRecord.id;
            }
        }
        const item = await prisma.menuItem.update({ where: { id }, data });
        console.info('[Menu] Update success', { tenantId, id: item.id, name: item.name });
        res.json(item);
    }
    catch (err) {
        console.error('[Menu] Update item error', {
            id: req.params.id,
            message: err === null || err === void 0 ? void 0 : err.message,
            stack: err === null || err === void 0 ? void 0 : err.stack,
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteMenuItem(req, res) {
    var _a, _b;
    const prisma = req.prisma;
    try {
        const { id } = req.params;
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        console.info('[Menu] Delete request received', {
            id,
            tenantId,
        });
        await prisma.menuItem.delete({ where: { id } });
        console.info('[Menu] Delete success', { tenantId, id });
        res.json({ deleted: true });
    }
    catch (err) {
        console.error('[Menu] Delete item error', {
            id: req.params.id,
            message: err === null || err === void 0 ? void 0 : err.message,
            stack: err === null || err === void 0 ? void 0 : err.stack,
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function searchMenuItems(req, res) {
    var _a, _b;
    const prisma = req.prisma;
    try {
        const { q, category, isVeg, isPopular } = req.query;
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        console.info('[Menu] Search request received', {
            tenantId,
            q,
            category,
            isVeg,
            isPopular,
        });
        const result = await prisma.menuItem.findMany({
            where: {
                AND: [
                    q ? { name: { contains: q, mode: "insensitive" } } : {},
                    // FIX: Filter by the related category's name
                    category ? { category: { name: { equals: category } } } : {},
                    isVeg !== undefined ? { isVeg: isVeg === "true" } : {},
                    isPopular !== undefined ? { isPopular: isPopular === "true" } : {}
                ]
            },
            // FIX: Include the category name in the result
            include: { category: true }
        });
        console.info('[Menu] Search success', {
            tenantId,
            query: req.query,
            count: result.length,
        });
        res.json(result);
    }
    catch (err) {
        console.error('[Menu] Search items error', {
            query: req.query,
            message: err === null || err === void 0 ? void 0 : err.message,
            stack: err === null || err === void 0 ? void 0 : err.stack,
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
// This function is now obsolete as you have a dedicated /api/categories endpoint
// export async function getMenuCategories(req: Request, res: Response) { ... }
// AI/INSIGHTS/RECOMMENDATIONS STUB
async function getMenuInsights(req, res) {
    var _a, _b;
    try {
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        console.info('[Menu] Insights request received', { tenantId });
        console.info('[Menu] Insights success', { tenantId });
        res.json({
            topSellers: ['Paneer Tikka', 'Burger', 'Pizza'],
            recommended: ['Sizzling Brownie', 'Grilled Fish'],
            lowPerformers: ['Garlic Soup']
        });
    }
    catch (err) {
        console.error('[Menu] Insights error', {
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
            message: err === null || err === void 0 ? void 0 : err.message,
            stack: err === null || err === void 0 ? void 0 : err.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=menu.js.map