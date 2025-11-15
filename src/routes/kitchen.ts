import { Router } from "express";
import { getKitchenOrders, updateOrderStatus } from "../controllers/kitchen";
const router = Router();

// GET /api/kitchen - Fetches all active kitchen orders
router.get("/", getKitchenOrders);

// PUT /api/kitchen/:id/status - Updates the status of an order (e.g., 'Preparing', 'Ready')
router.put("/:id/status", updateOrderStatus);

export { router as kitchenRoutes };
