import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

function getPrismaOr500(req: any, res: any) {
	const prisma = req.prisma;
	if (!prisma) {
		res.status(500).json({ error: 'Tenant database not available.' });
		return null;
	}
	return prisma;
}

function pickCustomerCreate(body: any) {
  const { name, phone, email, notes, whatsappOptIn, birthDate, anniversary, preferences } = body ?? {};
  return {
    name: name?.trim(),
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    notes: notes ?? null,
    whatsappOptIn: Boolean(whatsappOptIn),
    birthDate: birthDate ?? null,
    anniversary: anniversary ?? null,
    preferences: Array.isArray(preferences) ? preferences : [],
  };
}

function pickCustomerUpdate(body: any) {
  const allowed: Record<string, any> = {};
  const { name, phone, email, notes, whatsappOptIn, birthDate, anniversary, preferences, status } = body ?? {};
  if (name !== undefined) allowed.name = name?.trim();
  if (phone !== undefined) allowed.phone = phone?.trim() || null;
  if (email !== undefined) allowed.email = email?.trim() || null;
  if (notes !== undefined) allowed.notes = notes ?? null;
  if (whatsappOptIn !== undefined) allowed.whatsappOptIn = Boolean(whatsappOptIn);
  if (birthDate !== undefined) allowed.birthDate = birthDate ?? null;
  if (anniversary !== undefined) allowed.anniversary = anniversary ?? null;
  if (preferences !== undefined) allowed.preferences = Array.isArray(preferences) ? preferences : [];
  if (status !== undefined) allowed.status = status;
  return allowed;
}

export async function getAllCustomers(req: any, res: any) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;
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

export async function createCustomer(req: any, res: any) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;

  const data = pickCustomerCreate(req.body);
  if (!data.name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  try {
    console.info('[Customer] Create request', {
      tenantId: (req as any).tenant?.restaurantId,
    });
    const customer = await prisma.customer.create({ data });
    res.status(201).json(customer);
  } catch (error: any) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'Customer with this phone or email already exists.' });
    }
    console.error('[Customer] Create error', {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(500).json({ message: 'Failed to create customer.' });
  }
}

export async function getCustomerById(req: any, res: any) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;
  const { id } = req.params;
  try {
    console.info('[Customer] Get by ID request', {
      id,
      tenantId: (req as any).tenant?.restaurantId,
    });
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    console.error('[Customer] Get by ID error', {
      id,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
}

export async function updateCustomer(req: any, res: any) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;
  const { id } = req.params;
  const data = pickCustomerUpdate(req.body);

  if (data.name !== undefined && !data.name) {
    return res.status(400).json({ message: 'Name cannot be empty.' });
  }

  try {
    console.info('[Customer] Update request', {
      id,
      fields: Object.keys(data),
      tenantId: (req as any).tenant?.restaurantId,
    });
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data,
    });
    res.json(updatedCustomer);
  } catch (error: any) {
    console.error('[Customer] Update error', {
      id,
      message: error?.message,
      stack: error?.stack,
    });
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found' });
      if (error.code === 'P2002')
        return res.status(409).json({ error: 'Customer with this phone or email already exists.' });
    }
    res.status(500).json({ error: 'Failed to update customer' });
  }
}

export async function deleteCustomer(req: any, res: any) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;
  const { id } = req.params;
  try {
    console.info('[Customer] Delete request', {
      id,
      tenantId: (req as any).tenant?.restaurantId,
    });
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error('[Customer] Delete error', {
      id,
      message: error?.message,
      stack: error?.stack,
    });
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found' });
      if (error.code === 'P2003')
        return res.status(409).json({ error: 'Customer has related records and cannot be deleted' });
    }
    res.status(500).json({ error: 'Failed to delete customer' });
  }
}

export async function getExtendedCustomers(req: any, res: any) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;

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
      const totalSpent = Number(
        customer.totalSpent ?? orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0)
      );
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
