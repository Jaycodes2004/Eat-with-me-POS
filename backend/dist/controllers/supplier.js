"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSuppliers = getAllSuppliers;
exports.getSupplierById = getSupplierById;
exports.createSupplier = createSupplier;
exports.updateSupplier = updateSupplier;
exports.deleteSupplier = deleteSupplier;
exports.createPurchase = createPurchase;
exports.getAllPurchases = getAllPurchases;
exports.getPurchaseById = getPurchaseById;
exports.updatePurchase = updatePurchase;
exports.deletePurchase = deletePurchase;
exports.getPurchasesBySupplier = getPurchasesBySupplier;
// --- SUPPLIER CRUD ---
async function getAllSuppliers(req, res) {
    const prisma = req.prisma;
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(suppliers);
    }
    catch (error) {
        console.error('[GET] Error fetching suppliers:', error);
        res.status(500).json({ message: 'Failed to get suppliers.' });
    }
}
async function getSupplierById(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (supplier) {
            res.json(supplier);
        }
        else {
            res.status(404).json({ message: 'Supplier not found.' });
        }
    }
    catch (error) {
        console.error(`[GET] Error fetching supplier by ID ${id}:`, error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}
async function createSupplier(req, res) {
    const prisma = req.prisma;
    try {
        const supplier = await prisma.supplier.create({ data: req.body });
        res.status(201).json(supplier);
    }
    catch (error) {
        console.error('[POST] Error creating supplier:', error);
        res.status(500).json({ message: 'Failed to create supplier.' });
    }
}
async function updateSupplier(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        const supplier = await prisma.supplier.update({
            where: { id },
            data: req.body,
        });
        res.json(supplier);
    }
    catch (error) {
        console.error(`[PUT] Error updating supplier ${id}:`, error);
        res.status(500).json({ message: 'Failed to update supplier.' });
    }
}
async function deleteSupplier(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        await prisma.supplier.delete({ where: { id } });
        res.status(204).send(); // Use 204 No Content for successful deletions
    }
    catch (error) {
        console.error(`[DELETE] Error deleting supplier ${id}:`, error);
        res.status(500).json({ message: 'Failed to delete supplier.' });
    }
}
// --- PURCHASE ORDER CRUD ---
async function createPurchase(req, res) {
    const prisma = req.prisma;
    const { supplierId, invoiceNumber, date, totalAmount, notes, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res
            .status(400)
            .json({ message: 'Purchase must include at least one item.' });
    }
    try {
        // --- FIX: Use a transaction to ensure data integrity ---
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Purchase Order
            const purchase = await tx.purchase.create({
                data: {
                    invoiceNumber,
                    date: new Date(date),
                    totalAmount,
                    notes: notes || '',
                    supplier: { connect: { id: supplierId } },
                    items: {
                        create: items.map((item) => ({
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                            inventoryItemId: item.inventoryItemId,
                        })),
                    },
                },
                include: { items: true },
            });
            // 2. Update inventory stock for each item in the purchase
            for (const item of items) {
                if (item.inventoryItemId && item.quantity > 0) {
                    await tx.inventoryItem.update({
                        where: { id: item.inventoryItemId },
                        data: {
                            currentStock: {
                                increment: item.quantity,
                            },
                        },
                    });
                }
            }
            return purchase;
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error('[POST] Error creating purchase order:', error);
        res.status(500).json({ message: 'Failed to create purchase order.' });
    }
}
async function getAllPurchases(req, res) {
    const prisma = req.prisma;
    try {
        const purchases = await prisma.purchase.findMany({
            include: { supplier: true, items: { include: { inventoryItem: true } } },
            orderBy: { date: 'desc' },
        });
        res.json(purchases);
    }
    catch (error) {
        console.error('[GET] Error fetching purchases:', error);
        res.status(500).json({ message: 'Failed to get purchases.' });
    }
}
// Get purchase order by ID
async function getPurchaseById(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        console.log(`[GET] Fetching purchase order by ID: ${id}`);
        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });
        if (purchase) {
            res.json(purchase);
        }
        else {
            res.status(404).json({ error: 'Not found' });
        }
    }
    catch (error) {
        console.error('[GET] Error fetching purchase by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Update purchase order
async function updatePurchase(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    const data = req.body;
    try {
        console.log(`[PUT] Updating purchase order: ${id}`, data);
        // Update purchase main fields
        const purchase = await prisma.purchase.update({
            where: { id },
            data: {
                expectedDate: data.expectedDate
                    ? new Date(data.expectedDate)
                    : undefined,
                totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : undefined,
                notes: data.notes,
                status: data.status,
                deliveredDate: data.deliveredDate
                    ? new Date(data.deliveredDate)
                    : undefined,
            },
            include: { items: true },
        });
        res.json(purchase);
    }
    catch (error) {
        console.error('[PUT] Error updating purchase order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Delete purchase order
async function deletePurchase(req, res) {
    const prisma = req.prisma;
    const { id } = req.params;
    try {
        console.log(`[DELETE] Deleting purchase order: ${id}`);
        await prisma.purchase.delete({ where: { id } });
        res.json({ deleted: true });
    }
    catch (error) {
        console.error('[DELETE] Error deleting purchase order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Get purchases by supplier
async function getPurchasesBySupplier(req, res) {
    const prisma = req.prisma;
    const { supplierId } = req.params;
    try {
        console.log(`[GET] Fetching purchases for supplier: ${supplierId}`);
        const purchases = await prisma.purchase.findMany({
            where: { supplierId },
            include: { items: true },
            orderBy: { date: 'desc' },
        });
        res.json(purchases);
    }
    catch (error) {
        console.error('[GET] Error fetching purchases by supplier:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=supplier.js.map