/** @format */

import { Router } from 'express';
import { getKitchenOrders, updateOrderStatus } from '../controllers/kitchen';
import { liveUpdates } from '../utils/liveUpdates';

const router = Router();

// GET /api/kitchen - Fetches all active kitchen orders
router.get('/', getKitchenOrders);

// PUT /api/kitchen/:id/status - Updates the status of an order (e.g., 'Preparing', 'Ready')
router.put('/:id/status', updateOrderStatus);

// GET /api/kitchen/stream - Server-Sent Events for live kitchen order updates
router.get('/stream', (req, res) => {
	const tenant = (req as any).tenant;
	const restaurantId = tenant?.restaurantId;

	if (!restaurantId) {
		return res.status(400).json({ error: 'Missing restaurant context' });
	}

	// SSE headers
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	(res as any).flushHeaders?.();

	const ORDER_EVENT = 'orders:updated';

	// liveUpdates.on(tenantId, listener)
	const unsubscribe = liveUpdates.on(restaurantId, (payload: any) => {
		if (payload.event !== ORDER_EVENT) return;
		// payload.data is { type: 'created' | 'updated' | 'deleted', order/... }
		res.write(`data: ${JSON.stringify(payload.data)}\n\n`);
	});

	req.on('close', () => {
		unsubscribe();
		res.end();
	});
});

export { router as kitchenRoutes };
