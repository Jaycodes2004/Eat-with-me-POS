"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReservations = getAllReservations;
exports.getReservationById = getReservationById;
exports.createReservation = createReservation;
exports.updateReservation = updateReservation;
exports.deleteReservation = deleteReservation;
exports.searchReservations = searchReservations;
exports.checkAvailability = checkAvailability;
// All reservations
async function getAllReservations(req, res) {
    const prisma = req.prisma;
    try {
        const reservations = await prisma.reservation.findMany();
        res.json(reservations);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to get reservations.' });
    }
}
// By ID
async function getReservationById(req, res) {
    try {
        const prisma = req.prisma;
        const { id } = req.params;
        const reservation = await prisma.reservation.findUnique({ where: { id } });
        if (!reservation) {
            console.log(`Reservation not found: id=${id}`);
            return res.status(404).json({ error: "Not found" });
        }
        res.json(reservation);
    }
    catch (err) {
        console.error('Get reservation by ID error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Create
async function createReservation(req, res) {
    const prisma = req.prisma;
    try {
        const reservation = await prisma.reservation.create({ data: req.body });
        res.status(201).json(reservation);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create reservation.' });
    }
}
// Update
async function updateReservation(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        const updatedReservation = await prisma.reservation.update({
            where: { id },
            data: req.body,
        });
        res.json(updatedReservation);
    }
    catch (error) {
        console.error(`Error updating reservation ${id}:`, error);
        res.status(500).json({ error: 'Failed to update reservation' });
    }
}
// Delete
async function deleteReservation(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        await prisma.reservation.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error deleting reservation ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
}
// Search/filter by date/status/table
async function searchReservations(req, res) {
    try {
        const prisma = req.prisma;
        const { date, status, tableId } = req.query;
        const where = {
            AND: [
                date ? { date: new Date(date) } : {},
                status ? { status: status } : {},
                tableId ? { tableId: tableId } : {},
            ]
        };
        const reservations = await prisma.reservation.findMany({ where });
        console.log(`Searched reservations with query: ${JSON.stringify(req.query)}`);
        res.json(reservations);
    }
    catch (err) {
        console.error('Search reservations error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Availability check for a date/time/party size
async function checkAvailability(req, res) {
    try {
        const prisma = req.prisma;
        const { date, time, partySize } = req.query;
        const reservations = await prisma.reservation.findMany({
            where: {
                date: new Date(date),
                time: time
            }
        });
        const reservedTables = reservations.map((r) => r.tableId);
        const tables = await prisma.table.findMany({
            where: {
                capacity: { gte: Number(partySize) },
                id: { notIn: reservedTables }
            }
        });
        console.log(`Checked table availability for date=${date}, time=${time}, partySize=${partySize}`);
        res.json(tables);
    }
    catch (err) {
        console.error('Check availability error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=reservation.js.map