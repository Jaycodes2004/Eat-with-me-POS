"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCustomers = getAllCustomers;
exports.createCustomer = createCustomer;
exports.getCustomerById = getCustomerById;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
exports.getExtendedCustomers = getExtendedCustomers;
const library_1 = require("@prisma/client/runtime/library");
function getPrismaOr500(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        res.status(500).json({ error: 'Tenant database not available.' });
        return null;
    }
    return prisma;
}
function pickCustomerCreate(body) {
    const { name, phone, email, notes, whatsappOptIn, birthDate, anniversary, preferences } = body !== null && body !== void 0 ? body : {};
    return {
        name: name === null || name === void 0 ? void 0 : name.trim(),
        phone: (phone === null || phone === void 0 ? void 0 : phone.trim()) || null,
        email: (email === null || email === void 0 ? void 0 : email.trim()) || null,
        notes: notes !== null && notes !== void 0 ? notes : null,
        whatsappOptIn: Boolean(whatsappOptIn),
        birthDate: birthDate !== null && birthDate !== void 0 ? birthDate : null,
        anniversary: anniversary !== null && anniversary !== void 0 ? anniversary : null,
        preferences: Array.isArray(preferences) ? preferences : [],
    };
}
function pickCustomerUpdate(body) {
    const allowed = {};
    const { name, phone, email, notes, whatsappOptIn, birthDate, anniversary, preferences, status } = body !== null && body !== void 0 ? body : {};
    if (name !== undefined)
        allowed.name = name === null || name === void 0 ? void 0 : name.trim();
    if (phone !== undefined)
        allowed.phone = (phone === null || phone === void 0 ? void 0 : phone.trim()) || null;
    if (email !== undefined)
        allowed.email = (email === null || email === void 0 ? void 0 : email.trim()) || null;
    if (notes !== undefined)
        allowed.notes = notes !== null && notes !== void 0 ? notes : null;
    if (whatsappOptIn !== undefined)
        allowed.whatsappOptIn = Boolean(whatsappOptIn);
    if (birthDate !== undefined)
        allowed.birthDate = birthDate !== null && birthDate !== void 0 ? birthDate : null;
    if (anniversary !== undefined)
        allowed.anniversary = anniversary !== null && anniversary !== void 0 ? anniversary : null;
    if (preferences !== undefined)
        allowed.preferences = Array.isArray(preferences) ? preferences : [];
    if (status !== undefined)
        allowed.status = status;
    return allowed;
}
async function getAllCustomers(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    try {
        console.info('[Customer] Fetch all request', {
            tenantId: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId,
        });
        const customers = await prisma.customer.findMany();
        res.json(customers);
    }
    catch (error) {
        console.error('[Customer] Fetch all error', {
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ message: 'Failed to get customers.' });
    }
}
async function createCustomer(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const data = pickCustomerCreate(req.body);
    if (!data.name) {
        return res.status(400).json({ message: 'Name is required.' });
    }
    try {
        console.info('[Customer] Create request', {
            tenantId: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId,
        });
        const customer = await prisma.customer.create({ data });
        res.status(201).json(customer);
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ message: 'Customer with this phone or email already exists.' });
        }
        console.error('[Customer] Create error', {
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ message: 'Failed to create customer.' });
    }
}
async function getCustomerById(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { id } = req.params;
    try {
        console.info('[Customer] Get by ID request', {
            id,
            tenantId: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId,
        });
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer)
            return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    }
    catch (error) {
        console.error('[Customer] Get by ID error', {
            id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
}
async function updateCustomer(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { id } = req.params;
    const data = pickCustomerUpdate(req.body);
    if (data.name !== undefined && !data.name) {
        return res.status(400).json({ message: 'Name cannot be empty.' });
    }
    try {
        console.info('[Customer] Update request', {
            id,
            fields: Object.keys(data),
            tenantId: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId,
        });
        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data,
        });
        res.json(updatedCustomer);
    }
    catch (error) {
        console.error('[Customer] Update error', {
            id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2025')
                return res.status(404).json({ error: 'Customer not found' });
            if (error.code === 'P2002')
                return res.status(409).json({ error: 'Customer with this phone or email already exists.' });
        }
        res.status(500).json({ error: 'Failed to update customer' });
    }
}
async function deleteCustomer(req, res) {
    var _a;
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    const { id } = req.params;
    try {
        console.info('[Customer] Delete request', {
            id,
            tenantId: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId,
        });
        await prisma.customer.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('[Customer] Delete error', {
            id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2025')
                return res.status(404).json({ error: 'Customer not found' });
            if (error.code === 'P2003')
                return res.status(409).json({ error: 'Customer has related records and cannot be deleted' });
        }
        res.status(500).json({ error: 'Failed to delete customer' });
    }
}
async function getExtendedCustomers(req, res) {
    const prisma = getPrismaOr500(req, res);
    if (!prisma)
        return;
    try {
        const customers = await prisma.customer.findMany({
            include: {
                orders: {
                    orderBy: { orderTime: 'desc' },
                    include: {
                        items: true,
                        table: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const extended = customers.map((customer) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const orders = (_a = customer.orders) !== null && _a !== void 0 ? _a : [];
            const totalOrders = (_b = customer.totalOrders) !== null && _b !== void 0 ? _b : orders.length;
            const totalSpent = Number((_c = customer.totalSpent) !== null && _c !== void 0 ? _c : orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0));
            const visitCount = (_d = customer.visitCount) !== null && _d !== void 0 ? _d : totalOrders;
            const averageOrderValue = totalOrders > 0 ? Number((totalSpent / totalOrders).toFixed(2)) : 0;
            const lastVisit = (_e = customer.lastVisit) !== null && _e !== void 0 ? _e : ((_g = (_f = orders[0]) === null || _f === void 0 ? void 0 : _f.orderTime) !== null && _g !== void 0 ? _g : null);
            const orderHistory = orders.map((order) => {
                var _a;
                return ({
                    id: order.id,
                    date: order.orderTime,
                    items: (order.items || []).map((item) => item.name),
                    amount: Number(order.totalAmount || 0),
                    table: ((_a = order.table) === null || _a === void 0 ? void 0 : _a.number) || undefined,
                });
            });
            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                notes: customer.notes,
                whatsappOptIn: Boolean(customer.whatsappOptIn),
                birthDate: customer.birthDate,
                anniversary: customer.anniversary,
                preferences: (_h = customer.preferences) !== null && _h !== void 0 ? _h : [],
                totalSpent,
                visitCount,
                averageOrderValue,
                lastVisit,
                loyaltyPoints: (_j = customer.loyaltyPoints) !== null && _j !== void 0 ? _j : 0,
                loyaltyTier: (_k = customer.loyaltyTier) !== null && _k !== void 0 ? _k : 'bronze',
                loyaltyStatus: (_l = customer.status) !== null && _l !== void 0 ? _l : 'active',
                referralCode: customer.referralCode,
                referredBy: customer.referredBy,
                referralCount: (_m = customer.referralCount) !== null && _m !== void 0 ? _m : 0,
                orderHistory,
                joinDate: customer.joinDate,
            };
        });
        res.json(extended);
    }
    catch (error) {
        console.error('[Customer] Extended fetch error', {
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ message: 'Failed to get extended customer data.' });
    }
}
//# sourceMappingURL=customer.js.map