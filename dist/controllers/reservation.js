"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReservations = getAllReservations;
exports.getReservationById = getReservationById;
exports.createReservation = createReservation;
exports.updateReservation = updateReservation;
exports.deleteReservation = deleteReservation;
exports.searchReservations = searchReservations;
exports.checkAvailability = checkAvailability;
const allowedReservationStatuses = new Set([
    'pending',
    'confirmed',
    'seated',
    'completed',
    'cancelled',
    'no-show',
    'auto-assigned',
]);
const allowedReservationSources = new Set(['phone', 'online', 'walk-in', 'app']);
const allowedReservationPriorities = new Set(['normal', 'high', 'vip']);
const normalizeOptionalString = (value) => {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};
const parseDateValue = (value) => {
    if (!value) {
        return null;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const buildCreateReservationData = (body) => {
    var _a, _b, _c;
    const errors = [];
    const data = {};
    const customerName = normalizeOptionalString(body === null || body === void 0 ? void 0 : body.customerName);
    if (!customerName) {
        errors.push('customerName');
    }
    else {
        data.customerName = customerName;
    }
    const customerPhone = normalizeOptionalString(body === null || body === void 0 ? void 0 : body.customerPhone);
    if (!customerPhone) {
        errors.push('customerPhone');
    }
    else {
        data.customerPhone = customerPhone;
    }
    const reservationDate = parseDateValue(body === null || body === void 0 ? void 0 : body.date);
    if (!reservationDate) {
        errors.push('date');
    }
    else {
        data.date = reservationDate;
    }
    const timeValue = normalizeOptionalString(body === null || body === void 0 ? void 0 : body.time);
    if (!timeValue) {
        errors.push('time');
    }
    else {
        data.time = timeValue;
    }
    const partySizeValue = Number(body === null || body === void 0 ? void 0 : body.partySize);
    if (!Number.isFinite(partySizeValue) || partySizeValue <= 0) {
        errors.push('partySize');
    }
    else {
        data.partySize = Math.trunc(partySizeValue);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'tableId')) {
        if (body.tableId === null) {
            data.tableId = null;
        }
        else {
            const tableId = normalizeOptionalString(body.tableId);
            if (tableId) {
                data.tableId = tableId;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'customerId')) {
        if (body.customerId === null) {
            data.customerId = null;
        }
        else {
            const customerId = normalizeOptionalString(body.customerId);
            if (customerId) {
                data.customerId = customerId;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'customerEmail')) {
        if (body.customerEmail === null) {
            data.customerEmail = null;
        }
        else if (typeof body.customerEmail === 'string') {
            const email = body.customerEmail.trim();
            if (email.length > 0) {
                data.customerEmail = email;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'specialRequests')) {
        if (body.specialRequests === null) {
            data.specialRequests = null;
        }
        else {
            const requests = normalizeOptionalString(body.specialRequests);
            if (requests) {
                data.specialRequests = requests;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'occasion')) {
        if (body.occasion === null) {
            data.occasion = null;
        }
        else {
            const occasion = normalizeOptionalString(body.occasion);
            if (occasion) {
                data.occasion = occasion;
            }
        }
    }
    const statusValue = (_a = normalizeOptionalString(body === null || body === void 0 ? void 0 : body.status)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    data.status = statusValue && allowedReservationStatuses.has(statusValue)
        ? statusValue
        : 'pending';
    const sourceValue = (_b = normalizeOptionalString(body === null || body === void 0 ? void 0 : body.source)) === null || _b === void 0 ? void 0 : _b.toLowerCase();
    data.source = sourceValue && allowedReservationSources.has(sourceValue)
        ? sourceValue
        : 'walk-in';
    const priorityValue = (_c = normalizeOptionalString(body === null || body === void 0 ? void 0 : body.priority)) === null || _c === void 0 ? void 0 : _c.toLowerCase();
    data.priority = priorityValue && allowedReservationPriorities.has(priorityValue)
        ? priorityValue
        : 'normal';
    Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
            delete data[key];
        }
    });
    return { data, errors };
};
const buildUpdateReservationData = (body) => {
    var _a, _b, _c;
    const errors = [];
    const data = {};
    if (Object.prototype.hasOwnProperty.call(body, 'customerName')) {
        if (body.customerName === null) {
            errors.push('customerName');
        }
        else {
            const customerName = normalizeOptionalString(body.customerName);
            if (!customerName) {
                errors.push('customerName');
            }
            else {
                data.customerName = customerName;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'customerPhone')) {
        if (body.customerPhone === null) {
            errors.push('customerPhone');
        }
        else {
            const customerPhone = normalizeOptionalString(body.customerPhone);
            if (!customerPhone) {
                errors.push('customerPhone');
            }
            else {
                data.customerPhone = customerPhone;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'date')) {
        if (body.date === null) {
            errors.push('date');
        }
        else {
            const reservationDate = parseDateValue(body.date);
            if (!reservationDate) {
                errors.push('date');
            }
            else {
                data.date = reservationDate;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'time')) {
        if (body.time === null) {
            errors.push('time');
        }
        else {
            const timeValue = normalizeOptionalString(body.time);
            if (!timeValue) {
                errors.push('time');
            }
            else {
                data.time = timeValue;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'partySize')) {
        if (body.partySize === null || body.partySize === undefined) {
            errors.push('partySize');
        }
        else {
            const partySizeValue = Number(body.partySize);
            if (!Number.isFinite(partySizeValue) || partySizeValue <= 0) {
                errors.push('partySize');
            }
            else {
                data.partySize = Math.trunc(partySizeValue);
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
        if (body.status === null) {
            errors.push('status');
        }
        else {
            const statusValue = (_a = normalizeOptionalString(body.status)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            if (!statusValue || !allowedReservationStatuses.has(statusValue)) {
                errors.push('status');
            }
            else {
                data.status = statusValue;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'source')) {
        if (body.source === null) {
            errors.push('source');
        }
        else {
            const sourceValue = (_b = normalizeOptionalString(body.source)) === null || _b === void 0 ? void 0 : _b.toLowerCase();
            if (!sourceValue || !allowedReservationSources.has(sourceValue)) {
                errors.push('source');
            }
            else {
                data.source = sourceValue;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'priority')) {
        if (body.priority === null) {
            errors.push('priority');
        }
        else {
            const priorityValue = (_c = normalizeOptionalString(body.priority)) === null || _c === void 0 ? void 0 : _c.toLowerCase();
            if (!priorityValue || !allowedReservationPriorities.has(priorityValue)) {
                errors.push('priority');
            }
            else {
                data.priority = priorityValue;
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'tableId')) {
        if (body.tableId === null) {
            data.tableId = null;
        }
        else if (typeof body.tableId === 'string') {
            const tableId = body.tableId.trim();
            data.tableId = tableId.length > 0 ? tableId : null;
        }
        else {
            errors.push('tableId');
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'customerId')) {
        if (body.customerId === null) {
            data.customerId = null;
        }
        else if (typeof body.customerId === 'string') {
            const customerId = body.customerId.trim();
            data.customerId = customerId.length > 0 ? customerId : null;
        }
        else {
            errors.push('customerId');
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'customerEmail')) {
        if (body.customerEmail === null) {
            data.customerEmail = null;
        }
        else if (typeof body.customerEmail === 'string') {
            const email = body.customerEmail.trim();
            data.customerEmail = email.length > 0 ? email : null;
        }
        else {
            errors.push('customerEmail');
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'specialRequests')) {
        if (body.specialRequests === null) {
            data.specialRequests = null;
        }
        else if (typeof body.specialRequests === 'string') {
            const requests = body.specialRequests.trim();
            data.specialRequests = requests.length > 0 ? requests : null;
        }
        else {
            errors.push('specialRequests');
        }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'occasion')) {
        if (body.occasion === null) {
            data.occasion = null;
        }
        else if (typeof body.occasion === 'string') {
            const occasion = body.occasion.trim();
            data.occasion = occasion.length > 0 ? occasion : null;
        }
        else {
            errors.push('occasion');
        }
    }
    Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
            delete data[key];
        }
    });
    return { data, errors };
};
const getTenantAndUser = (req) => {
    var _a, _b, _c;
    return ({
        tenantId: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a.restaurantId,
        userId: (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : req.userId,
    });
};
// All reservations
async function getAllReservations(req, res) {
    const prisma = req.prisma;
    const { tenantId, userId } = getTenantAndUser(req);
    if (!prisma) {
        console.error('[Reservations] Missing tenant prisma client', { tenantId, userId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        console.info('[Reservations] List request received', { tenantId, userId });
        const reservations = await prisma.reservation.findMany();
        console.info('[Reservations] List success', { tenantId, count: reservations.length });
        res.json(reservations);
    }
    catch (error) {
        console.error('[Reservations] List failed', {
            tenantId,
            userId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ message: 'Failed to get reservations.' });
    }
}
// By ID
async function getReservationById(req, res) {
    const prisma = req.prisma;
    const { tenantId, userId } = getTenantAndUser(req);
    if (!prisma) {
        console.error('[Reservations] Missing tenant prisma client', { tenantId, userId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { id } = req.params;
        console.info('[Reservations] Fetch by id request received', { tenantId, userId, id });
        const reservation = await prisma.reservation.findUnique({ where: { id } });
        if (!reservation) {
            console.warn('[Reservations] Fetch by id not found', { tenantId, userId, id });
            return res.status(404).json({ error: 'Not found' });
        }
        console.info('[Reservations] Fetch by id success', { tenantId, userId, id: reservation.id });
        res.json(reservation);
    }
    catch (error) {
        console.error('[Reservations] Fetch by id failed', {
            tenantId,
            userId,
            id: req.params.id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Create
async function createReservation(req, res) {
    var _a;
    const prisma = req.prisma;
    const { tenantId, userId } = getTenantAndUser(req);
    if (!prisma) {
        console.error('[Reservations] Missing tenant prisma client', { tenantId, userId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { data, errors } = buildCreateReservationData((_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (errors.length > 0) {
            console.warn('[Reservations] Create validation failed', { tenantId, userId, missingFields: errors });
            return res.status(400).json({ error: 'Invalid reservation payload', missingFields: errors });
        }
        console.info('[Reservations] Create request received', {
            tenantId,
            userId,
            status: data.status,
            source: data.source,
            partySize: data.partySize,
        });
        const reservation = await prisma.reservation.create({ data });
        console.info('[Reservations] Create success', { tenantId, userId, id: reservation.id });
        res.status(201).json(reservation);
    }
    catch (error) {
        console.error('[Reservations] Create failed', {
            tenantId,
            userId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ message: 'Failed to create reservation.' });
    }
}
// Update
async function updateReservation(req, res) {
    var _a;
    const prisma = req.prisma;
    const { tenantId, userId } = getTenantAndUser(req);
    if (!prisma) {
        console.error('[Reservations] Missing tenant prisma client', { tenantId, userId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        const { data, errors } = buildUpdateReservationData((_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (errors.length > 0) {
            console.warn('[Reservations] Update validation failed', { tenantId, userId, id, invalidFields: errors });
            return res.status(400).json({ error: 'Invalid reservation update payload', invalidFields: errors });
        }
        if (Object.keys(data).length === 0) {
            console.warn('[Reservations] Update with no valid fields', { tenantId, userId, id });
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }
        console.info('[Reservations] Update request received', {
            tenantId,
            userId,
            id,
            fields: Object.keys(data),
        });
        const reservation = await prisma.reservation.update({
            where: { id },
            data,
        });
        console.info('[Reservations] Update success', { tenantId, userId, id: reservation.id });
        res.json(reservation);
    }
    catch (error) {
        console.error('[Reservations] Update failed', {
            tenantId,
            userId,
            id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Failed to update reservation' });
    }
}
// Delete
async function deleteReservation(req, res) {
    const prisma = req.prisma;
    const { tenantId, userId } = getTenantAndUser(req);
    if (!prisma) {
        console.error('[Reservations] Missing tenant prisma client', { tenantId, userId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    const { id } = req.params;
    try {
        console.info('[Reservations] Delete request received', { tenantId, userId, id });
        await prisma.reservation.delete({ where: { id } });
        console.info('[Reservations] Delete success', { tenantId, userId, id });
        res.status(204).send();
    }
    catch (error) {
        console.error('[Reservations] Delete failed', {
            tenantId,
            userId,
            id,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
}
// Search/filter by date/status/table
async function searchReservations(req, res) {
    const prisma = req.prisma;
    const { tenantId, userId } = getTenantAndUser(req);
    if (!prisma) {
        console.error('[Reservations] Missing tenant prisma client', { tenantId, userId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { date, status, tableId } = req.query;
        const filters = [];
        if (date) {
            const parsedDate = parseDateValue(date);
            if (parsedDate) {
                filters.push({ date: parsedDate });
            }
        }
        if (typeof status === 'string' && status.trim()) {
            const normalizedStatus = status.trim().toLowerCase();
            if (allowedReservationStatuses.has(normalizedStatus)) {
                filters.push({ status: normalizedStatus });
            }
        }
        if (typeof tableId === 'string' && tableId.trim()) {
            filters.push({ tableId: tableId.trim() });
        }
        const whereClause = filters.length > 0 ? { AND: filters } : {};
        console.info('[Reservations] Search request received', {
            tenantId,
            userId,
            query: req.query,
        });
        const reservations = await prisma.reservation.findMany({ where: whereClause });
        console.info('[Reservations] Search success', {
            tenantId,
            userId,
            query: req.query,
            count: reservations.length,
        });
        res.json(reservations);
    }
    catch (error) {
        console.error('[Reservations] Search failed', {
            tenantId,
            userId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Availability check for a date/time/party size
async function checkAvailability(req, res) {
    const prisma = req.prisma;
    const { tenantId, userId } = getTenantAndUser(req);
    if (!prisma) {
        console.error('[Reservations] Missing tenant prisma client', { tenantId, userId });
        return res.status(500).json({ error: 'Tenant database not available' });
    }
    try {
        const { date, time, partySize } = req.query;
        const parsedDate = parseDateValue(date);
        const normalizedTime = normalizeOptionalString(time);
        const partySizeNumber = Number(partySize);
        const roundedPartySize = Math.trunc(partySizeNumber);
        if (!parsedDate || !normalizedTime || !Number.isFinite(partySizeNumber) || roundedPartySize <= 0) {
            console.warn('[Reservations] Availability validation failed', {
                tenantId,
                userId,
                date,
                time,
                partySize,
            });
            return res.status(400).json({ error: 'Invalid availability query parameters' });
        }
        console.info('[Reservations] Availability request received', {
            tenantId,
            userId,
            date: parsedDate.toISOString(),
            time: normalizedTime,
            partySize: roundedPartySize,
        });
        const reservations = await prisma.reservation.findMany({
            where: {
                date: parsedDate,
                time: normalizedTime,
            },
        });
        const reservedTables = reservations
            .map((r) => r.tableId)
            .filter((tableId) => Boolean(tableId));
        const tableWhere = {
            capacity: { gte: roundedPartySize },
        };
        if (reservedTables.length > 0) {
            tableWhere.id = { notIn: reservedTables };
        }
        const tables = await prisma.table.findMany({ where: tableWhere });
        console.info('[Reservations] Availability success', {
            tenantId,
            userId,
            availableCount: tables.length,
        });
        res.json(tables);
    }
    catch (error) {
        console.error('[Reservations] Availability check failed', {
            tenantId,
            userId,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=reservation.js.map