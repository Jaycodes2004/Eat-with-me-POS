import { Router } from "express";
import {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryCategories,
  getInventoryStats,
  createPurchaseEntry,
  getPurchaseEntries,
  recordWastageEntry,
  getWastageEntries,
} from "../controllers/inventory";

const router = Router();

router.get("/", getAllInventoryItems);
router.get("/categories", getInventoryCategories);
router.get("/stats", getInventoryStats);
router.get("/purchases", getPurchaseEntries);
router.get("/:id", getInventoryItemById);
router.get("/wastage", getWastageEntries);

router.post("/", createInventoryItem);
router.post("/purchases", createPurchaseEntry);
router.post("/wastage", recordWastageEntry);

router.put("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

export default router;
