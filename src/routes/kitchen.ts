import { Router } from "express";
import { getKitchenOrders, updateOrderStatus } from "../controllers/kitchen";
import { liveUpdates } from "../utils/liveUpdates";

const router = Router();

// GET /api/kitchen - Fetches all active kitchen orders
router.get("/", getKitchenOrders);

// PUT /api/kitchen/:id/status - Updates the status of an order (e.g., 'Preparing', 'Ready')
router.put("/:id/status", updateOrderStatus);

// GET /api/kitchen/stream - Server-Sent Events for live kitchen order updates
router.get("/stream", (req, res) => {
  const tenant = (req as any).tenant;
  const useRedis = (req as any).useRedis;
  const restaurantId = tenant?.restaurantId;

  if (!restaurantId) {
    return res.status(400).json({ error: "Missing restaurant context" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Subscribe to the same ORDER_EVENT used in controllers/order.ts
  const ORDER_EVENT = "orders:updated";

  const unsubscribe = liveUpdates.subscribe(
    restaurantId,
    ORDER_EVENT,
    (payload: any) => {
      // SSE format: data: <json>\n\n
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    },
    useRedis
  );

  // Clean up when client disconnects
  req.on("close", () => {
    unsubscribe?.();
    res.end();
  });
});

export { router as kitchenRoutes };
