import { Request, Response } from "express";

// All orders for kitchen display (pending, preparing, ready, etc)
export async function getKitchenOrders(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["Pending", "Preparing"] },
      },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
      orderBy: { orderTime: "asc" },
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    res.status(500).json({ error: "Failed to fetch kitchen orders" });
  }
}

// Update status (mark as preparing, ready, etc)
export async function updateOrderStatus(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!["Pending", "Preparing", "Ready", "Served", "Cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status provided" });
    }
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.json(updatedOrder);
  } catch (error) {
    console.error(`Error updating order status for ${id}:`, error);
    res.status(500).json({ error: "Failed to update order status" });
  }
}

// Get order details by ID
export async function getKitchenOrderById(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const { orderId } = req.params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  res.json(order);
}

// Search orders by item name or table
export async function searchKitchenOrders(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const { query } = req.params;
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { items: { some: { name: { contains: query, mode: "insensitive" } } } },
        { table: { name: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: { items: true },
  });
  res.json(orders);
}

// Get stats - avg prep time, orders per status
export async function getKitchenStats(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const [avgPrepTime, ordersPerStatus] = await Promise.all([
    prisma.order.aggregate({
      _avg: { prepTime: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);
  res.json({ avgPrepTime, ordersPerStatus });
}