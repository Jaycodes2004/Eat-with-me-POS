/** @format */

import { Request, Response } from 'express';
import { liveUpdates } from '../utils/liveUpdates';

const ORDER_EVENT = 'orders:updated';

const toUpper = (value: unknown, fallback: string) => {
	if (!value) return fallback;
	return String(value).toUpperCase();
};

const toLower = (value: unknown, fallback: string) => {
	if (!value) return fallback;
	return String(value).toLowerCase();
};

const mapOrderItem = (item: any) => ({
	id: item.id,
	orderId: item.orderId,
	menuItemId: item.menuItemId,
	name: item.name,
	category: item.category,
	quantity: item.quantity,
	price: item.price,
	notes: item.notes,
	modifiers: item.modifiers || [],
});

const mapOrderRecord = (order: any) => ({
	id: order.id,
	orderNumber: order.orderNumber,
	tableId: order.tableId,
	tableNumber: order.table?.number || null,
	orderSource: toLower(order.orderSource, 'pos'),
	status: toLower(order.status, 'new'),
	priority: toLower(order.priority, 'normal'),
	deliveryType: toLower(order.deliveryType, 'dine_in'),
	subtotal: Number(order.subtotal) || 0,
	taxAmount: Number(order.taxAmount) || 0,
	discount: Number(order.discount) || 0,
	totalAmount: Number(order.totalAmount) || 0,
	paymentMethod: order.paymentMethod,
	paymentStatus: order.paymentStatus,
	paymentBreakdown: order.paymentBreakdown || {},
	taxes: order.taxes || [],
	tipAmount: Number(order.tipAmount) || 0,
	waiterId: order.waiterId,
	waiterName: order.waiter?.name || null,
	customerId: order.customerId,
	customerName: order.customer?.name || null,
	customerPhone: order.customer?.phone || null,
	orderTime: order.orderTime,
	estimatedTime: order.estimatedTime,
	actualCookingTime: order.actualCookingTime,
	completedAt: order.completedAt,
	deliveryAddress: order.deliveryAddress,
	specialInstructions: order.specialInstructions,
	feedback: order.feedback,
	rating: order.rating,
	metadata: order.metadata || {},
	items: Array.isArray(order.items) ? order.items.map(mapOrderItem) : [],
});

const generateOrderNumber = () =>
	`ORD-${Date.now().toString(36).toUpperCase()}`;

export async function getAllOrders(req: Request, res: Response) {
	const prisma = (req as any).prisma;
	try {
		const orders = await prisma.order.findMany({
			include: {
				customer: true,
				table: true,
				waiter: true,
				items: true,
			},
			orderBy: { orderTime: 'desc' },
		});
		res.json(orders.map(mapOrderRecord));
	} catch (error) {
		console.error('Error fetching orders:', error);
		res.status(500).json({ error: 'Failed to fetch orders' });
	}
}

export async function createOrder(req: Request, res: Response) {
	console.log('➡️ createOrder called', {
		body: req.body,
		tenant: (req as any).tenant?.id,
	});
	const prisma = (req as any).prisma;
	try {
		const tenant = (req as any).tenant;
		const useRedis = (req as any).useRedis;
		const { items, customerId, tableId, waiterId, orderTime, ...orderData } =
			req.body;
		if (!items || items.length === 0) {
			return res
				.status(400)
				.json({ error: 'Order must contain at least one item.' });
		}

		const normalizedItems = items.map((item: any) => ({
			menuItemId: item.menuItemId || null,
			name: item.name,
			category: item.category || null,
			quantity: Number(item.quantity) || 1,
			price: Number(item.price) || 0,
			notes: item.notes,
			modifiers: item.modifiers || [],
		}));

		const subtotal = normalizedItems.reduce(
			(sum: number, item: any) => sum + item.price * item.quantity,
			0
		);
		const totalAmount = orderData.totalAmount ?? subtotal;
		const taxAmount = orderData.taxAmount ?? 0;
		const discount = orderData.discount ?? 0;
		const tipAmount = orderData.tipAmount ?? 0;

		const newOrder = await prisma.order.create({
			data: {
				orderNumber: orderData.orderNumber || generateOrderNumber(),
				orderSource: orderData.orderSource || 'POS',
				status: toUpper(orderData.status, 'NEW'),
				priority: toUpper(orderData.priority, 'NORMAL'),
				deliveryType: toUpper(orderData.deliveryType, 'DINE_IN'),
				subtotal,
				taxAmount,
				discount,
				totalAmount,
				paymentMethod: orderData.paymentMethod || 'cash',
				paymentStatus: orderData.paymentStatus || 'paid',
				paymentBreakdown: orderData.paymentBreakdown || {},
				taxes: orderData.taxes || [],
				tipAmount,
				waiter: waiterId ? { connect: { id: waiterId } } : undefined,
				customer: customerId ? { connect: { id: customerId } } : undefined,
				table: tableId ? { connect: { id: tableId } } : undefined,
				specialInstructions: orderData.specialInstructions,
				deliveryAddress: orderData.deliveryAddress,
				orderTime: orderTime ? new Date(orderTime) : undefined,
				estimatedTime: orderData.estimatedTime,
				metadata: orderData.metadata || {},
				items: {
					create: normalizedItems,
				},
			},
			include: {
				customer: true,
				table: true,
				waiter: true,
				items: true,
			},
		});

		// Update table status if applicable
		if (tableId) {
			await prisma.table.update({
				where: { id: tableId },
				data: {
					status: 'OCCUPIED',
					guests:
						orderData.guests ||
						normalizedItems.reduce(
							(sum: number, item: any) => sum + item.quantity,
							0
						),
					currentOrderId: newOrder.id,
					lastOrderAt: new Date(),
				},
			});
		}

		// Update customer statistics
		if (customerId) {
			await prisma.customer.update({
				where: { id: customerId },
				data: {
					totalSpent: { increment: totalAmount },
					totalOrders: { increment: 1 },
					visitCount: { increment: 1 },
					lastVisit: new Date(),
				},
			});
		}

		await liveUpdates.publish(
			tenant.restaurantId,
			ORDER_EVENT,
			{ type: 'created', order: mapOrderRecord(newOrder) },
			useRedis
		);

		res.status(201).json(mapOrderRecord(newOrder));
	} catch (error) {
		console.error('Error creating order:', error);
		res.status(500).json({ error: 'Failed to create order' });
	}
}

export async function getOrderById(req: Request, res: Response) {
	const prisma = (req as any).prisma;
	const { id } = req.params;
	try {
		const order = await prisma.order.findUnique({
			where: { id },
			include: { customer: true, table: true, waiter: true, items: true },
		});
		if (order) {
			res.json(mapOrderRecord(order));
		} else {
			res.status(404).json({ error: 'Order not found' });
		}
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch order' });
	}
}

export async function updateOrder(req: Request, res: Response) {
	console.log('➡️ updateOrder called', {
		params: req.params,
		body: req.body,
		tenant: (req as any).tenant?.id,
	});
	const prisma = (req as any).prisma;
	const { id } = req.params;
	try {
		const tenant = (req as any).tenant;
		const useRedis = (req as any).useRedis;
		const { status, tableId, items, waiterId, customerId, ...updateData } =
			req.body;

		const data: any = { ...updateData };

		if (status) {
			data.status = toUpper(status, 'NEW');
			if (toUpper(status, '') === 'COMPLETED') {
				data.completedAt = new Date();
			}
		}

		if (tableId !== undefined) {
			data.table = tableId
				? { connect: { id: tableId } }
				: { disconnect: true };
		}

		if (waiterId !== undefined) {
			data.waiter = waiterId
				? { connect: { id: waiterId } }
				: { disconnect: true };
		}

		if (customerId !== undefined) {
			data.customer = customerId
				? { connect: { id: customerId } }
				: { disconnect: true };
		}

		if (items && Array.isArray(items)) {
			const normalizedItems = items.map((item: any) => ({
				id: item.id,
				menuItemId: item.menuItemId || null,
				name: item.name,
				category: item.category || null,
				quantity: Number(item.quantity) || 1,
				price: Number(item.price) || 0,
				notes: item.notes,
				modifiers: item.modifiers || [],
			}));

			data.items = {
				deleteMany: { orderId: id },
				create: normalizedItems,
			};
		}

		const updatedOrder = await prisma.order.update({
			where: { id },
			data,
			include: { customer: true, table: true, waiter: true, items: true },
		});

		// Update table status based on order state
		if (updatedOrder.tableId) {
			const tableStatus =
				updatedOrder.status === 'COMPLETED' ? 'FREE' : 'OCCUPIED';
			await prisma.table.update({
				where: { id: updatedOrder.tableId },
				data: {
					status: tableStatus,
					currentOrderId: tableStatus === 'FREE' ? null : updatedOrder.id,
					lastOrderAt: tableStatus === 'FREE' ? new Date() : undefined,
				},
			});
		}

		await liveUpdates.publish(
			tenant.restaurantId,
			ORDER_EVENT,
			{ type: 'updated', order: mapOrderRecord(updatedOrder) },
			useRedis
		);

		res.json(mapOrderRecord(updatedOrder));
	} catch (error) {
		res.status(500).json({ error: 'Failed to update order' });
	}
}

export async function deleteOrder(req: Request, res: Response) {
	console.log('➡️ deleteOrder called', {
		params: req.params,
		tenant: (req as any).tenant?.id,
	});
	const prisma = (req as any).prisma;
	const { id } = req.params;
	try {
		const tenant = (req as any).tenant;
		const useRedis = (req as any).useRedis;
		const order = await prisma.order.delete({
			where: { id },
			include: { table: true },
		});

		if (order.tableId) {
			await prisma.table.update({
				where: { id: order.tableId },
				data: {
					status: 'FREE',
					currentOrderId: null,
					guests: 0,
					lastOrderAt: new Date(),
				},
			});
		}

		await liveUpdates.publish(
			tenant.restaurantId,
			ORDER_EVENT,
			{ type: 'deleted', orderId: id },
			useRedis
		);

		res.json({ deleted: true });
	} catch (error) {
		console.error('Error deleting order:', error);
		res.status(500).json({ error: 'Failed to delete order' });
	}
}

// FILTERS, STATUS, SOURCE, TODAY/DATE RANGE, REVENUE

export async function searchOrders(req: Request, res: Response) {
	const prisma = (req as any).prisma;
	const { q, tableId, status, source, from, to } = req.query;
	try {
		const orders = await prisma.order.findMany({
			where: {
				AND: [
					q
						? {
								OR: [
									{
										orderNumber: { contains: q as string, mode: 'insensitive' },
									},
									{
										customer: {
											name: { contains: q as string, mode: 'insensitive' },
										},
									},
									{
										table: {
											name: { contains: q as string, mode: 'insensitive' },
										},
									},
								],
						  }
						: {},
					tableId ? { tableId: tableId as string } : {},
					status ? { status: toUpper(status, 'NEW') } : {},
					source ? { orderSource: toUpper(source, 'POS') } : {},
					from ? { orderTime: { gte: new Date(from as string) } } : {},
					to ? { orderTime: { lte: new Date(to as string) } } : {},
				],
			},
			include: { customer: true, table: true, waiter: true, items: true },
			orderBy: { orderTime: 'desc' },
		});
		res.json(orders.map(mapOrderRecord));
	} catch (error) {
		console.error('Error searching orders:', error);
		res.status(500).json({ error: 'Failed to search orders' });
	}
}

export async function getOrderStats(req: Request, res: Response) {
	const prisma = (req as any).prisma;
	const { from, to } = req.query;
	try {
		const where = {
			orderTime: {
				gte: from ? new Date(from as string) : undefined,
				lte: to ? new Date(to as string) : undefined,
			},
		};

		const [aggregates, statusBreakdown] = await Promise.all([
			prisma.order.aggregate({
				_count: { _all: true },
				_sum: { totalAmount: true, tipAmount: true },
				_avg: { totalAmount: true },
				where,
			}),
			prisma.order.groupBy({
				by: ['status'],
				_count: { _all: true },
				where,
			}),
		]);

		res.json({
			totalOrders: aggregates._count._all,
			totalRevenue: aggregates._sum.totalAmount || 0,
			averageOrderValue: aggregates._avg.totalAmount || 0,
			tipsCollected: aggregates._sum.tipAmount || 0,
			statusBreakdown: statusBreakdown.map((entry: any) => ({
				status: toLower(entry.status, 'new'),
				count: entry._count._all,
			})),
		});
	} catch (error) {
		console.error('Error fetching order stats:', error);
		res.status(500).json({ error: 'Failed to fetch order stats' });
	}
}
