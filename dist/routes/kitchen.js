"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.kitchenRoutes = void 0;
const express_1 = require("express");
const kitchen_1 = require("../controllers/kitchen");
const liveUpdates_1 = require("../utils/liveUpdates");
const router = (0, express_1.Router)();
exports.kitchenRoutes = router;
// GET /api/kitchen - Fetches all active kitchen orders
router.get('/', kitchen_1.getKitchenOrders);
// PUT /api/kitchen/:id/status - Updates the status of an order (e.g., 'Preparing', 'Ready')
router.put('/:id/status', kitchen_1.updateOrderStatus);
// GET /api/kitchen/stream - Server-Sent Events for live kitchen order updates
router.get('/stream', (req, res) => {
    var _a, _b;
    const tenant = req.tenant;
    const restaurantId = tenant === null || tenant === void 0 ? void 0 : tenant.restaurantId;
    if (!restaurantId) {
        return res.status(400).json({ error: 'Missing restaurant context' });
    }
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    (_b = (_a = res).flushHeaders) === null || _b === void 0 ? void 0 : _b.call(_a);
    const ORDER_EVENT = 'orders:updated';
    // liveUpdates.on(tenantId, listener)
    const unsubscribe = liveUpdates_1.liveUpdates.on(restaurantId, (payload) => {
        if (payload.event !== ORDER_EVENT)
            return;
        // payload.data is { type: 'created' | 'updated' | 'deleted', order/... }
        res.write(`data: ${JSON.stringify(payload.data)}\n\n`);
    });
    req.on('close', () => {
        unsubscribe();
        res.end();
    });
});
//# sourceMappingURL=kitchen.js.map