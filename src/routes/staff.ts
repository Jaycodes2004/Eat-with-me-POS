import { Router } from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  searchStaff,
  getStaffRoles,
  getStaffStats,
  getSalaryPayments,
  createSalaryPayment,
} from "../controllers/staff";

const router = Router();

router.get("/", getAllStaff);
router.get("/search", searchStaff);
router.get("/roles", getStaffRoles);
router.get("/stats", getStaffStats);
router.get("/salary-payments", getSalaryPayments);
router.post("/salary-payments", createSalaryPayment);
router.get("/:id", getStaffById);
router.post("/", createStaff);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export { router as staffRoutes };
