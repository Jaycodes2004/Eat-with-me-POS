"use strict";
// import { Request, Response } from 'express';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const tenantPrisma_1 = require("../middleware/tenantPrisma");
async function getSettings(req, res) {
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
                restaurantName: restaurant.name,
                country: restaurant.country,
                currency: restaurant.currency,
                currencySymbol: restaurant.currencySymbol,
                businessAddress: restaurant.address,
                businessPhone: restaurant.phone,
                businessEmail: restaurant.email,
                whatsappApiKey: restaurant.whatsappApiKey,
                whatsappPhoneNumber: restaurant.whatsappPhoneNumber,
                notifications: restaurant.notifications,
                autoBackup: restaurant.autoBackup,
                theme: restaurant.theme,
                // Plan linkage for permissions
                planId: restaurant.planId || null,
            },
        });
    }
    catch (error) {
        console.error('[Settings] getSettings error', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load settings',
            error: error.message,
        });
    }
}
async function updateSettings(req, res) {
    try {
        const prisma = (0, tenantPrisma_1.getTenantPrisma)(req);
        const { restaurantName, country, currency, currencySymbol, businessAddress, businessPhone, businessEmail, whatsappApiKey, whatsappPhoneNumber, notifications, autoBackup, theme,
        // planId intentionally not updatable from here for now
         } = req.body;
        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found',
            });
        }
        const updated = await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: {
                name: restaurantName !== null && restaurantName !== void 0 ? restaurantName : restaurant.name,
                country: country !== null && country !== void 0 ? country : restaurant.country,
                currency: currency !== null && currency !== void 0 ? currency : restaurant.currency,
                currencySymbol: currencySymbol !== null && currencySymbol !== void 0 ? currencySymbol : restaurant.currencySymbol,
                address: businessAddress !== null && businessAddress !== void 0 ? businessAddress : restaurant.address,
                phone: businessPhone !== null && businessPhone !== void 0 ? businessPhone : restaurant.phone,
                email: businessEmail !== null && businessEmail !== void 0 ? businessEmail : restaurant.email,
                whatsappApiKey: whatsappApiKey !== null && whatsappApiKey !== void 0 ? whatsappApiKey : restaurant.whatsappApiKey,
                whatsappPhoneNumber: whatsappPhoneNumber !== null && whatsappPhoneNumber !== void 0 ? whatsappPhoneNumber : restaurant.whatsappPhoneNumber,
                notifications: typeof notifications === 'boolean'
                    ? notifications
                    : restaurant.notifications,
                autoBackup: typeof autoBackup === 'boolean'
                    ? autoBackup
                    : restaurant.autoBackup,
                theme: theme !== null && theme !== void 0 ? theme : restaurant.theme,
            },
        });
        return res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                restaurantName: updated.name,
                country: updated.country,
                currency: updated.currency,
                currencySymbol: updated.currencySymbol,
                businessAddress: updated.address,
                businessPhone: updated.phone,
                businessEmail: updated.email,
                whatsappApiKey: updated.whatsappApiKey,
                whatsappPhoneNumber: updated.whatsappPhoneNumber,
                notifications: updated.notifications,
                autoBackup: updated.autoBackup,
                theme: updated.theme,
                planId: updated.planId || null,
            },
        });
    }
    catch (error) {
        console.error('[Settings] updateSettings error', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message,
        });
    }
}
//# sourceMappingURL=settings.js.map