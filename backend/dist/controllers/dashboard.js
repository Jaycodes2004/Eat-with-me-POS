"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = getDashboardMetrics;
exports.getSalesByCategory = getSalesByCategory;
exports.getTopSellingItems = getTopSellingItems;
exports.getRecentOrders = getRecentOrders;
exports.getDashboardData = getDashboardData;
// Get dashboard metrics: revenue, orders, customers, inventory, etc.
async function getDashboardMetrics(req, res) {
    const prisma = req.prisma;
    const [revenue, totalOrders, activeTables, inventory, totalCustomers] = await Promise.all([
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
async function getSalesByCategory(req, res) {
    const prisma = req.prisma;
    let sales = [];
    try {
        sales = await prisma.order.groupBy({
            by: ["category"],
            _sum: { totalAmount: true }
        });
    }
    catch (_a) {
        sales = [];
    }
    res.json(sales);
}
// Get top selling menu items for dashboard
async function getTopSellingItems(req, res) {
    const prisma = req.prisma;
    let items = [];
    try {
        items = await prisma.orderItem.groupBy({
            by: ["menuItemId"],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: "desc" } },
            take: 10
        });
    }
    catch (_a) {
        items = [];
    }
    res.json(items);
}
// Get recent orders for dashboard
async function getRecentOrders(req, res) {
    const prisma = req.prisma;
    let orders = [];
    try {
        orders = await prisma.order.findMany({
            orderBy: { orderTime: "desc" },
            take: 5
        });
    }
    catch (_a) {
        orders = [];
    }
    res.json(orders);
}
// Get combined dashboard data
async function getDashboardData(req, res) {
    // FIX: Get the prisma client from the request object, not from dbManager
    const prisma = req.prisma;
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
    }
    catch (error) {
        console.error('[GET] Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Failed to load dashboard data.' });
    }
}
//# sourceMappingURL=dashboard.js.map