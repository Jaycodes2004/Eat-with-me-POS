import { Router } from "express";
import {
  getAllReservations,
  createReservation,
  updateReservation,
  deleteReservation
} from "../controllers/reservation";
import { checkPermission } from "../middleware/checkPermission";

const router = Router();

router.get("/", checkPermission("reservation_management"), getAllReservations);
router.post("/", checkPermission("reservation_management"), createReservation);
router.put("/:id", checkPermission("reservation_management"), updateReservation);
router.delete("/:id", checkPermission("reservation_management"), deleteReservation);

export { router as reservationRoutes };
