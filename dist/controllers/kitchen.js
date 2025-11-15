"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKitchenOrders = getKitchenOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.getKitchenOrderById = getKitchenOrderById;
exports.searchKitchenOrders = searchKitchenOrders;
exports.getKitchenStats = getKitchenStats;
// All orders for kitchen display (pending, preparing, ready, etc)
async function getKitchenOrders(req, res) {
    const prisma = req.prisma;
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
    }
    catch (error) {
        console.error("Error fetching kitchen orders:", error);
        res.status(500).json({ error: "Failed to fetch kitchen orders" });
    }
}
// Update status (mark as preparing, ready, etc)
async function updateOrderStatus(req, res) {
    const prisma = req.prisma;
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
    }
    catch (error) {
        console.error(`Error updating order status for ${id}:`, error);
        res.status(500).json({ error: "Failed to update order status" });
    }
}
// Get order details by ID
async function getKitchenOrderById(req, res) {
    const prisma = req.prisma;
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });
    res.json(order);
}
// Search orders by item name or table
async function searchKitchenOrders(req, res) {
    const prisma = req.prisma;
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
async function getKitchenStats(req, res) {
    const prisma = req.prisma;
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
//# sourceMappingURL=kitchen.js.map