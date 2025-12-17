"use strict";
/** @format */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = getAllOrders;
exports.createOrder = createOrder;
exports.getOrderById = getOrderById;
exports.updateOrder = updateOrder;
exports.deleteOrder = deleteOrder;
exports.searchOrders = searchOrders;
exports.getOrderStats = getOrderStats;
const liveUpdates_1 = require("../utils/liveUpdates");
const ORDER_EVENT = 'orders:updated';
const toUpper = (value, fallback) => {
    if (!value)
        return fallback;
    return String(value).toUpperCase();
};
const toLower = (value, fallback) => {
    if (!value)
        return fallback;
    return String(value).toLowerCase();
};
const mapOrderItem = (item) => ({
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    price: item.price,
    notes: item.notes,
    modifiers: item.modifiers || [],
});
const mapOrderRecord = (order) => {
    var _a, _b, _c, _d;
    return ({
        id: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        tableNumber: ((_a = order.table) === null || _a === void 0 ? void 0 : _a.number) || null,
        orderSource: toLower(order.orderSource, 'pos'),
        status: toLower(order.status, 'new'),
        priority: toLower(order.priority, 'normal'),
        deliveryType: toLower(order.deliveryType, 'dine_in'),
        subtotal: Number(order.subtotal) || 0,
        taxAmount: Number(order.taxAmount) || 0,
        discount: Number(order.discount) || 0,
        totalAmount: Number(order.totalAmount) || 0,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentBreakdown: order.paymentBreakdown || {},
        taxes: order.taxes || [],
        tipAmount: Number(order.tipAmount) || 0,
        waiterId: order.waiterId,
        waiterName: ((_b = order.waiter) === null || _b === void 0 ? void 0 : _b.name) || null,
        customerId: order.customerId,
        customerName: ((_c = order.customer) === null || _c === void 0 ? void 0 : _c.name) || null,
        customerPhone: ((_d = order.customer) === null || _d === void 0 ? void 0 : _d.phone) || null,
        orderTime: order.orderTime,
        estimatedTime: order.estimatedTime,
        actualCookingTime: order.actualCookingTime,
        completedAt: order.completedAt,
        deliveryAddress: order.deliveryAddress,
        specialInstructions: order.specialInstructions,
        feedback: order.feedback,
        rating: order.rating,
        metadata: order.metadata || {},
        items: Array.isArray(order.items) ? order.items.map(mapOrderItem) : [],
    });
};
const generateOrderNumber = () => `ORD-${Date.now().toString(36).toUpperCase()}`;
async function getAllOrders(req, res) {
    const prisma = req.prisma;
    try {
        const orders = await prisma.order.findMany({
            include: {
                customer: true,
                table: true,
                waiter: true,
                items: true,
            },
            orderBy: { orderTime: 'desc' },
        });
        res.json(orders.map(mapOrderRecord));
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}
async function createOrder(req, res) {
    var _a, _b, _c, _d, _e;
    console.info('➡️ createOrder called', {
        body: req.body,
        tenant: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.id,
    });
    const prisma = req.prisma;
    try {
        const tenant = req.tenant;
        const useRedis = req.useRedis;
        const _f = req.body, { items, customerId, tableId, waiterId, orderTime } = _f, orderData = __rest(_f, ["items", "customerId", "tableId", "waiterId", "orderTime"]);
        if (!items || items.length === 0) {
            return res
                .status(400)
                .json({ error: 'Order must contain at least one item.' });
        }
        const normalizedItems = items.map((item) => ({
            menuItemId: item.menuItemId || null,
            name: item.name,
            category: item.category || null,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            notes: item.notes,
            modifiers: item.modifiers || [],
        }));
        const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalAmount = (_b = orderData.totalAmount) !== null && _b !== void 0 ? _b : subtotal;
        const taxAmount = (_c = orderData.taxAmount) !== null && _c !== void 0 ? _c : 0;
        const discount = (_d = orderData.discount) !== null && _d !== void 0 ? _d : 0;
        const tipAmount = (_e = orderData.tipAmount) !== null && _e !== void 0 ? _e : 0;
        const newOrder = await prisma.order.create({
            data: {
                orderNumber: orderData.orderNumber || generateOrderNumber(),
                orderSource: orderData.orderSource || 'POS',
                status: toUpper(orderData.status, 'NEW'),
                priority: toUpper(orderData.priority, 'NORMAL'),
                deliveryType: toUpper(orderData.deliveryType, 'DINE_IN'),
                subtotal,
                taxAmount,
                discount,
                totalAmount,
                paymentMethod: orderData.paymentMethod || 'cash',
                paymentStatus: orderData.paymentStatus || 'paid',
                paymentBreakdown: orderData.paymentBreakdown || {},
                taxes: orderData.taxes || [],
                tipAmount,
                waiter: waiterId ? { connect: { id: waiterId } } : undefined,
                customer: customerId ? { connect: { id: customerId } } : undefined,
                table: tableId ? { connect: { id: tableId } } : undefined,
                specialInstructions: orderData.specialInstructions,
                deliveryAddress: orderData.deliveryAddress,
                orderTime: orderTime ? new Date(orderTime) : undefined,
                estimatedTime: orderData.estimatedTime,
                metadata: orderData.metadata || {},
                items: {
                    create: normalizedItems,
                },
            },
            include: {
                customer: true,
                table: true,
                waiter: true,
                items: true,
            },
        });
        // Update table status if applicable
        if (tableId) {
            await prisma.table.update({
                where: { id: tableId },
                data: {
                    status: 'OCCUPIED',
                    guests: orderData.guests ||
                        normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
                    currentOrderId: newOrder.id,
                    lastOrderAt: new Date(),
                },
            });
        }
        // Update customer statistics
        if (customerId) {
            await prisma.customer.update({
                where: { id: customerId },
                data: {
                    totalSpent: { increment: totalAmount },
                    totalOrders: { increment: 1 },
                    visitCount: { increment: 1 },
                    lastVisit: new Date(),
                },
            });
        }
        await liveUpdates_1.liveUpdates.publish(tenant.restaurantId, ORDER_EVENT, { type: 'created', order: mapOrderRecord(newOrder) }, useRedis);
        res.status(201).json(mapOrderRecord(newOrder));
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
}
async function getOrderById(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: { customer: true, table: true, waiter: true, items: true },
        });
        if (order) {
            res.json(mapOrderRecord(order));
        }
        else {
            res.status(404).json({ error: 'Order not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
}
async function updateOrder(req, res) {
    var _a;
    console.info('➡️ updateOrder called', {
        params: req.params,
        body: req.body,
        tenant: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.id,
    });
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        const tenant = req.tenant;
        const useRedis = req.useRedis;
        const _b = req.body, { status, tableId, items, waiterId, customerId } = _b, updateData = __rest(_b, ["status", "tableId", "items", "waiterId", "customerId"]);
        const data = Object.assign({}, updateData);
        if (status) {
            data.status = toUpper(status, 'NEW');
            if (toUpper(status, '') === 'COMPLETED') {
                data.completedAt = new Date();
            }
        }
        if (tableId !== undefined) {
            data.table = tableId
                ? { connect: { id: tableId } }
                : { disconnect: true };
        }
        if (waiterId !== undefined) {
            data.waiter = waiterId
                ? { connect: { id: waiterId } }
                : { disconnect: true };
        }
        if (customerId !== undefined) {
            data.customer = customerId
                ? { connect: { id: customerId } }
                : { disconnect: true };
        }
        if (items && Array.isArray(items)) {
            const normalizedItems = items.map((item) => ({
                id: item.id,
                menuItemId: item.menuItemId || null,
                name: item.name,
                category: item.category || null,
                quantity: Number(item.quantity) || 1,
                price: Number(item.price) || 0,
                notes: item.notes,
                modifiers: item.modifiers || [],
            }));
            data.items = {
                deleteMany: { orderId: id },
                create: normalizedItems,
            };
        }
        const updatedOrder = await prisma.order.update({
            where: { id },
            data,
            include: { customer: true, table: true, waiter: true, items: true },
        });
        // Update table status based on order state
        if (updatedOrder.tableId) {
            const tableStatus = updatedOrder.status === 'COMPLETED' ? 'FREE' : 'OCCUPIED';
            await prisma.table.update({
                where: { id: updatedOrder.tableId },
                data: {
                    status: tableStatus,
                    currentOrderId: tableStatus === 'FREE' ? null : updatedOrder.id,
                    lastOrderAt: tableStatus === 'FREE' ? new Date() : undefined,
                },
            });
        }
        await liveUpdates_1.liveUpdates.publish(tenant.restaurantId, ORDER_EVENT, { type: 'updated', order: mapOrderRecord(updatedOrder) }, useRedis);
        res.json(mapOrderRecord(updatedOrder));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update order' });
    }
}
async function deleteOrder(req, res) {
    var _a;
    console.info('➡️ deleteOrder called', {
        params: req.params,
        tenant: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.id,
    });
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        const tenant = req.tenant;
        const useRedis = req.useRedis;
        const order = await prisma.order.delete({
            where: { id },
            include: { table: true },
        });
        if (order.tableId) {
            await prisma.table.update({
                where: { id: order.tableId },
                data: {
                    status: 'FREE',
                    currentOrderId: null,
                    guests: 0,
                    lastOrderAt: new Date(),
                },
            });
        }
        await liveUpdates_1.liveUpdates.publish(tenant.restaurantId, ORDER_EVENT, { type: 'deleted', orderId: id }, useRedis);
        res.json({ deleted: true });
    }
    catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
}
// FILTERS, STATUS, SOURCE, TODAY/DATE RANGE, REVENUE
async function searchOrders(req, res) {
    const prisma = req.prisma;
    const { q, tableId, status, source, from, to } = req.query;
    try {
        const orders = await prisma.order.findMany({
            where: {
                AND: [
                    q
                        ? {
                            OR: [
                                {
                                    orderNumber: { contains: q, mode: 'insensitive' },
                                },
                                {
                                    customer: {
                                        name: { contains: q, mode: 'insensitive' },
                                    },
                                },
                                {
                                    table: {
                                        name: { contains: q, mode: 'insensitive' },
                                    },
                                },
                            ],
                        }
                        : {},
                    tableId ? { tableId: tableId } : {},
                    status ? { status: toUpper(status, 'NEW') } : {},
                    source ? { orderSource: toUpper(source, 'POS') } : {},
                    from ? { orderTime: { gte: new Date(from) } } : {},
                    to ? { orderTime: { lte: new Date(to) } } : {},
                ],
            },
            include: { customer: true, table: true, waiter: true, items: true },
            orderBy: { orderTime: 'desc' },
        });
        res.json(orders.map(mapOrderRecord));
    }
    catch (error) {
        console.error('Error searching orders:', error);
        res.status(500).json({ error: 'Failed to search orders' });
    }
}
async function getOrderStats(req, res) {
    const prisma = req.prisma;
    const { from, to } = req.query;
    try {
        const where = {
            orderTime: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            },
        };
        const [aggregates, statusBreakdown] = await Promise.all([
            prisma.order.aggregate({
                _count: { _all: true },
                _sum: { totalAmount: true, tipAmount: true },
                _avg: { totalAmount: true },
                where,
            }),
            prisma.order.groupBy({
                by: ['status'],
                _count: { _all: true },
                where,
            }),
        ]);
        res.json({
            totalOrders: aggregates._count._all,
            totalRevenue: aggregates._sum.totalAmount || 0,
            averageOrderValue: aggregates._avg.totalAmount || 0,
            tipsCollected: aggregates._sum.tipAmount || 0,
            statusBreakdown: statusBreakdown.map((entry) => ({
                status: toLower(entry.status, 'new'),
                count: entry._count._all,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ error: 'Failed to fetch order stats' });
    }
}
//# sourceMappingURL=order.js.map