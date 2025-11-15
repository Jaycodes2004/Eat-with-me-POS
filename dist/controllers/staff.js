"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStaff = getAllStaff;
exports.getStaffById = getStaffById;
exports.createStaff = createStaff;
exports.updateStaff = updateStaff;
exports.deleteStaff = deleteStaff;
exports.searchStaff = searchStaff;
exports.getStaffRoles = getStaffRoles;
exports.getStaffStats = getStaffStats;
exports.getSalaryPayments = getSalaryPayments;
exports.createSalaryPayment = createSalaryPayment;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
const mapSalaryPaymentResponse = (payment) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const paymentDate = payment.paymentDate instanceof Date
        ? payment.paymentDate
        : new Date((_a = payment.paymentDate) !== null && _a !== void 0 ? _a : Date.now());
    return {
        id: payment.id,
        staffId: payment.staffId,
        amount: Number((_b = payment.amount) !== null && _b !== void 0 ? _b : 0),
        paymentDate: paymentDate.toISOString(),
        paymentType: payment.paymentType,
        description: (_c = payment.description) !== null && _c !== void 0 ? _c : '',
        paidBy: (_d = payment.paidBy) !== null && _d !== void 0 ? _d : '',
        status: (_e = payment.status) !== null && _e !== void 0 ? _e : 'Completed',
        month: (_f = payment.month) !== null && _f !== void 0 ? _f : paymentDate.toLocaleString('default', { month: 'long' }),
        year: (_g = payment.year) !== null && _g !== void 0 ? _g : paymentDate.getFullYear(),
        staffName: (_h = payment.staff) === null || _h === void 0 ? void 0 : _h.name,
        staffRole: (_k = (_j = payment.staff) === null || _j === void 0 ? void 0 : _j.role) === null || _k === void 0 ? void 0 : _k.name,
    };
};
const mapSalaryPayment = (payment) => {
    var _a;
    const response = mapSalaryPaymentResponse(payment);
    return {
        id: response.id,
        month: response.month,
        year: response.year,
        amount: response.amount,
        paymentDate: response.paymentDate,
        status: response.status,
        type: (_a = payment.paymentType) !== null && _a !== void 0 ? _a : response.paymentType,
        description: response.description,
        paidBy: response.paidBy,
    };
};
const mapStaffRecord = (staff) => {
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
    const activeShift = shiftLogs.find((shift) => typeof shift.status === 'string' && shift.status.toLowerCase() === 'active');
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
async function getAllStaff(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { role } = req.query;
        const staffRecords = await prisma.staff.findMany({
            where: role && role !== 'all' ? { role: { name: role } } : undefined,
            include: {
                role: true,
                salaryPayments: { orderBy: { paymentDate: 'desc' } },
                shiftLogs: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json({ staff: staffRecords.map(mapStaffRecord), totalStaff: staffRecords.length });
    }
    catch (err) {
        console.error('Get all staff error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getStaffById(req, res) {
    const prisma = req.prisma;
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
    }
    catch (err) {
        console.error('Get staff by ID error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function createStaff(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        let _a = req.body, { roleId, roleName, password, permissions = [], dashboardModules = [], joinDate, salary } = _a, staffData = __rest(_a, ["roleId", "roleName", "password", "permissions", "dashboardModules", "joinDate", "salary"]);
        if (!roleId && roleName) {
            const role = await prisma.role.findUnique({ where: { name: roleName } });
            if (!role) {
                return res.status(400).json({ message: `Role '${roleName}' does not exist.` });
            }
            roleId = role.id;
        }
        if (!roleId) {
            return res.status(400).json({ message: 'roleId or roleName is required.' });
        }
        if (!password && staffData.pin) {
            password = staffData.pin;
        }
        if (!password) {
            return res.status(400).json({ message: 'Password is required for new staff members.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newStaff = await prisma.staff.create({
            data: Object.assign(Object.assign({}, staffData), { salary: salary !== null && salary !== void 0 ? salary : 0, password: hashedPassword, permissions,
                dashboardModules, joinDate: joinDate ? new Date(joinDate) : undefined, role: { connect: { id: roleId } } }),
            include: { role: true, salaryPayments: true, shiftLogs: true },
        });
        res.status(201).json(mapStaffRecord(newStaff));
    }
    catch (err) {
        console.error('Create staff error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateStaff(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { id } = req.params;
        const _a = req.body, { roleId, roleName, password, permissions, dashboardModules, joinDate, salary } = _a, updatePayload = __rest(_a, ["roleId", "roleName", "password", "permissions", "dashboardModules", "joinDate", "salary"]);
        const data = Object.assign({}, updatePayload);
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
            data.password = await bcryptjs_1.default.hash(password, 10);
        }
        if (roleId) {
            data.role = { connect: { id: roleId } };
        }
        else if (roleName) {
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
    }
    catch (err) {
        console.error('Update staff error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteStaff(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { id } = req.params;
        await prisma.staff.delete({ where: { id } });
        res.json({ deleted: true });
    }
    catch (err) {
        console.error('Delete staff error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function searchStaff(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { q, role } = req.query;
        const filters = {};
        if (q) {
            filters.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
            ];
        }
        if (role && role !== 'all') {
            filters.role = { name: role };
        }
        const result = await prisma.staff.findMany({
            where: filters,
            include: { role: true, salaryPayments: true, shiftLogs: true },
            orderBy: { name: 'asc' },
        });
        res.json(result.map(mapStaffRecord));
    }
    catch (err) {
        console.error('Search staff error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getStaffRoles(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const roles = await prisma.role.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(roles.map((role) => ({
            id: role.id,
            name: role.name,
            permissions: role.permissions || [],
            dashboardModules: role.dashboardModules || [],
        })));
    }
    catch (err) {
        console.error('Get staff roles error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getStaffStats(req, res) {
    const prisma = req.prisma;
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
    }
    catch (err) {
        console.error('Get staff stats error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getSalaryPayments(req, res) {
    const prisma = req.prisma;
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
    }
    catch (err) {
        console.error('Get salary payments error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function createSalaryPayment(req, res) {
    const prisma = req.prisma;
    if (!prisma) {
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { staffId, amount, paymentDate, paymentType, description, paidBy, status = 'Completed', month, year, } = req.body;
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
                month: month !== null && month !== void 0 ? month : resolvedDate.toLocaleString('default', { month: 'long' }),
                year: year !== null && year !== void 0 ? year : resolvedDate.getFullYear(),
            },
            include: {
                staff: {
                    include: { role: true },
                },
            },
        });
        res.status(201).json(mapSalaryPaymentResponse(created));
    }
    catch (err) {
        console.error('Create salary payment error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=staff.js.map