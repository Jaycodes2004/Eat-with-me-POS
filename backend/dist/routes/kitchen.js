"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kitchenRoutes = void 0;
const express_1 = require("express");
const kitchen_1 = require("../controllers/kitchen");
const router = (0, express_1.Router)();
exports.kitchenRoutes = router;
// GET /api/kitchen - Fetches all active kitchen orders
router.get("/", kitchen_1.getKitchenOrders);
// PUT /api/kitchen/:id/status - Updates the status of an order (e.g., 'Preparing', 'Ready')
router.put("/:id/status", kitchen_1.updateOrderStatus);
//# sourceMappingURL=kitchen.js.map