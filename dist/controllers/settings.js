"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const tenantPrisma_1 = require("../middleware/tenantPrisma");
async function getSettings(req, res) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    try {
        const prisma = (0, tenantPrisma_1.getTenantPrisma)(req);
        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found',
            });
        }
        return res.json({
            success: true,
            data: {
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                country: (_a = restaurant.country) !== null && _a !== void 0 ? _a : '',
                currency: (_b = restaurant.currency) !== null && _b !== void 0 ? _b : 'INR',
                currencySymbol: (_c = restaurant.currencySymbol) !== null && _c !== void 0 ? _c : '₹',
                businessAddress: (_d = restaurant.address) !== null && _d !== void 0 ? _d : '',
                businessPhone: (_e = restaurant.phone) !== null && _e !== void 0 ? _e : '',
                businessEmail: (_f = restaurant.email) !== null && _f !== void 0 ? _f : '',
                taxNumber: (_g = restaurant.taxNumber) !== null && _g !== void 0 ? _g : '',
                fssaiNumber: (_h = restaurant.fssaiNumber) !== null && _h !== void 0 ? _h : '',
                // Mask sensitive API key for security
                whatsappApiKey: restaurant.whatsappApiKey
                    ? '****' + restaurant.whatsappApiKey.slice(-4)
                    : '',
                whatsappPhoneNumber: (_j = restaurant.whatsappPhoneNumber) !== null && _j !== void 0 ? _j : '',
                enableMarketing: (_k = restaurant.enableMarketing) !== null && _k !== void 0 ? _k : false,
                notifications: (_l = restaurant.notifications) !== null && _l !== void 0 ? _l : true,
                autoBackup: (_m = restaurant.autoBackup) !== null && _m !== void 0 ? _m : false,
                theme: (_o = restaurant.theme) !== null && _o !== void 0 ? _o : 'light',
                language: (_p = restaurant.language) !== null && _p !== void 0 ? _p : 'English',
                taxRules: (_q = restaurant.taxRules) !== null && _q !== void 0 ? _q : null,
                // Plan linkage for permissions
                planId: (_r = restaurant.planId) !== null && _r !== void 0 ? _r : null,
            },
        });
    }
    catch (error) {
        console.error('Settings getSettings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
}
async function updateSettings(req, res) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    try {
        const prisma = (0, tenantPrisma_1.getTenantPrisma)(req);
        const body = req.body;
        const { restaurantName, country, currency, currencySymbol, businessAddress, businessPhone, businessEmail, taxNumber, fssaiNumber, whatsappApiKey, whatsappPhoneNumber, enableMarketing, notifications, autoBackup, theme,
        // planId intentionally not updatable from here for now
         } = body;
        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found',
            });
        }
        // Build update data with explicit undefined checks (allows clearing fields to empty string)
        const updateData = {};
        if (restaurantName !== undefined)
            updateData.name = restaurantName;
        if (country !== undefined)
            updateData.country = country;
        if (currency !== undefined)
            updateData.currency = currency;
        if (currencySymbol !== undefined)
            updateData.currencySymbol = currencySymbol;
        if (businessAddress !== undefined)
            updateData.address = businessAddress;
        if (businessPhone !== undefined)
            updateData.phone = businessPhone;
        if (businessEmail !== undefined)
            updateData.email = businessEmail;
        if (taxNumber !== undefined)
            updateData.taxNumber = taxNumber;
        if (fssaiNumber !== undefined)
            updateData.fssaiNumber = fssaiNumber;
        // Only update whatsapp key if not masked value (security: don't overwrite with masked placeholder)
        if (whatsappApiKey !== undefined && !whatsappApiKey.startsWith('****')) {
            updateData.whatsappApiKey = whatsappApiKey;
        }
        if (whatsappPhoneNumber !== undefined)
            updateData.whatsappPhoneNumber = whatsappPhoneNumber;
        if (typeof enableMarketing === 'boolean')
            updateData.enableMarketing = enableMarketing;
        if (typeof notifications === 'boolean')
            updateData.notifications = notifications;
        if (typeof autoBackup === 'boolean')
            updateData.autoBackup = autoBackup;
        if (theme !== undefined)
            updateData.theme = theme;
        const updated = await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: updateData,
        });
        return res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                restaurantId: updated.id,
                restaurantName: updated.name,
                country: (_a = updated.country) !== null && _a !== void 0 ? _a : '',
                currency: (_b = updated.currency) !== null && _b !== void 0 ? _b : 'INR',
                currencySymbol: (_c = updated.currencySymbol) !== null && _c !== void 0 ? _c : '₹',
                businessAddress: (_d = updated.address) !== null && _d !== void 0 ? _d : '',
                businessPhone: (_e = updated.phone) !== null && _e !== void 0 ? _e : '',
                businessEmail: (_f = updated.email) !== null && _f !== void 0 ? _f : '',
                taxNumber: (_g = updated.taxNumber) !== null && _g !== void 0 ? _g : '',
                fssaiNumber: (_h = updated.fssaiNumber) !== null && _h !== void 0 ? _h : '',
                // Mask sensitive API key for security
                whatsappApiKey: updated.whatsappApiKey
                    ? '****' + updated.whatsappApiKey.slice(-4)
                    : '',
                whatsappPhoneNumber: (_j = updated.whatsappPhoneNumber) !== null && _j !== void 0 ? _j : '',
                enableMarketing: (_k = updated.enableMarketing) !== null && _k !== void 0 ? _k : false,
                notifications: (_l = updated.notifications) !== null && _l !== void 0 ? _l : true,
                autoBackup: (_m = updated.autoBackup) !== null && _m !== void 0 ? _m : false,
                theme: (_o = updated.theme) !== null && _o !== void 0 ? _o : 'light',
                language: (_p = updated.language) !== null && _p !== void 0 ? _p : 'English',
                taxRules: (_q = updated.taxRules) !== null && _q !== void 0 ? _q : null,
                planId: (_r = updated.planId) !== null && _r !== void 0 ? _r : null,
            },
        });
    }
    catch (error) {
        console.error('Settings updateSettings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
}
//# sourceMappingURL=settings.js.map