"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_1 = require("../controllers/inventory");
const router = (0, express_1.Router)();
router.get("/", inventory_1.getAllInventoryItems);
router.get("/categories", inventory_1.getInventoryCategories);
router.get("/stats", inventory_1.getInventoryStats);
router.get("/purchases", inventory_1.getPurchaseEntries);
router.get("/:id", inventory_1.getInventoryItemById);
router.get("/wastage", inventory_1.getWastageEntries);
router.post("/", inventory_1.createInventoryItem);
router.post("/purchases", inventory_1.createPurchaseEntry);
router.post("/wastage", inventory_1.recordWastageEntry);
router.put("/:id", inventory_1.updateInventoryItem);
router.delete("/:id", inventory_1.deleteInventoryItem);
exports.default = router;
//# sourceMappingURL=inventory.js.map