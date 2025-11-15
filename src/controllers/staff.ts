import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

const DEFAULT_PERFORMANCE = {
  ordersHandled: 0,
  avgOrderTime: 0,
  customerRating: 0,
};

const DEFAULT_SALARY_DETAILS = (base = 0) => ({
  baseSalary: base,
  allowances: 0,
  deductions: 0,
  overtime: 0,
  totalSalary: base,
});

const mapSalaryPaymentResponse = (payment: any) => {
  const paymentDate = payment.paymentDate instanceof Date
    ? payment.paymentDate
    : new Date(payment.paymentDate ?? Date.now());

  return {
    id: payment.id,
    staffId: payment.staffId,
    amount: Number(payment.amount ?? 0),
    paymentDate: paymentDate.toISOString(),
    paymentType: payment.paymentType,
    description: payment.description ?? '',
    paidBy: payment.paidBy ?? '',
    status: payment.status ?? 'Completed',
    month: payment.month ?? paymentDate.toLocaleString('default', { month: 'long' }),
    year: payment.year ?? paymentDate.getFullYear(),
    staffName: payment.staff?.name,
    staffRole: payment.staff?.role?.name,
  };
};

const mapSalaryPayment = (payment: any) => {
  const response = mapSalaryPaymentResponse(payment);

  return {
    id: response.id,
    month: response.month,
    year: response.year,
    amount: response.amount,
    paymentDate: response.paymentDate,
    status: response.status,
    type: payment.paymentType ?? response.paymentType,
    description: response.description,
    paidBy: response.paidBy,
  };
};

const mapStaffRecord = (staff: any) => {
  const role = staff.role || {};
  const staffPermissions = Array.isArray(staff.permissions) ? staff.permissions : [];
  const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];
  const permissions = staffPermissions.length > 0 ? staffPermissions : rolePermissions;

  const staffModules = Array.isArray(staff.dashboardModules) ? staff.dashboardModules : [];
  const roleModules = Array.isArray(role.dashboardModules) ? role.dashboardModules : [];
  const dashboardModules = staffModules.length > 0 ? staffModules : roleModules;

  const performance = staff.performance || DEFAULT_PERFORMANCE;
  const salaryDetails = staff.salaryDetails || DEFAULT_SALARY_DETAILS(staff.salary || 0);
  const shiftLogs = Array.isArray(staff.shiftLogs) ? staff.shiftLogs : [];
  const activeShift = shiftLogs.find((shift: any) =>
    typeof shift.status === 'string' && shift.status.toLowerCase() === 'active'
  );

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    pin: staff.pin,
    isActive: staff.isActive,
    role: role.name || 'No Role',
    roleId: staff.roleId,
    permissions,
    dashboardModules,
    salary: staff.salary || 0,
    joinDate: staff.joinDate,
    avatar: staff.avatar,
    currentShift: activeShift ? activeShift.shiftType : null,
    address: staff.address || null,
    performance,
    salaryDetails,
    paymentHistory: Array.isArray(staff.salaryPayments)
      ? staff.salaryPayments.map(mapSalaryPayment)
      : [],
  };
};

export async function getAllStaff(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    const { role } = req.query;
    const staffRecords = await prisma.staff.findMany({
      where: role && role !== 'all' ? { role: { name: role as string } } : undefined,
      include: {
        role: true,
        salaryPayments: { orderBy: { paymentDate: 'desc' } },
        shiftLogs: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ staff: staffRecords.map(mapStaffRecord), totalStaff: staffRecords.length });
  } catch (err) {
    console.error('Get all staff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStaffById(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: { role: true, salaryPayments: true, shiftLogs: true },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json(mapStaffRecord(staff));
  } catch (err) {
    console.error('Get staff by ID error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createStaff(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  const tenantId = (req as any).tenant?.restaurantId;
  try {
    let {
      roleId,
      roleName,
      password,
      permissions = [],
      dashboardModules = [],
      joinDate,
      salary,
      ...staffData
    } = req.body;

    console.info('[Staff] Create request received', {
      tenantId,
      roleIdProvided: Boolean(roleId),
      roleName: roleName ?? null,
      permissionsCount: Array.isArray(permissions) ? permissions.length : 0,
      dashboardModulesCount: Array.isArray(dashboardModules) ? dashboardModules.length : 0,
      joinDateProvided: Boolean(joinDate),
    });

    if (!roleId && roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      console.info('[StaffRoles] Lookup by name', {
        tenantId,
        roleName,
        found: Boolean(role),
      });
      if (!role) {
        console.warn('[StaffRoles] Role missing during staff create', {
          tenantId,
          roleName,
        });
        return res.status(400).json({ message: `Role '${roleName}' does not exist.` });
      }
      roleId = role.id;
    }

    if (!roleId) {
      console.warn('[Staff] Create missing role identifier', { tenantId, roleName: roleName ?? null });
      return res.status(400).json({ message: 'roleId or roleName is required.' });
    }

    if (!password && staffData.pin) {
      password = staffData.pin;
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required for new staff members.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.staff.create({
      data: {
        ...staffData,
        salary: salary ?? 0,
        password: hashedPassword,
        permissions,
        dashboardModules,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        role: { connect: { id: roleId } },
      },
      include: { role: true, salaryPayments: true, shiftLogs: true },
    });

    console.info('[Staff] Create success', {
      tenantId,
      staffId: newStaff.id,
      roleId: newStaff.roleId,
    });

    res.status(201).json(mapStaffRecord(newStaff));
  } catch (err) {
    console.error('[Staff] Create error', { tenantId }, err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateStaff(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    const { id } = req.params;
    const {
      roleId,
      roleName,
      password,
      permissions,
      dashboardModules,
      joinDate,
      salary,
      ...updatePayload
    } = req.body;

    const data: any = {
      ...updatePayload,
    };

    if (typeof salary === 'number') {
      data.salary = salary;
    }

    if (joinDate) {
      data.joinDate = new Date(joinDate);
    }

    if (Array.isArray(permissions)) {
      data.permissions = permissions;
    }

    if (Array.isArray(dashboardModules)) {
      data.dashboardModules = dashboardModules;
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (roleId) {
      data.role = { connect: { id: roleId } };
    } else if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        return res.status(400).json({ message: `Role '${roleName}' does not exist.` });
      }
      data.role = { connect: { id: role.id } };
    }

    const staff = await prisma.staff.update({
      where: { id },
      data,
      include: { role: true, salaryPayments: true, shiftLogs: true },
    });

    res.json(mapStaffRecord(staff));
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteStaff(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    const { id } = req.params;
    await prisma.staff.delete({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function searchStaff(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    const { q, role } = req.query;
    const filters: any = {};

    if (q) {
      filters.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
        { phone: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'all') {
      filters.role = { name: role as string };
    }

    const result = await prisma.staff.findMany({
      where: filters,
      include: { role: true, salaryPayments: true, shiftLogs: true },
      orderBy: { name: 'asc' },
    });

    res.json(result.map(mapStaffRecord));
  } catch (err) {
    console.error('Search staff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStaffRoles(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  const tenantId = (req as any).tenant?.restaurantId;
  try {
    console.info('[StaffRoles] Fetch request received', { tenantId });
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    console.info('[StaffRoles] Fetch success', { tenantId, count: roles.length });
    res.json(roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions || [],
      dashboardModules: role.dashboardModules || [],
    })));
  } catch (err) {
    console.error('[StaffRoles] Fetch error', { tenantId }, err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStaffStats(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    const [totalStaff, activeStaff, onDuty] = await Promise.all([
      prisma.staff.count(),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.shift.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({ totalStaff, activeStaff, onDuty });
  } catch (err) {
    console.error('Get staff stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSalaryPayments(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const payments = await prisma.salaryPayment.findMany({
      include: {
        staff: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json(payments.map(mapSalaryPaymentResponse));
  } catch (err) {
    console.error('Get salary payments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createSalaryPayment(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const {
      staffId,
      amount,
      paymentDate,
      paymentType,
      description,
      paidBy,
      status = 'Completed',
      month,
      year,
    } = req.body;

    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required.' });
    }

    if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
      return res.status(400).json({ message: 'A valid amount is required.' });
    }

    if (!paymentType) {
      return res.status(400).json({ message: 'paymentType is required.' });
    }

    const resolvedDate = paymentDate ? new Date(paymentDate) : new Date();
    const created = await prisma.salaryPayment.create({
      data: {
        staffId,
        amount: Number(amount),
        paymentDate: resolvedDate,
        paymentType,
        description,
        paidBy,
        status,
        month: month ?? resolvedDate.toLocaleString('default', { month: 'long' }),
        year: year ?? resolvedDate.getFullYear(),
      },
      include: {
        staff: {
          include: { role: true },
        },
      },
    });

    res.status(201).json(mapSalaryPaymentResponse(created));
  } catch (err) {
    console.error('Create salary payment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
