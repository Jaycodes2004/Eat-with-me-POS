import { Request, Response } from "express";

// Customers eligible for marketing campaign (matches marketing filters)
export async function marketingEligibleCustomers(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const { minOrders, minSpent, tier, lastVisitDays, whatsappOptIn } = req.query;
  // Example: filter logic for WhatsApp campaign
  const filter: any = {
    ...(whatsappOptIn !== undefined
      ? { whatsappOptIn: whatsappOptIn === "true" }
      : {})
  };
  // Add more filters per your data model
  const customers = await prisma.customer.findMany({ where: filter });
  res.json(customers);
}
