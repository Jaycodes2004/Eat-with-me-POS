"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllShifts = getAllShifts;
exports.createShift = createShift;
exports.getStaffShifts = getStaffShifts;
exports.updateShift = updateShift;
exports.deleteShift = deleteShift;
const mapShiftLogRecord = (shift) => {
    var _a, _b, _c, _d, _e, _f;
    const date = shift.date instanceof Date ? shift.date : new Date((_a = shift.date) !== null && _a !== void 0 ? _a : Date.now());
    const normalizeStatus = (value) => {
        const lowered = (value !== null && value !== void 0 ? value : '').toLowerCase();
        if (lowered === 'completed')
            return 'Completed';
        if (lowered === 'scheduled')
            return 'Scheduled';
        return 'Active';
    };
    const normalizeShiftType = (value) => {
        const formatted = (value !== null && value !== void 0 ? value : '').toLowerCase();
        if (formatted === 'evening')
            return 'Evening';
        if (formatted === 'night')
            return 'Night';
        return 'Morning';
    };
    return {
        id: shift.id,
        staffId: shift.staffId,
        startTime: shift.startTime,
        endTime: (_b = shift.endTime) !== null && _b !== void 0 ? _b : undefined,
        openingCash: Number((_c = shift.openingCash) !== null && _c !== void 0 ? _c : 0),
        closingCash: Number((_d = shift.closingCash) !== null && _d !== void 0 ? _d : 0),
        totalSales: Number((_e = shift.totalSales) !== null && _e !== void 0 ? _e : 0),
        tips: Number((_f = shift.tips) !== null && _f !== void 0 ? _f : 0),
        date: date.toISOString(),
        status: normalizeStatus(shift.status),
        shiftType: normalizeShiftType(shift.shiftType),
    };
};
const ensureShiftSupport = (prisma, res) => {
    if (!prisma) {
        res.status(500).json({ error: "Tenant database not available" });
        return false;
    }
    if (!prisma.shiftLog) {
        res.status(501).json({ error: "Shifts not enabled in schema." });
        return false;
    }
    return true;
};
async function getAllShifts(req, res) {
    const prisma = req.prisma;
    if (!ensureShiftSupport(prisma, res)) {
        return;
    }
    try {
        const shifts = await prisma.shiftLog.findMany({
            orderBy: { date: 'desc' },
        });
        res.json(shifts.map(mapShiftLogRecord));
    }
    catch (error) {
        console.error('Get all shifts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function createShift(req, res) {
    const prisma = req.prisma;
    if (!ensureShiftSupport(prisma, res)) {
        return;
    }
    try {
        const { staffId, startTime, endTime, shiftType, openingCash, closingCash, totalSales, tips, status, date, } = req.body;
        if (!staffId) {
            return res.status(400).json({ message: 'staffId is required.' });
        }
        const created = await prisma.shiftLog.create({
            data: {
                staffId,
                startTime,
                endTime,
                shiftType: shiftType !== null && shiftType !== void 0 ? shiftType : 'Morning',
                openingCash: Number(openingCash !== null && openingCash !== void 0 ? openingCash : 0),
                closingCash: closingCash != null ? Number(closingCash) : null,
                totalSales: totalSales != null ? Number(totalSales) : null,
                tips: tips != null ? Number(tips) : null,
                status: status ? String(status).toUpperCase() : 'ACTIVE',
                date: date ? new Date(date) : new Date(),
            },
        });
        res.status(201).json(mapShiftLogRecord(created));
    }
    catch (error) {
        console.error('Create shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getStaffShifts(req, res) {
    const prisma = req.prisma;
    if (!ensureShiftSupport(prisma, res)) {
        return;
    }
    try {
        const { staffId } = req.params;
        const shifts = await prisma.shiftLog.findMany({
            where: { staffId },
            orderBy: { date: 'desc' },
        });
        res.json(shifts.map(mapShiftLogRecord));
    }
    catch (error) {
        console.error('Get staff shifts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateShift(req, res) {
    const prisma = req.prisma;
    if (!ensureShiftSupport(prisma, res)) {
        return;
    }
    try {
        const { id } = req.params;
        const { staffId, startTime, endTime, shiftType, openingCash, closingCash, totalSales, tips, status, date, } = req.body;
        const data = {};
        if (staffId)
            data.staffId = staffId;
        if (startTime)
            data.startTime = startTime;
        if (typeof endTime !== 'undefined')
            data.endTime = endTime;
        if (shiftType)
            data.shiftType = shiftType;
        if (openingCash != null)
            data.openingCash = Number(openingCash);
        if (closingCash != null)
            data.closingCash = Number(closingCash);
        if (totalSales != null)
            data.totalSales = Number(totalSales);
        if (tips != null)
            data.tips = Number(tips);
        if (status)
            data.status = String(status).toUpperCase();
        if (date)
            data.date = new Date(date);
        const updated = await prisma.shiftLog.update({
            where: { id },
            data,
        });
        res.json(mapShiftLogRecord(updated));
    }
    catch (error) {
        console.error('Update shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteShift(req, res) {
    const prisma = req.prisma;
    if (!ensureShiftSupport(prisma, res)) {
        return;
    }
    try {
        const { id } = req.params;
        await prisma.shiftLog.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=shifts.js.map