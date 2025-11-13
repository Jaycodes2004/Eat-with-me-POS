import { Router } from "express";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  searchOrders,
  getOrderStats
} from "../controllers/order";
import { liveUpdates } from "../utils/liveUpdates";

const router = Router();

router.get("/", getAllOrders);
router.get("/search", searchOrders);
router.get("/stats", getOrderStats);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

// SSE endpoint for order updates
router.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const tenant = (req as any).tenant;
  const useRedis = (req as any).useRedis;

  if (tenant) {
    liveUpdates
      .publish(tenant.restaurantId, 'orders:heartbeat', { connected: true }, useRedis)
      .catch((err) => console.error('Failed to publish initial heartbeat', err));
  }

  const listener = (payload: any) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const unsubscribe = tenant ? liveUpdates.on(tenant.restaurantId, listener) : null;

  const interval = setInterval(() => {
    res.write(`data: ping\n\n`);
  }, 10000);

  req.on('close', () => {
    clearInterval(interval);
    unsubscribe?.();
    res.end();
  });
});

export { router as orderRoutes };
