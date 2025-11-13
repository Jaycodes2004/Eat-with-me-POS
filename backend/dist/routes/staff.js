"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffRoutes = void 0;
const express_1 = require("express");
const staff_1 = require("../controllers/staff");
const router = (0, express_1.Router)();
exports.staffRoutes = router;
router.get("/", staff_1.getAllStaff);
router.get("/search", staff_1.searchStaff);
router.get("/roles", staff_1.getStaffRoles);
router.get("/stats", staff_1.getStaffStats);
router.get("/salary-payments", staff_1.getSalaryPayments);
router.post("/salary-payments", staff_1.createSalaryPayment);
router.get("/:id", staff_1.getStaffById);
router.post("/", staff_1.createStaff);
router.put("/:id", staff_1.updateStaff);
router.delete("/:id", staff_1.deleteStaff);
//# sourceMappingURL=staff.js.map