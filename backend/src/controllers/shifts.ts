import { Request, Response } from "express";

const mapShiftLogRecord = (shift: any) => {
  const date = shift.date instanceof Date ? shift.date : new Date(shift.date ?? Date.now());
  const normalizeStatus = (value: string | null | undefined) => {
    const lowered = (value ?? '').toLowerCase();
    if (lowered === 'completed') return 'Completed';
    if (lowered === 'scheduled') return 'Scheduled';
    return 'Active';
  };

  const normalizeShiftType = (value: string | null | undefined) => {
    const formatted = (value ?? '').toLowerCase();
    if (formatted === 'evening') return 'Evening';
    if (formatted === 'night') return 'Night';
    return 'Morning';
  };

  return {
    id: shift.id,
    staffId: shift.staffId,
    startTime: shift.startTime,
    endTime: shift.endTime ?? undefined,
    openingCash: Number(shift.openingCash ?? 0),
    closingCash: Number(shift.closingCash ?? 0),
    totalSales: Number(shift.totalSales ?? 0),
    tips: Number(shift.tips ?? 0),
    date: date.toISOString(),
    status: normalizeStatus(shift.status),
    shiftType: normalizeShiftType(shift.shiftType),
  };
};

const ensureShiftSupport = (prisma: any, res: Response) => {
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

export async function getAllShifts(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!ensureShiftSupport(prisma, res)) {
    return;
  }

  try {
    const shifts = await prisma.shiftLog.findMany({
      orderBy: { date: 'desc' },
    });

    res.json(shifts.map(mapShiftLogRecord));
  } catch (error) {
    console.error('Get all shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createShift(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!ensureShiftSupport(prisma, res)) {
    return;
  }

  try {
    const {
      staffId,
      startTime,
      endTime,
      shiftType,
      openingCash,
      closingCash,
      totalSales,
      tips,
      status,
      date,
    } = req.body;

    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required.' });
    }

    const created = await prisma.shiftLog.create({
      data: {
        staffId,
        startTime,
        endTime,
        shiftType: shiftType ?? 'Morning',
        openingCash: Number(openingCash ?? 0),
        closingCash: closingCash != null ? Number(closingCash) : null,
        totalSales: totalSales != null ? Number(totalSales) : null,
        tips: tips != null ? Number(tips) : null,
        status: status ? String(status).toUpperCase() : 'ACTIVE',
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json(mapShiftLogRecord(created));
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStaffShifts(req: Request, res: Response) {
  const prisma = (req as any).prisma;
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
  } catch (error) {
    console.error('Get staff shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateShift(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!ensureShiftSupport(prisma, res)) {
    return;
  }

  try {
    const { id } = req.params;
    const {
      staffId,
      startTime,
      endTime,
      shiftType,
      openingCash,
      closingCash,
      totalSales,
      tips,
      status,
      date,
    } = req.body;

    const data: any = {};

    if (staffId) data.staffId = staffId;
    if (startTime) data.startTime = startTime;
    if (typeof endTime !== 'undefined') data.endTime = endTime;
    if (shiftType) data.shiftType = shiftType;
    if (openingCash != null) data.openingCash = Number(openingCash);
    if (closingCash != null) data.closingCash = Number(closingCash);
    if (totalSales != null) data.totalSales = Number(totalSales);
    if (tips != null) data.tips = Number(tips);
    if (status) data.status = String(status).toUpperCase();
    if (date) data.date = new Date(date);

    const updated = await prisma.shiftLog.update({
      where: { id },
      data,
    });

    res.json(mapShiftLogRecord(updated));
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteShift(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!ensureShiftSupport(prisma, res)) {
    return;
  }

  try {
    const { id } = req.params;
    await prisma.shiftLog.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
