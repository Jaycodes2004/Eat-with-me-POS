/** @format */

// src/controllers/settings.ts

import { Request, Response } from 'express';
import { getTenantPrisma } from '../middleware/tenantPrisma';

// Type definitions for request body
interface UpdateSettingsBody {
	restaurantName?: string;
	country?: string;
	currency?: string;
	currencySymbol?: string;
	businessAddress?: string;
	businessPhone?: string;
	businessEmail?: string;
	taxNumber?: string;
	fssaiNumber?: string;
	whatsappApiKey?: string;
	whatsappPhoneNumber?: string;
	enableMarketing?: boolean;
	notifications?: boolean;
	autoBackup?: boolean;
	theme?: string;
}

export async function getSettings(req: Request, res: Response) {
	try {
		const prisma = getTenantPrisma(req);
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
				country: restaurant.country ?? '',
				currency: restaurant.currency ?? 'INR',
				currencySymbol: restaurant.currencySymbol ?? '₹',
				businessAddress: restaurant.address ?? '',
				businessPhone: restaurant.phone ?? '',
				businessEmail: restaurant.email ?? '',
				taxNumber: restaurant.taxNumber ?? '',
				fssaiNumber: restaurant.fssaiNumber ?? '',
				// Mask sensitive API key for security
				whatsappApiKey: restaurant.whatsappApiKey
					? '****' + restaurant.whatsappApiKey.slice(-4)
					: '',
				whatsappPhoneNumber: restaurant.whatsappPhoneNumber ?? '',
				enableMarketing: restaurant.enableMarketing ?? false,
				notifications: restaurant.notifications ?? true,
				autoBackup: restaurant.autoBackup ?? false,
				theme: restaurant.theme ?? 'light',
				language: restaurant.language ?? 'English',
				taxRules: restaurant.taxRules ?? null,
				// Plan linkage for permissions
				planId: restaurant.planId ?? null,
			},
		});
	} catch (error: any) {
		console.error('Settings getSettings error:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to load settings',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined,
		});
	}
}

export async function updateSettings(req: Request, res: Response) {
	try {
		const prisma = getTenantPrisma(req);
		const body: UpdateSettingsBody = req.body;

		const {
			restaurantName,
			country,
			currency,
			currencySymbol,
			businessAddress,
			businessPhone,
			businessEmail,
			taxNumber,
			fssaiNumber,
			whatsappApiKey,
			whatsappPhoneNumber,
			enableMarketing,
			notifications,
			autoBackup,
			theme,
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
		const updateData: Record<string, any> = {};

		if (restaurantName !== undefined) updateData.name = restaurantName;
		if (country !== undefined) updateData.country = country;
		if (currency !== undefined) updateData.currency = currency;
		if (currencySymbol !== undefined) updateData.currencySymbol = currencySymbol;
		if (businessAddress !== undefined) updateData.address = businessAddress;
		if (businessPhone !== undefined) updateData.phone = businessPhone;
		if (businessEmail !== undefined) updateData.email = businessEmail;
		if (taxNumber !== undefined) updateData.taxNumber = taxNumber;
		if (fssaiNumber !== undefined) updateData.fssaiNumber = fssaiNumber;

		// Only update whatsapp key if not masked value (security: don't overwrite with masked placeholder)
		if (whatsappApiKey !== undefined && !whatsappApiKey.startsWith('****')) {
			updateData.whatsappApiKey = whatsappApiKey;
		}
		if (whatsappPhoneNumber !== undefined) updateData.whatsappPhoneNumber = whatsappPhoneNumber;

		if (typeof enableMarketing === 'boolean') updateData.enableMarketing = enableMarketing;
		if (typeof notifications === 'boolean') updateData.notifications = notifications;
		if (typeof autoBackup === 'boolean') updateData.autoBackup = autoBackup;
		if (theme !== undefined) updateData.theme = theme;

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
				country: updated.country ?? '',
				currency: updated.currency ?? 'INR',
				currencySymbol: updated.currencySymbol ?? '₹',
				businessAddress: updated.address ?? '',
				businessPhone: updated.phone ?? '',
				businessEmail: updated.email ?? '',
				taxNumber: updated.taxNumber ?? '',
				fssaiNumber: updated.fssaiNumber ?? '',
				// Mask sensitive API key for security
				whatsappApiKey: updated.whatsappApiKey
					? '****' + updated.whatsappApiKey.slice(-4)
					: '',
				whatsappPhoneNumber: updated.whatsappPhoneNumber ?? '',
				enableMarketing: updated.enableMarketing ?? false,
				notifications: updated.notifications ?? true,
				autoBackup: updated.autoBackup ?? false,
				theme: updated.theme ?? 'light',
				language: updated.language ?? 'English',
				taxRules: updated.taxRules ?? null,
				planId: updated.planId ?? null,
			},
		});
	} catch (error: any) {
		console.error('Settings updateSettings error:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to update settings',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined,
		});
	}
}
