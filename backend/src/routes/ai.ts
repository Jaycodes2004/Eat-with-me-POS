import { Router } from "express";
import { aiChat, getAIInsights } from "../controllers/ai";
const router = Router();

router.post("/chat", aiChat);
router.get("/insights", getAIInsights);

export { router as aiRoutes };
