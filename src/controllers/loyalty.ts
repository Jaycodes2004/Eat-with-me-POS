import { Request, Response } from "express";

const toISODate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return value.toISOString();
  } catch (err) {
    console.warn('Failed to convert date to ISO string', err);
    return null;
  }
};

// Get all loyalty logs for all customers
export async function getAllLoyaltyLogs(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    const logs = await prisma.loyaltyLog.findMany();
    console.log('Fetched all loyalty logs');
    res.json(logs);
  } catch (err) {
    console.error('Get all loyalty logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Loyalty for one customer
export async function getCustomerLoyaltyLog(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    const { id } = req.params;
    const logs = await prisma.loyaltyLog.findMany({
      where: { customerId: id },
      orderBy: { date: "desc" }
    });
    const total = logs.reduce((sum: number, log: { points: number }) => sum + log.points, 0);
    console.log(`Fetched loyalty logs for customerId=${id}`);
    res.json({ logs, total });
  } catch (err) {
    console.error('Get customer loyalty log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Add loyalty entry for a customer
export async function addLoyaltyLog(req: Request, res: Response) {
  const prisma = (req as any).prisma;
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
  } catch (err) {
    console.error('Add loyalty log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLoyaltyRewards(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const rewards = await prisma.loyaltyReward.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(rewards);
  } catch (err) {
    console.error('Get loyalty rewards error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLoyaltyRules(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const rules = await prisma.loyaltyRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(rules);
  } catch (err) {
    console.error('Get loyalty rules error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLoyaltyMembers(req: Request, res: Response) {
  const prisma = (req as any).prisma;
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

    const members = customers.map((customer: any) => {
      const orders = customer.orders ?? [];
      const orderCount = customer.totalOrders ?? orders.length;
      const calculatedTotalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0);
      const totalSpent = Number(customer.totalSpent ?? calculatedTotalSpent ?? 0);
      const totalVisits = customer.visitCount ?? orderCount;
      const lastVisit = customer.lastVisit ?? (orders[0]?.orderTime ?? null);

      return {
        id: customer.id,
        customerName: customer.name,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        points: customer.loyaltyPoints ?? 0,
        loyaltyPoints: customer.loyaltyPoints ?? 0,
        tier: customer.loyaltyTier ?? 'bronze',
        loyaltyTier: customer.loyaltyTier ?? 'bronze',
        totalSpent,
        totalVisits,
        visitCount: totalVisits,
        totalOrders: orderCount,
        averageOrderValue: totalVisits > 0 ? Number((totalSpent / totalVisits).toFixed(2)) : 0,
        joinDate: toISODate(customer.joinDate) ?? undefined,
        lastVisit: toISODate(lastVisit) ?? undefined,
        status: customer.status ?? 'active',
        referralCode: customer.referralCode,
        referralCount: customer.referralCount ?? 0,
        referredBy: customer.referredBy,
      };
    });

    res.json(members);
  } catch (err) {
    console.error('Get loyalty members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createLoyaltyReward(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const {
      title,
      description,
      pointsRequired,
      type,
      value,
      validUntil,
      maxRedemptions,
      isActive,
    } = req.body;

    if (!title || !description || typeof pointsRequired === 'undefined' || !type || typeof value === 'undefined') {
      return res.status(400).json({ error: 'Missing required fields for loyalty reward.' });
    }

    const data: any = {
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
  } catch (err) {
    console.error('Create loyalty reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateLoyaltyReward(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  const { id } = req.params;

  try {
    const {
      title,
      description,
      pointsRequired,
      type,
      value,
      validUntil,
      maxRedemptions,
      isActive,
      currentRedemptions,
    } = req.body;

    const data: any = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (pointsRequired !== undefined) data.pointsRequired = Number(pointsRequired);
    if (type !== undefined) data.type = type;
    if (value !== undefined) data.value = Number(value);
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (currentRedemptions !== undefined) data.currentRedemptions = Number(currentRedemptions);

    if (validUntil === null) {
      data.validUntil = null;
    } else if (validUntil !== undefined) {
      data.validUntil = new Date(validUntil);
    }

    if (maxRedemptions === null) {
      data.maxRedemptions = null;
    } else if (maxRedemptions !== undefined) {
      data.maxRedemptions = Number(maxRedemptions);
    }

    const reward = await prisma.loyaltyReward.update({ where: { id }, data });
    console.log('Updated loyalty reward', { id: reward.id });
    res.json(reward);
  } catch (err) {
    console.error('Update loyalty reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteLoyaltyReward(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  const { id } = req.params;

  try {
    await prisma.loyaltyReward.delete({ where: { id } });
    console.log('Deleted loyalty reward', { id });
    res.status(204).send();
  } catch (err) {
    console.error('Delete loyalty reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createLoyaltyRule(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const { name, type, condition, pointsPerRupee, bonusPoints, minOrderValue, isActive } = req.body;

    if (!name || !type || !condition) {
      return res.status(400).json({ error: 'Missing required fields for loyalty rule.' });
    }

    const data: any = {
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
  } catch (err) {
    console.error('Create loyalty rule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateLoyaltyRule(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  const { id } = req.params;

  try {
    const { name, type, condition, pointsPerRupee, bonusPoints, minOrderValue, isActive } = req.body;

    const data: any = {};

    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (condition !== undefined) data.condition = condition;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    if (pointsPerRupee === null) {
      data.pointsPerRupee = null;
    } else if (pointsPerRupee !== undefined) {
      data.pointsPerRupee = Number(pointsPerRupee);
    }

    if (bonusPoints === null) {
      data.bonusPoints = null;
    } else if (bonusPoints !== undefined) {
      data.bonusPoints = Number(bonusPoints);
    }

    if (minOrderValue === null) {
      data.minOrderValue = null;
    } else if (minOrderValue !== undefined) {
      data.minOrderValue = Number(minOrderValue);
    }

    const rule = await prisma.loyaltyRule.update({ where: { id }, data });
    console.log('Updated loyalty rule', { id: rule.id });
    res.json(rule);
  } catch (err) {
    console.error('Update loyalty rule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteLoyaltyRule(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  const { id } = req.params;

  try {
    await prisma.loyaltyRule.delete({ where: { id } });
    console.log('Deleted loyalty rule', { id });
    res.status(204).send();
  } catch (err) {
    console.error('Delete loyalty rule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
