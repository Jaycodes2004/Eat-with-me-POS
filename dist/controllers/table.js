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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTables = getAllTables;
exports.getTableById = getTableById;
exports.createTable = createTable;
exports.updateTable = updateTable;
exports.deleteTable = deleteTable;
exports.getTableStats = getTableStats;
exports.searchTables = searchTables;
const mapTableRecord = (table) => ({
    id: table.id,
    number: table.number,
    name: table.name,
    status: (table.status || 'FREE').toLowerCase(),
    capacity: table.capacity,
    location: table.location,
    notes: table.notes,
    guests: table.guests || 0,
    currentOrderId: table.currentOrderId || null,
    lastOrderAt: table.lastOrderAt,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
});
async function getAllTables(req, res) {
    const prisma = req.prisma;
    try {
        const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
        res.json(tables.map(mapTableRecord));
    }
    catch (error) {
        console.error('Error fetching tables:', error);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
}
async function getTableById(req, res) {
    const prisma = req.prisma;
    try {
        const { id } = req.params;
        const table = await prisma.table.findUnique({ where: { id } });
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        res.json(mapTableRecord(table));
    }
    catch (error) {
        console.error(`Error fetching table ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch table' });
    }
}
async function createTable(req, res) {
    const prisma = req.prisma;
    try {
        const { number, capacity, status = 'FREE', name, location, notes, } = req.body;
        if (typeof number !== 'number' || typeof capacity !== 'number') {
            return res.status(400).json({ error: 'number and capacity are required numeric fields.' });
        }
        const table = await prisma.table.create({
            data: {
                number,
                capacity,
                status: String(status).toUpperCase(),
                name,
                location,
                notes,
            },
        });
        res.status(201).json(mapTableRecord(table));
    }
    catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({ error: 'Failed to create table' });
    }
}
async function updateTable(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        const _a = req.body, { status } = _a, data = __rest(_a, ["status"]);
        if (status) {
            data.status = String(status).toUpperCase();
        }
        const updatedTable = await prisma.table.update({
            where: { id },
            data,
        });
        res.json(mapTableRecord(updatedTable));
    }
    catch (error) {
        console.error(`Error updating table ${id}:`, error);
        res.status(500).json({ error: 'Failed to update table' });
    }
}
async function deleteTable(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        await prisma.table.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error deleting table ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete table' });
    }
}
async function getTableStats(req, res) {
    const prisma = req.prisma;
    try {
        const [total, occupied, reserved, cleaning] = await Promise.all([
            prisma.table.count(),
            prisma.table.count({ where: { status: 'OCCUPIED' } }),
            prisma.table.count({ where: { status: 'RESERVED' } }),
            prisma.table.count({ where: { status: 'CLEANING' } }),
        ]);
        const free = total - occupied - reserved - cleaning;
        res.json({
            total,
            occupied,
            reserved,
            cleaning,
            free: free < 0 ? 0 : free,
        });
    }
    catch (error) {
        console.error('Error fetching table stats:', error);
        res.status(500).json({ error: 'Failed to fetch table stats' });
    }
}
async function searchTables(req, res) {
    const prisma = req.prisma;
    try {
        const { number, status, capacity } = req.query;
        const filters = {};
        if (number) {
            filters.number = Number(number);
        }
        if (capacity) {
            filters.capacity = Number(capacity);
        }
        if (status) {
            filters.status = String(status).toUpperCase();
        }
        const tables = await prisma.table.findMany({ where: filters, orderBy: { number: 'asc' } });
        res.json(tables.map(mapTableRecord));
    }
    catch (error) {
        console.error('Error searching tables:', error);
        res.status(500).json({ error: 'Failed to search tables' });
    }
}
//# sourceMappingURL=table.js.map