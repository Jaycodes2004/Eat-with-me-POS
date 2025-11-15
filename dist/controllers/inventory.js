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
exports.getAllInventoryItems = getAllInventoryItems;
exports.getInventoryItemById = getInventoryItemById;
exports.createInventoryItem = createInventoryItem;
exports.updateInventoryItem = updateInventoryItem;
exports.deleteInventoryItem = deleteInventoryItem;
exports.getInventoryCategories = getInventoryCategories;
exports.getInventoryStats = getInventoryStats;
exports.createPurchaseEntry = createPurchaseEntry;
exports.getPurchaseEntries = getPurchaseEntries;
exports.recordWastageEntry = recordWastageEntry;
exports.getWastageEntries = getWastageEntries;
const promises_1 = __importDefault(require("fs/promises"));
async function getAllInventoryItems(req, res) {
    const prisma = req.prisma;
    try {
        const items = await prisma.inventoryItem.findMany({
            include: { supplier: true },
            orderBy: { name: 'asc' },
        });
        res.json(items);
    }
    catch (error) {
        console.error('Error fetching inventory items:', error);
        res.status(500).json({ error: 'Failed to fetch inventory items' });
    }
}
async function getInventoryItemById(req, res) {
    const { id } = req.params;
    try {
        const prisma = req.prisma;
        const item = await prisma.inventoryItem.findUnique({ where: { id }, include: { supplier: true } });
        if (!item) {
            console.log(`GET /inventory/${id} - not found`);
            return res.status(404).json({ error: "Inventory item not found" });
        }
        console.log(`GET /inventory/${id} - fetched`);
        return res.json(item);
    }
    catch (err) {
        console.error(`GET /inventory/${req.params.id} error:`, err.message || err);
        return res.status(500).json({ error: "Failed to fetch inventory item" });
    }
}
async function createInventoryItem(req, res) {
    const prisma = req.prisma;
    try {
        const _a = req.body, { supplierId } = _a, data = __rest(_a, ["supplierId"]);
        const newItem = await prisma.inventoryItem.create({
            data: Object.assign(Object.assign({}, data), { supplier: supplierId ? { connect: { id: supplierId } } : undefined }),
        });
        res.status(201).json(newItem);
    }
    catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ error: 'Failed to create inventory item' });
    }
}
async function updateInventoryItem(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        const _a = req.body, { supplierId } = _a, data = __rest(_a, ["supplierId"]);
        const updatedItem = await prisma.inventoryItem.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { supplier: supplierId ? { connect: { id: supplierId } } : undefined }),
        });
        res.json(updatedItem);
    }
    catch (error) {
        console.error(`Error updating inventory item ${id}:`, error);
        res.status(500).json({ error: 'Failed to update item' });
    }
}
async function deleteInventoryItem(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        await prisma.inventoryItem.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error deleting inventory item ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
}
async function getInventoryCategories(req, res) {
    try {
        const prisma = req.prisma;
        const categories = await prisma.inventoryItem.findMany({ distinct: ["category"], select: { category: true } });
        console.log(`GET /inventory/categories - fetched categories: count=${categories.length}`);
        return res.json(categories.map((c) => c.category));
    }
    catch (err) {
        console.error("GET /inventory/categories error:", err.message || err);
        return res.status(500).json({ error: "Failed to get categories" });
    }
}
async function getInventoryStats(req, res) {
    try {
        const prisma = req.prisma;
        const items = await prisma.inventoryItem.findMany();
        const total = items.length;
        const lowStock = items.reduce((count, it) => {
            const current = Number(it.currentStock) || 0;
            const min = Number(it.minStock) || 0;
            return current <= min ? count + 1 : count;
        }, 0);
        const expiringSoon = items.reduce((count, it) => {
            const expiry = it.expiryDate;
            if (!expiry)
                return count;
            const days = Math.ceil(((new Date(expiry)).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return days <= 7 && days >= 0 ? count + 1 : count;
        }, 0);
        const totalValue = items.reduce((sum, it) => {
            const cs = Number(it.currentStock) || 0;
            const cpu = Number(it.costPerUnit) || 0;
            return sum + cs * cpu;
        }, 0);
        console.log(`GET /inventory/stats - total=${total} lowStock=${lowStock} expiringSoon=${expiringSoon} totalValue=${totalValue}`);
        return res.json({ total, lowStock, expiringSoon, totalValue });
    }
    catch (err) {
        console.error("GET /inventory/stats error:", err.message || err);
        return res.status(500).json({ error: "Failed to get inventory stats" });
    }
}
async function createPurchaseEntry(req, res) {
    var _a, _b;
    try {
        const prisma = req.prisma;
        const body = req.body;
        if (!Array.isArray(body.items) || body.items.length === 0) {
            console.log("POST /inventory/purchases - no items provided");
            return res.status(400).json({ error: "Purchase items required" });
        }
        console.log(`POST /inventory/purchases - creating purchase with items=${body.items.length}`);
        // Resolve supplier: allow null, accept an existing id, or accept a supplier name (find or create)
        let supplierId = null;
        const supplierInput = (_b = (_a = body.supplierId) !== null && _a !== void 0 ? _a : body.supplier) !== null && _b !== void 0 ? _b : null;
        if (supplierInput) {
            // try treat as id first
            try {
                const maybeById = await prisma.supplier.findUnique({ where: { id: supplierInput } });
                if (maybeById) {
                    supplierId = maybeById.id;
                }
                else if (typeof supplierInput === "string") {
                    // try find by name (case-insensitive)
                    const maybeByName = await prisma.supplier.findFirst({ where: { name: { equals: supplierInput, mode: "insensitive" } } });
                    if (maybeByName) {
                        supplierId = maybeByName.id;
                    }
                    else {
                        // create new supplier record with given name
                        const createdSupplier = await prisma.supplier.create({ data: { name: supplierInput } });
                        supplierId = createdSupplier.id;
                        console.log(`Created supplier with id=${supplierId} name=${supplierInput}`);
                    }
                }
            }
            catch (e) {
                // If lookup by id throws or input type mismatch, fallback to null
                console.warn("Supplier resolution warning:", e.message || e);
                supplierId = null;
            }
        }
        const totalAmount = body.items.reduce((s, it) => {
            const q = Number(it.quantity) || 0;
            const up = Number(it.unitPrice) || 0;
            return s + q * up;
        }, 0);
        const purchase = await prisma.$transaction(async (tx) => {
            const p = await tx.purchase.create({
                data: {
                    supplierId: supplierId !== null && supplierId !== void 0 ? supplierId : null,
                    invoiceNumber: body.invoiceNumber || null,
                    date: body.date ? new Date(body.date) : new Date(),
                    totalAmount,
                    notes: body.notes || null,
                },
            });
            for (const it of body.items) {
                const qty = Number(it.quantity) || 0;
                const unitPrice = Number(it.unitPrice) || 0;
                await tx.purchaseItem.create({
                    data: {
                        purchaseId: p.id,
                        inventoryItemId: it.inventoryItemId,
                        quantity: qty,
                        unitPrice,
                        totalPrice: qty * unitPrice,
                    },
                });
                await tx.inventoryItem.update({
                    where: { id: it.inventoryItemId },
                    data: { currentStock: { increment: qty }, lastPurchase: new Date() },
                });
                console.log(`POST /inventory/purchases - inventory updated id=${it.inventoryItemId} +${qty}`);
            }
            return p;
        });
        console.log(`POST /inventory/purchases - purchase created id=${purchase === null || purchase === void 0 ? void 0 : purchase.id}`);
        return res.status(201).json(purchase);
    }
    catch (err) {
        console.error("POST /inventory/purchases error - stack:", err.stack || err);
        return res.status(500).json({ error: err.message || "Failed to create purchase entry" });
    }
}
async function getPurchaseEntries(req, res) {
    try {
        const prisma = req.prisma;
        const purchases = await prisma.purchase.findMany({
            include: { supplier: true, items: { include: { inventoryItem: true } } },
            orderBy: { date: "desc" },
        });
        console.log(`GET /inventory/purchases - fetched purchases: count=${purchases.length}`);
        return res.json(purchases);
    }
    catch (err) {
        console.error("GET /inventory/purchases error:", err.message || err);
        return res.status(500).json({ error: "Failed to get purchase entries" });
    }
}
async function recordWastageEntry(req, res) {
    try {
        const prisma = req.prisma;
        const body = req.body;
        if (!Array.isArray(body.items) || body.items.length === 0) {
            console.log("POST /inventory/wastage - no items provided");
            return res.status(400).json({ error: "Wastage items required" });
        }
        const items = body.items
            .map((it) => ({
            inventoryItemId: it.inventoryItemId,
            quantity: Math.max(0, Number(it.quantity) || 0),
            reason: it.reason ? String(it.reason).trim() : null,
        }))
            .filter((it) => it.inventoryItemId && it.quantity > 0);
        if (items.length === 0) {
            return res.status(400).json({ error: "No valid wastage items" });
        }
        const timestamp = new Date().toISOString();
        const updates = await prisma.$transaction(async (tx) => {
            const out = [];
            for (const it of items) {
                // decrement stock (Prisma will throw if id invalid)
                const updated = await tx.inventoryItem.update({
                    where: { id: it.inventoryItemId },
                    data: { currentStock: { decrement: it.quantity }, lastPurchase: null },
                });
                out.push({ inventoryItemId: it.inventoryItemId, quantity: it.quantity, afterStock: updated.currentStock });
            }
            return out;
        });
        const logEntry = {
            id: `wst_${Date.now()}`,
            date: timestamp,
            items,
            notes: body.notes || null,
            updates,
        };
        await promises_1.default.appendFile("./wastage.log", JSON.stringify(logEntry) + "\n", "utf8");
        console.log(`POST /inventory/wastage - recorded wastage id=${logEntry.id} items=${items.length}`);
        return res.status(201).json(logEntry);
    }
    catch (err) {
        console.error("POST /inventory/wastage error - stack:", err.stack || err);
        return res.status(500).json({ error: err.message || "Failed to record wastage" });
    }
}
async function getWastageEntries(req, res) {
    try {
        // read the simple newline-delimited JSON log created by recordWastageEntry
        const raw = await promises_1.default.readFile("./wastage.log", "utf8").catch(() => "");
        if (!raw || raw.trim() === "") {
            console.log("GET /inventory/wastage - no wastage records");
            return res.json([]);
        }
        const lines = raw.trim().split("\n").filter(Boolean);
        const entries = lines.map((ln) => {
            try {
                return JSON.parse(ln);
            }
            catch (_a) {
                return { raw: ln };
            }
        });
        // return newest first
        return res.json(entries.reverse());
    }
    catch (err) {
        console.error("GET /inventory/wastage error - stack:", err.stack || err);
        return res.status(500).json({ error: err.message || "Failed to read wastage entries" });
    }
}
//# sourceMappingURL=inventory.js.map