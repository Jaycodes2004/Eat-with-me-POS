import { Router } from "express";
import { getAllShifts, createShift, getStaffShifts } from "../controllers/shifts";
import { deleteShift, updateShift } from "../controllers/shifts";
const router = Router();

router.get("/", getAllShifts);
router.post("/", createShift);
router.get("/staff/:staffId", getStaffShifts);
router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

export { router as shiftRoutes };
