import { Request, Response } from "express";

// Get dashboard metrics: revenue, orders, customers, inventory, etc.
export async function getDashboardMetrics(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const [
    revenue,
    totalOrders,
    activeTables,
    inventory,
    totalCustomers
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.count(),
    prisma.table.count({ where: { status: "occupied" } }),
    prisma.inventoryItem.findMany({}),
    prisma.customer.count()
  ]);
  res.json({
    revenue: revenue._sum.totalAmount || 0,
    totalOrders: totalOrders || 0,
    activeTables: activeTables || 0,
    inventoryCount: inventory.length || 0,
    totalCustomers: totalCustomers || 0
  });
}
// Get sales breakdown by category for dashboard charts
export async function getSalesByCategory(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  let sales = [];
  try {
    sales = await prisma.order.groupBy({
      by: ["category"],
      _sum: { totalAmount: true }
    });
  } catch {
    sales = [];
  }
  res.json(sales);
}
// Get top selling menu items for dashboard
export async function getTopSellingItems(req: Request, res: Response) {
  const prisma = (req as any).prisma;   
  let items = [];
  try {
    items = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10
    });
  } catch {
    items = [];
  }
  res.json(items);
}
// Get recent orders for dashboard
export async function getRecentOrders(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  let orders = [];
  try {
    orders = await prisma.order.findMany({
      orderBy: { orderTime: "desc" },
      take: 5
    });
  } catch {
    orders = [];
  }
  res.json(orders);
}
// Get combined dashboard data
export async function getDashboardData(req: Request, res: Response) {
  // FIX: Get the prisma client from the request object, not from dbManager
  const prisma = (req as any).prisma;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 1. Today's Sales
    const todaysSales = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: 'Completed',
      },
    });

    // 2. Today's Orders
    const todaysOrdersCount = await prisma.order.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // 3. Active Tables
    const activeTablesCount = await prisma.table.count({
      where: { status: 'Occupied' },
    });

    // 4. Pending Reservations for today
    const pendingReservationsCount = await prisma.reservation.count({
        where: {
            date: { gte: today, lt: tomorrow },
            status: 'Pending'
        }
    });

    // Example of fixing the implicit 'any' error if you were using reduce
    // const someData = [{ value: 10 }, { value: 20 }];
    // const total = someData.reduce((sum: number, item: { value: number }) => sum + item.value, 0);

    res.json({
      todaysSales: todaysSales._sum.totalAmount || 0,
      todaysOrders: todaysOrdersCount,
      activeTables: activeTablesCount,
      pendingReservations: pendingReservationsCount,
    });
  } catch (error) {
    console.error('[GET] Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to load dashboard data.' });
  }
}
