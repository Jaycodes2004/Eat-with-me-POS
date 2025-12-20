/** @format */

// src/controllers/settings.ts

import { Request, Response } from 'express';
import { getTenantPrisma } from '../middleware/tenantPrisma';

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
				planId: restaurant.planId ?? null,
			},
		});
	} catch (error: any) {
		console.error('Settings getSettings error:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to load settings',
			error: error.message,
		});
	}
}

export async function updateSettings(req: Request, res: Response) {
	try {
		const prisma = getTenantPrisma(req);
		const {
			restaurantName,
			country,
			currency,
			currencySymbol,
			businessAddress,
			businessPhone,
			businessEmail,
			whatsappApiKey,
			whatsappPhoneNumber,
			notifications,
			autoBackup,
			theme,
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
				name: restaurantName ?? restaurant.name,
				country: country ?? restaurant.country,
				currency: currency ?? restaurant.currency,
				currencySymbol: currencySymbol ?? restaurant.currencySymbol,
				address: businessAddress ?? restaurant.address,
				phone: businessPhone ?? restaurant.phone,
				email: businessEmail ?? restaurant.email,
				whatsappApiKey: whatsappApiKey ?? restaurant.whatsappApiKey,
				whatsappPhoneNumber:
					whatsappPhoneNumber ?? restaurant.whatsappPhoneNumber,
				notifications:
					typeof notifications === 'boolean'
						? notifications
						: restaurant.notifications,
				autoBackup:
					typeof autoBackup === 'boolean' ? autoBackup : restaurant.autoBackup,
				theme: theme ?? restaurant.theme,
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
				planId: updated.planId ?? null,
			},
		});
	} catch (error: any) {
		console.error('Settings updateSettings error:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to update settings',
			error: error.message,
		});
	}
}
