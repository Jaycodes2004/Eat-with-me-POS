"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationRoutes = void 0;
const express_1 = require("express");
const reservation_1 = require("../controllers/reservation");
const checkPermission_1 = require("../middleware/checkPermission");
const router = (0, express_1.Router)();
exports.reservationRoutes = router;
router.get("/", (0, checkPermission_1.checkPermission)("reservation_management"), reservation_1.getAllReservations);
router.post("/", (0, checkPermission_1.checkPermission)("reservation_management"), reservation_1.createReservation);
router.put("/:id", (0, checkPermission_1.checkPermission)("reservation_management"), reservation_1.updateReservation);
router.delete("/:id", (0, checkPermission_1.checkPermission)("reservation_management"), reservation_1.deleteReservation);
//# sourceMappingURL=reservation.js.map