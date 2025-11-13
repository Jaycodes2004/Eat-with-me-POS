"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = require("express");
const order_1 = require("../controllers/order");
const liveUpdates_1 = require("../utils/liveUpdates");
const router = (0, express_1.Router)();
exports.orderRoutes = router;
router.get("/", order_1.getAllOrders);
router.get("/search", order_1.searchOrders);
router.get("/stats", order_1.getOrderStats);
router.get("/:id", order_1.getOrderById);
router.post("/", order_1.createOrder);
router.put("/:id", order_1.updateOrder);
router.delete("/:id", order_1.deleteOrder);
// SSE endpoint for order updates
router.get('/stream', (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
    res.flushHeaders();
    const tenant = req.tenant;
    const useRedis = req.useRedis;
    if (tenant) {
        liveUpdates_1.liveUpdates
            .publish(tenant.restaurantId, 'orders:heartbeat', { connected: true }, useRedis)
            .catch((err) => console.error('Failed to publish initial heartbeat', err));
    }
    const listener = (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    const unsubscribe = tenant ? liveUpdates_1.liveUpdates.on(tenant.restaurantId, listener) : null;
    const interval = setInterval(() => {
        res.write(`data: ping\n\n`);
    }, 10000);
    req.on('close', () => {
        clearInterval(interval);
        unsubscribe === null || unsubscribe === void 0 ? void 0 : unsubscribe();
        res.end();
    });
});
//# sourceMappingURL=order.js.map