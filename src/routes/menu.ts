import { Router } from "express";
import {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  searchMenuItems,
  getMenuInsights
} from "../controllers/menu";
import { checkPermission } from "../middleware/checkPermission"; // Import the new middleware

const router = Router();

// Routes accessible to any logged-in user
router.get("/", getAllMenuItems);
router.get("/search", searchMenuItems);
router.get("/insights", getMenuInsights);
router.get("/:id", getMenuItemById);

// Routes restricted to users with 'menu_management' permission
router.post("/", checkPermission("menu_management"), createMenuItem);
router.put("/:id", checkPermission("menu_management"), updateMenuItem);
router.delete("/:id", checkPermission("menu_management"), deleteMenuItem);

export default router;
