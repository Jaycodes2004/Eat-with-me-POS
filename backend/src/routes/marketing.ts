import { Router } from "express";
import { marketingEligibleCustomers } from "../controllers/marketing";
const router = Router();

router.get("/eligible", marketingEligibleCustomers);

export { router as marketingRoutes };
