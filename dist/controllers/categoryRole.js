"use strict";
// src/controllers/categoryRole.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRole = exports.createRole = void 0;
exports.getCategoriesAndRoles = getCategoriesAndRoles;
exports.getCategories = getCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.getRoles = getRoles;
exports.deleteRole = deleteRole;
const library_1 = require("@prisma/client/runtime/library");
function getPrismaOr500(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        res.status(500).json({ error: 'Tenant database not available' });
        return null;
    }
    return prisma;
}
async function getCategoriesAndRoles(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
    try {
        console.info('[Categories/Roles] Fetch request received', { tenantId });
        const [categories, roles] = await Promise.all([
            prisma.category.findMany({ orderBy: { createdAt: 'desc' } }),
            prisma.role.findMany({ orderBy: { createdAt: 'desc' } }),
        ]);
        console.info('[Categories/Roles] Fetch success', {
            tenantId,
            categoryCount: categories.length,
            roleCount: roles.length,
        });
        res.json({ categories, roles });
    }
    catch (error) {
        console.error('[Categories/Roles] Fetch failed', {
            tenantId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Failed to fetch categories and roles' });
    }
}
// ---- Categories ----
async function getCategories(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
    try {
        const { type } = req.query;
        const where = type ? { type: type } : {};
        console.info('[Categories] List request received', {
            tenantId,
            type: type !== null && type !== void 0 ? type : 'all',
        });
        const cats = await prisma.category.findMany({ where, orderBy: { createdAt: 'desc' } });
        console.info('[Categories] List success', {
            tenantId,
            type: type !== null && type !== void 0 ? type : 'all',
            count: cats.length,
        });
        res.json(cats);
    }
    catch (error) {
        console.error('[Categories] List failed', {
            tenantId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}
async function createCategory(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
    try {
        const { name, description, color, type, isActive } = req.body;
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const rawType = typeof type === 'string' ? type.trim().toLowerCase() : '';
        const allowedTypes = new Set(['menu', 'expense', 'inventory', 'supplier']);
        if (!trimmedName) {
            console.warn('[Categories] Create missing name', { tenantId, providedName: name });
            return res.status(400).json({ error: 'Category name is required' });
        }
        if (!rawType || !allowedTypes.has(rawType)) {
            console.warn('[Categories] Create invalid type', { tenantId, providedType: type });
            return res.status(400).json({ error: 'Category type is invalid' });
        }
        const normalizedColor = typeof color === 'string' && color.trim().length > 0
            ? color.trim()
            : undefined;
        const data = {
            name: trimmedName,
            type: rawType,
            isActive: typeof isActive === 'boolean' ? isActive : true,
        };
        if (description !== undefined) {
            data.description = description;
        }
        if (normalizedColor) {
            data.color = normalizedColor;
        }
        console.info('[Categories] Create request received', {
            tenantId,
            name: trimmedName,
            type: rawType,
        });
        const cat = await prisma.category.create({
            data,
        });
        console.info('[Categories] Create success', {
            tenantId,
            id: cat.id,
            name: cat.name,
            type: cat.type,
        });
        res.status(201).json(cat);
    }
    catch (error) {
        console.error('[Categories] Create failed', {
            tenantId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        if (error instanceof library_1.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: 'Category name already exists' });
        }
        res.status(500).json({ error: 'Failed to create category' });
    }
}
async function updateCategory(req, res) {
    var _a, _b;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { id } = req.params;
    const { name, description, color, type, isActive } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
    const tenantId = (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId;
    const data = {};
    if (name !== undefined) {
        const trimmed = typeof name === 'string' ? name.trim() : '';
        if (!trimmed)
            return res.status(400).json({ error: 'Category name cannot be empty' });
        data.name = trimmed;
    }
    if (type !== undefined) {
        const rawType = typeof type === 'string' ? type.trim().toLowerCase() : '';
        const allowedTypes = new Set(['menu', 'expense', 'inventory', 'supplier']);
        if (!rawType || !allowedTypes.has(rawType)) {
            return res.status(400).json({ error: 'Category type is invalid' });
        }
        data.type = rawType;
    }
    if (description !== undefined)
        data.description = description;
    if (color !== undefined) {
        const normalizedColor = typeof color === 'string' && color.trim().length > 0 ? color.trim() : null;
        data.color = normalizedColor;
    }
    if (isActive !== undefined) {
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive must be boolean' });
        }
        data.isActive = isActive;
    }
    try {
        console.info('[Categories] Update request received', {
            tenantId,
            id,
            fields: Object.keys(data),
        });
        const cat = await prisma.category.update({ where: { id }, data });
        console.info('[Categories] Update success', {
            tenantId,
            id: cat.id,
            name: cat.name,
        });
        res.json(cat);
    }
    catch (error) {
        console.error('[Categories] Update failed', {
            tenantId,
            id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2025')
                return res.status(404).json({ error: 'Category not found' });
            if (error.code === 'P2002')
                return res.status(409).json({ error: 'Category name already exists' });
        }
        res.status(500).json({ error: 'Failed to update category' });
    }
}
async function deleteCategory(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { id } = req.params;
    const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
    try {
        console.info('[Categories] Delete request received', { tenantId, id });
        await prisma.category.delete({ where: { id } });
        console.info('[Categories] Delete success', { tenantId, id });
        res.json({ deleted: true });
    }
    catch (error) {
        console.error('[Categories] Delete failed', {
            tenantId,
            id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2025')
                return res.status(404).json({ error: 'Category not found' });
            if (error.code === 'P2003')
                return res.status(409).json({ error: 'Category is in use and cannot be deleted' });
        }
        res.status(500).json({ error: 'Failed to delete category' });
    }
}
// ---- Roles ----
async function getRoles(req, res) {
    var _a, _b;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    try {
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        console.info('[Roles] List request received', { tenantId });
        const roles = await prisma.role.findMany({ orderBy: { createdAt: 'desc' } });
        console.info('[Roles] List success', { tenantId, count: roles.length });
        res.json(roles);
    }
    catch (error) {
        console.error('[Roles] List failed', {
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
}
const createRole = async (req, res) => {
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { name, permissions, dashboardModules } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Role name is required.' });
    }
    // --- THIS IS THE FIX ---
    // Validate that permissions is an array, defaulting to an empty one if not provided.
    if (permissions && !Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Permissions must be an array of strings.' });
    }
    if (dashboardModules && !Array.isArray(dashboardModules)) {
        return res.status(400).json({ error: 'dashboardModules must be an array of strings.' });
    }
    // --- END OF FIX ---
    try {
        const newRole = await prisma.role.create({
            // Ensure we always save an array
            data: {
                name: name.trim(),
                permissions: permissions || [],
                dashboardModules: dashboardModules || [],
            },
        });
        res.status(201).json(newRole);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'A role with this name already exists.' });
        }
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role.' });
    }
};
exports.createRole = createRole;
const updateRole = async (req, res) => {
    var _a, _b;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { id } = req.params;
    const { name, permissions, dashboardModules } = req.body;
    // --- THIS IS THE FIX ---
    // Validate that permissions is an array if it's being updated.
    if (permissions && !Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Permissions must be an array of strings.' });
    }
    if (dashboardModules && !Array.isArray(dashboardModules)) {
        return res.status(400).json({ error: 'dashboardModules must be an array of strings.' });
    }
    // --- END OF FIX ---
    const data = {};
    if (name !== undefined) {
        if (!name.trim())
            return res.status(400).json({ error: 'Role name cannot be empty.' });
        data.name = name.trim();
    }
    if (permissions !== undefined)
        data.permissions = permissions;
    if (dashboardModules !== undefined)
        data.dashboardModules = dashboardModules;
    try {
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        console.info('[Roles] Update request received', { tenantId, id, fields: Object.keys(req.body) });
        const updatedRole = await prisma.role.update({
            where: { id },
            data,
        });
        console.info('[Roles] Update success', { tenantId, id });
        res.json(updatedRole);
    }
    catch (error) {
        console.error('[Roles] Update failed', {
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
            id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2025')
                return res.status(404).json({ error: 'Role not found.' });
            if (error.code === 'P2002')
                return res.status(409).json({ error: 'A role with this name already exists.' });
        }
        res.status(500).json({ error: 'Failed to update role.' });
    }
};
exports.updateRole = updateRole;
async function deleteRole(req, res) {
    var _a, _b;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    try {
        const { id } = req.params;
        const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
        console.info('[Roles] Delete request received', { tenantId, id });
        await prisma.role.delete({ where: { id } });
        console.info('[Roles] Delete success', { tenantId, id });
        res.json({ deleted: true });
    }
    catch (error) {
        console.error('[Roles] Delete failed', {
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b.restaurantId,
            id: req.params.id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2025')
                return res.status(404).json({ error: 'Role not found' });
            if (error.code === 'P2003')
                return res.status(409).json({ error: 'Role is in use and cannot be deleted' });
        }
        res.status(500).json({ error: 'Failed to delete role' });
    }
}
//# sourceMappingURL=categoryRole.js.map