import { Router } from "express";
import {
  getAllLoyaltyLogs,
  getCustomerLoyaltyLog,
  addLoyaltyLog,
  getLoyaltyRewards,
  getLoyaltyRules,
  getLoyaltyMembers,
  createLoyaltyReward,
  updateLoyaltyReward,
  deleteLoyaltyReward,
  createLoyaltyRule,
  updateLoyaltyRule,
  deleteLoyaltyRule,
} from "../controllers/loyalty";
import { checkPermission } from "../middleware/checkPermission";

const router = Router();

router.get("/rewards", checkPermission('loyalty'), getLoyaltyRewards);
router.post("/rewards", checkPermission('loyalty'), createLoyaltyReward);
router.put("/rewards/:id", checkPermission('loyalty'), updateLoyaltyReward);
router.delete("/rewards/:id", checkPermission('loyalty'), deleteLoyaltyReward);

router.get("/rules", checkPermission('loyalty'), getLoyaltyRules);
router.post("/rules", checkPermission('loyalty'), createLoyaltyRule);
router.put("/rules/:id", checkPermission('loyalty'), updateLoyaltyRule);
router.delete("/rules/:id", checkPermission('loyalty'), deleteLoyaltyRule);

router.get("/members", checkPermission('loyalty'), getLoyaltyMembers);
router.get("/", checkPermission('loyalty'), getAllLoyaltyLogs);
router.get("/:id", checkPermission('loyalty'), getCustomerLoyaltyLog);
router.post("/:id", checkPermission('loyalty'), addLoyaltyLog);

export { router as loyaltyRoutes };
