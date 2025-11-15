import { Router } from "express";
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchasesBySupplier
} from "../controllers/supplier";
import { checkPermission } from "../middleware/checkPermission";

const router = Router();

// --- Supplier Management Routes ---
// Anyone can view suppliers
router.get("/", getAllSuppliers);
router.get("/:id", getSupplierById);

// Requires 'supplier_management' permission
router.post(
  "/",
  checkPermission("supplier_management"),
  createSupplier
);
router.put(
  "/:id",
  checkPermission("supplier_management"),
  updateSupplier
);
router.delete(
  "/:id",
  checkPermission("supplier_management"),
  deleteSupplier
);

// --- Purchase Order Routes ---
// Requires 'inventory_management' permission as it affects stock
router.get(
  "/purchases/all",
  checkPermission("inventory_management"),
  getAllPurchases
);
router.get(
  "/purchases/by-supplier/:supplierId",
  checkPermission("inventory_management"),
  getPurchasesBySupplier
);
router.get(
  "/purchases/:id",
  checkPermission("inventory_management"),
  getPurchaseById
);
router.post(
  "/purchases",
  checkPermission("inventory_management"),
  createPurchase
);
router.put(
  "/purchases/:id",
  checkPermission("inventory_management"),
  updatePurchase
);
router.delete(
  "/purchases/:id",
  checkPermission("inventory_management"),
  deletePurchase
);

export { router as supplierRoutes };
