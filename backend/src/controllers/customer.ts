import { Request, Response } from 'express';

export async function getAllCustomers(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ message: 'Tenant database not available.' });
  }
  try {
    console.info('[Customer] Fetch all request', {
      tenantId: (req as any).tenant?.restaurantId,
    });
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (error) {
    console.error('[Customer] Fetch all error', {
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ message: 'Failed to get customers.' });
  }
}

export async function createCustomer(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ message: 'Tenant database not available.' });
  }
  try {
    console.info('[Customer] Create request', {
      body: req.body,
      tenantId: (req as any).tenant?.restaurantId,
    });
    const customer = await prisma.customer.create({ data: req.body });
    res.status(201).json(customer);
  } catch (error) {
    console.error('[Customer] Create error', {
      body: req.body,
      tenantId: (req as any).tenant?.restaurantId,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ message: 'Failed to create customer.' });
  }
}

export async function getCustomerById(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available.' });
  }
  const { id } = req.params;
  try {
    console.info('[Customer] Get by ID request', {
      id,
      tenantId: (req as any).tenant?.restaurantId,
    });
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    console.error('[Customer] Get by ID error', {
      id,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
}

export async function updateCustomer(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available.' });
  }
  const { id } = req.params;
  try {
    console.info('[Customer] Update request', {
      id,
      body: req.body,
      tenantId: (req as any).tenant?.restaurantId,
    });
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: req.body,
    });
    res.json(updatedCustomer);
  } catch (error) {
    console.error('[Customer] Update error', {
      id,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to update customer' });
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available.' });
  }
  const { id } = req.params;
  try {
    console.info('[Customer] Delete request', {
      id,
      tenantId: (req as any).tenant?.restaurantId,
    });
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('[Customer] Delete error', {
      id,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to delete customer' });
  }
}

export async function getExtendedCustomers(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available.' });
  }

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

    const extended = customers.map((customer: any) => {
      const orders = customer.orders ?? [];
      const totalOrders = customer.totalOrders ?? orders.length;
      const totalSpent = Number(customer.totalSpent ?? orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0));
      const visitCount = customer.visitCount ?? totalOrders;
      const averageOrderValue = totalOrders > 0 ? Number((totalSpent / totalOrders).toFixed(2)) : 0;
      const lastVisit = customer.lastVisit ?? (orders[0]?.orderTime ?? null);

      const orderHistory = orders.map((order: any) => ({
        id: order.id,
        date: order.orderTime,
        items: (order.items || []).map((item: any) => item.name),
        amount: Number(order.totalAmount || 0),
        table: order.table?.number || undefined,
      }));

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        whatsappOptIn: Boolean(customer.whatsappOptIn),
        birthDate: customer.birthDate,
        anniversary: customer.anniversary,
        preferences: customer.preferences ?? [],
        totalSpent,
        visitCount,
        averageOrderValue,
        lastVisit,
        loyaltyPoints: customer.loyaltyPoints ?? 0,
        loyaltyTier: customer.loyaltyTier ?? 'bronze',
        loyaltyStatus: customer.status ?? 'active',
        referralCode: customer.referralCode,
        referredBy: customer.referredBy,
        referralCount: customer.referralCount ?? 0,
        orderHistory,
        joinDate: customer.joinDate,
      };
    });

    res.json(extended);
  } catch (error) {
    console.error('[Customer] Extended fetch error', {
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ message: 'Failed to get extended customer data.' });
  }
}
