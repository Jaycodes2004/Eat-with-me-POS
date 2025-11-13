import { Request, Response } from "express";

// Multi-purpose stats for dashboard/reports
export async function getFullReport(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const totalCustomers = await prisma.customer.count();
  const totalOrders = await prisma.order.count();
  const revenue = await prisma.order.aggregate({ _sum: { totalAmount: true } });
  const topMenuItems = await prisma.menuItem.findMany({
    orderBy: { rating: "desc" }, take: 5
  });
  const lowStock = await prisma.inventoryItem.findMany({
    where: { currentStock: { lte: 2 } }, take: 5 // Example threshold
  });
  res.json({
    totalCustomers,
    totalOrders,
    totalRevenue: revenue._sum.totalAmount || 0,
    topMenuItems,
    lowStock
  });
}

// Example: Sales Report
export async function getSalesReport(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  try {
    // Your report generation logic here...
    const orders = await prisma.order.findMany({
        where: { status: 'Completed' },
        include: { items: true }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate sales report.' });
  }
}

export async function getSalesSummaryReport(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const [orderMetrics, topItems] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.orderItem.groupBy({
        by: ['name'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const typedTopItems = topItems as Array<{ name: string; _sum: { quantity: number | null } }>;

    res.json({
      totalSales: Number(orderMetrics._sum.totalAmount ?? 0),
      totalOrders: orderMetrics._count.id ?? 0,
      topSellingItems: typedTopItems.map((item) => ({
        name: item.name,
        quantity: Number(item._sum.quantity ?? 0),
      })),
    });
  } catch (error) {
    console.error('Error generating sales summary report:', error);
    res.status(500).json({ message: 'Failed to generate sales summary report.' });
  }
}

// Example: Inventory Report
export async function getInventoryReport(req: Request, res: Response) {
    const prisma = (req as any).prisma;
    try {
        const items = await prisma.inventoryItem.findMany();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate inventory report.' });
    }
}

// Example: Customer Report
export async function getCustomerReport(req: Request, res: Response) {
    const prisma = (req as any).prisma;
    try {
        const customers = await prisma.customer.findMany();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate customer report.' });
    }
}
