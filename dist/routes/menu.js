"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menu_1 = require("../controllers/menu");
const checkPermission_1 = require("../middleware/checkPermission"); // Import the new middleware
const router = (0, express_1.Router)();
// Routes accessible to any logged-in user
router.get("/", menu_1.getAllMenuItems);
router.get("/search", menu_1.searchMenuItems);
router.get("/insights", menu_1.getMenuInsights);
router.get("/:id", menu_1.getMenuItemById);
// Routes restricted to users with 'menu_management' permission
router.post("/", (0, checkPermission_1.checkPermission)("menu_management"), menu_1.createMenuItem);
router.put("/:id", (0, checkPermission_1.checkPermission)("menu_management"), menu_1.updateMenuItem);
router.delete("/:id", (0, checkPermission_1.checkPermission)("menu_management"), menu_1.deleteMenuItem);
exports.default = router;
//# sourceMappingURL=menu.js.map