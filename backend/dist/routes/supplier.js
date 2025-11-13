"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierRoutes = void 0;
const express_1 = require("express");
const supplier_1 = require("../controllers/supplier");
const checkPermission_1 = require("../middleware/checkPermission");
const router = (0, express_1.Router)();
exports.supplierRoutes = router;
// --- Supplier Management Routes ---
// Anyone can view suppliers
router.get("/", supplier_1.getAllSuppliers);
router.get("/:id", supplier_1.getSupplierById);
// Requires 'supplier_management' permission
router.post("/", (0, checkPermission_1.checkPermission)("supplier_management"), supplier_1.createSupplier);
router.put("/:id", (0, checkPermission_1.checkPermission)("supplier_management"), supplier_1.updateSupplier);
router.delete("/:id", (0, checkPermission_1.checkPermission)("supplier_management"), supplier_1.deleteSupplier);
// --- Purchase Order Routes ---
// Requires 'inventory_management' permission as it affects stock
router.get("/purchases/all", (0, checkPermission_1.checkPermission)("inventory_management"), supplier_1.getAllPurchases);
router.get("/purchases/by-supplier/:supplierId", (0, checkPermission_1.checkPermission)("inventory_management"), supplier_1.getPurchasesBySupplier);
router.get("/purchases/:id", (0, checkPermission_1.checkPermission)("inventory_management"), supplier_1.getPurchaseById);
router.post("/purchases", (0, checkPermission_1.checkPermission)("inventory_management"), supplier_1.createPurchase);
router.put("/purchases/:id", (0, checkPermission_1.checkPermission)("inventory_management"), supplier_1.updatePurchase);
router.delete("/purchases/:id", (0, checkPermission_1.checkPermission)("inventory_management"), supplier_1.deletePurchase);
//# sourceMappingURL=supplier.js.map