"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllLoyaltyLogs = getAllLoyaltyLogs;
exports.getCustomerLoyaltyLog = getCustomerLoyaltyLog;
exports.addLoyaltyLog = addLoyaltyLog;
exports.getLoyaltyRewards = getLoyaltyRewards;
exports.getLoyaltyRules = getLoyaltyRules;
exports.getLoyaltyMembers = getLoyaltyMembers;
exports.createLoyaltyReward = createLoyaltyReward;
exports.updateLoyaltyReward = updateLoyaltyReward;
exports.deleteLoyaltyReward = deleteLoyaltyReward;
exports.createLoyaltyRule = createLoyaltyRule;
exports.updateLoyaltyRule = updateLoyaltyRule;
exports.deleteLoyaltyRule = deleteLoyaltyRule;
const toISODate = (value) => {
    if (!value) {
        return null;
    }
    if (typeof value === 'string') {
        return value;
    }
    try {
        return value.toISOString();
    }
    catch (err) {
        console.warn('Failed to convert date to ISO string', err);
        return null;
    }
};
// Get all loyalty logs for all customers
async function getAllLoyaltyLogs(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const logs = await prisma.loyaltyLog.findMany();
        console.log('Fetched all loyalty logs');
        res.json(logs);
    }
    catch (err) {
        console.error('Get all loyalty logs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Loyalty for one customer
async function getCustomerLoyaltyLog(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { id } = req.params;
        const logs = await prisma.loyaltyLog.findMany({
            where: { customerId: id },
            orderBy: { date: "desc" }
        });
        const total = logs.reduce((sum, log) => sum + log.points, 0);
        console.log(`Fetched loyalty logs for customerId=${id}`);
        res.json({ logs, total });
    }
    catch (err) {
        console.error('Get customer loyalty log error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Add loyalty entry for a customer
async function addLoyaltyLog(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { id } = req.params;
        const { points, action } = req.body;
        const log = await prisma.loyaltyLog.create({
            data: { customerId: id, points, action }
        });
        await prisma.customer.update({
            where: { id },
            data: { loyaltyPoints: { increment: points } }
        });
        console.log(`Added loyalty log for customerId=${id}, points=${points}, action=${action}`);
        res.status(201).json(log);
    }
    catch (err) {
        console.error('Add loyalty log error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getLoyaltyRewards(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const rewards = await prisma.loyaltyReward.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(rewards);
    }
    catch (err) {
        console.error('Get loyalty rewards error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getLoyaltyRules(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const rules = await prisma.loyaltyRule.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(rules);
    }
    catch (err) {
        console.error('Get loyalty rules error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getLoyaltyMembers(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const customers = await prisma.customer.findMany({
            include: {
                orders: {
                    orderBy: { orderTime: 'desc' },
                    select: {
                        id: true,
                        orderTime: true,
                        totalAmount: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const members = customers.map((customer) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            const orders = (_a = customer.orders) !== null && _a !== void 0 ? _a : [];
            const orderCount = (_b = customer.totalOrders) !== null && _b !== void 0 ? _b : orders.length;
            const calculatedTotalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
            const totalSpent = Number((_d = (_c = customer.totalSpent) !== null && _c !== void 0 ? _c : calculatedTotalSpent) !== null && _d !== void 0 ? _d : 0);
            const totalVisits = (_e = customer.visitCount) !== null && _e !== void 0 ? _e : orderCount;
            const lastVisit = (_f = customer.lastVisit) !== null && _f !== void 0 ? _f : ((_h = (_g = orders[0]) === null || _g === void 0 ? void 0 : _g.orderTime) !== null && _h !== void 0 ? _h : null);
            return {
                id: customer.id,
                customerName: customer.name,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                points: (_j = customer.loyaltyPoints) !== null && _j !== void 0 ? _j : 0,
                loyaltyPoints: (_k = customer.loyaltyPoints) !== null && _k !== void 0 ? _k : 0,
                tier: (_l = customer.loyaltyTier) !== null && _l !== void 0 ? _l : 'bronze',
                loyaltyTier: (_m = customer.loyaltyTier) !== null && _m !== void 0 ? _m : 'bronze',
                totalSpent,
                totalVisits,
                visitCount: totalVisits,
                totalOrders: orderCount,
                averageOrderValue: totalVisits > 0 ? Number((totalSpent / totalVisits).toFixed(2)) : 0,
                joinDate: (_o = toISODate(customer.joinDate)) !== null && _o !== void 0 ? _o : undefined,
                lastVisit: (_p = toISODate(lastVisit)) !== null && _p !== void 0 ? _p : undefined,
                status: (_q = customer.status) !== null && _q !== void 0 ? _q : 'active',
                referralCode: customer.referralCode,
                referralCount: (_r = customer.referralCount) !== null && _r !== void 0 ? _r : 0,
                referredBy: customer.referredBy,
            };
        });
        res.json(members);
    }
    catch (err) {
        console.error('Get loyalty members error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function createLoyaltyReward(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { title, description, pointsRequired, type, value, validUntil, maxRedemptions, isActive, } = req.body;
        if (!title || !description || typeof pointsRequired === 'undefined' || !type || typeof value === 'undefined') {
            return res.status(400).json({ error: 'Missing required fields for loyalty reward.' });
        }
        const data = {
            title,
            description,
            pointsRequired: Number(pointsRequired),
            type,
            value: Number(value),
            isActive: typeof isActive === 'boolean' ? isActive : true,
        };
        if (validUntil) {
            data.validUntil = new Date(validUntil);
        }
        if (maxRedemptions !== undefined && maxRedemptions !== null && maxRedemptions !== '') {
            data.maxRedemptions = Number(maxRedemptions);
        }
        const reward = await prisma.loyaltyReward.create({ data });
        console.log('Created loyalty reward', { id: reward.id, title: reward.title });
        res.status(201).json(reward);
    }
    catch (err) {
        console.error('Create loyalty reward error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateLoyaltyReward(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        const { title, description, pointsRequired, type, value, validUntil, maxRedemptions, isActive, currentRedemptions, } = req.body;
        const data = {};
        if (title !== undefined)
            data.title = title;
        if (description !== undefined)
            data.description = description;
        if (pointsRequired !== undefined)
            data.pointsRequired = Number(pointsRequired);
        if (type !== undefined)
            data.type = type;
        if (value !== undefined)
            data.value = Number(value);
        if (isActive !== undefined)
            data.isActive = Boolean(isActive);
        if (currentRedemptions !== undefined)
            data.currentRedemptions = Number(currentRedemptions);
        if (validUntil === null) {
            data.validUntil = null;
        }
        else if (validUntil !== undefined) {
            data.validUntil = new Date(validUntil);
        }
        if (maxRedemptions === null) {
            data.maxRedemptions = null;
        }
        else if (maxRedemptions !== undefined) {
            data.maxRedemptions = Number(maxRedemptions);
        }
        const reward = await prisma.loyaltyReward.update({ where: { id }, data });
        console.log('Updated loyalty reward', { id: reward.id });
        res.json(reward);
    }
    catch (err) {
        console.error('Update loyalty reward error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteLoyaltyReward(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        await prisma.loyaltyReward.delete({ where: { id } });
        console.log('Deleted loyalty reward', { id });
        res.status(204).send();
    }
    catch (err) {
        console.error('Delete loyalty reward error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function createLoyaltyRule(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { name, type, condition, pointsPerRupee, bonusPoints, minOrderValue, isActive } = req.body;
        if (!name || !type || !condition) {
            return res.status(400).json({ error: 'Missing required fields for loyalty rule.' });
        }
        const data = {
            name,
            type,
            condition,
            isActive: typeof isActive === 'boolean' ? isActive : true,
        };
        if (pointsPerRupee !== undefined && pointsPerRupee !== null && pointsPerRupee !== '') {
            data.pointsPerRupee = Number(pointsPerRupee);
        }
        if (bonusPoints !== undefined && bonusPoints !== null && bonusPoints !== '') {
            data.bonusPoints = Number(bonusPoints);
        }
        if (minOrderValue !== undefined && minOrderValue !== null && minOrderValue !== '') {
            data.minOrderValue = Number(minOrderValue);
        }
        const rule = await prisma.loyaltyRule.create({ data });
        console.log('Created loyalty rule', { id: rule.id, name: rule.name });
        res.status(201).json(rule);
    }
    catch (err) {
        console.error('Create loyalty rule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateLoyaltyRule(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        const { name, type, condition, pointsPerRupee, bonusPoints, minOrderValue, isActive } = req.body;
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (type !== undefined)
            data.type = type;
        if (condition !== undefined)
            data.condition = condition;
        if (isActive !== undefined)
            data.isActive = Boolean(isActive);
        if (pointsPerRupee === null) {
            data.pointsPerRupee = null;
        }
        else if (pointsPerRupee !== undefined) {
            data.pointsPerRupee = Number(pointsPerRupee);
        }
        if (bonusPoints === null) {
            data.bonusPoints = null;
        }
        else if (bonusPoints !== undefined) {
            data.bonusPoints = Number(bonusPoints);
        }
        if (minOrderValue === null) {
            data.minOrderValue = null;
        }
        else if (minOrderValue !== undefined) {
            data.minOrderValue = Number(minOrderValue);
        }
        const rule = await prisma.loyaltyRule.update({ where: { id }, data });
        console.log('Updated loyalty rule', { id: rule.id });
        res.json(rule);
    }
    catch (err) {
        console.error('Update loyalty rule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteLoyaltyRule(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        await prisma.loyaltyRule.delete({ where: { id } });
        console.log('Deleted loyalty rule', { id });
        res.status(204).send();
    }
    catch (err) {
        console.error('Delete loyalty rule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=loyalty.js.map