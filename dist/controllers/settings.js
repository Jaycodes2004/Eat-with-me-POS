"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
async function getSettings(req, res) {
    var _a;
    const prisma = req.prisma;
    const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
    if (!prisma) {
        console.error('[Settings] Missing tenant prisma client', { tenantId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        console.info('[Settings] Fetch request received', { tenantId });
        const restaurant = await prisma.restaurant.findFirst();
        if (restaurant) {
            console.info('[Settings] Fetch success', { tenantId, id: restaurant.id });
            res.json(restaurant);
        }
        else {
            console.warn('[Settings] Fetch found no record', { tenantId });
            res.status(404).json({ error: 'Restaurant settings not found' });
        }
    }
    catch (error) {
        console.error('[Settings] Fetch failed', {
            tenantId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
}
async function updateSettings(req, res) {
    var _a, _b;
    const prisma = req.prisma;
    const tenantId = (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId;
    if (!prisma) {
        console.error('[Settings] Missing tenant prisma client', { tenantId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        console.info('[Settings] Update request received', {
            tenantId,
            fields: Object.keys((_b = req.body) !== null && _b !== void 0 ? _b : {}),
        });
        const firstRestaurant = await prisma.restaurant.findFirst();
        if (!firstRestaurant) {
            console.warn('[Settings] Update attempted with no existing record', { tenantId });
            return res.status(404).json({ error: 'Restaurant settings not found to update' });
        }
        const updatedSettings = await prisma.restaurant.update({
            where: { id: firstRestaurant.id },
            data: req.body,
        });
        console.info('[Settings] Update success', { tenantId, id: updatedSettings.id });
        res.json(updatedSettings);
    }
    catch (error) {
        console.error('[Settings] Update failed', {
            tenantId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Failed to update settings' });
    }
}
//# sourceMappingURL=settings.js.map