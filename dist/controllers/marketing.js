"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingEligibleCustomers = marketingEligibleCustomers;
// Customers eligible for marketing campaign (matches marketing filters)
async function marketingEligibleCustomers(req, res) {
    const prisma = req.prisma;
    const { minOrders, minSpent, tier, lastVisitDays, whatsappOptIn } = req.query;
    // Example: filter logic for WhatsApp campaign
    const filter = Object.assign({}, (whatsappOptIn !== undefined
        ? { whatsappOptIn: whatsappOptIn === "true" }
        : {}));
    // Add more filters per your data model
    const customers = await prisma.customer.findMany({ where: filter });
    res.json(customers);
}
//# sourceMappingURL=marketing.js.map