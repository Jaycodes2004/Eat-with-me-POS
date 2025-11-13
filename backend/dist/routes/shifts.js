"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftRoutes = void 0;
const express_1 = require("express");
const shifts_1 = require("../controllers/shifts");
const shifts_2 = require("../controllers/shifts");
const router = (0, express_1.Router)();
exports.shiftRoutes = router;
router.get("/", shifts_1.getAllShifts);
router.post("/", shifts_1.createShift);
router.get("/staff/:staffId", shifts_1.getStaffShifts);
router.put("/:id", shifts_2.updateShift);
router.delete("/:id", shifts_2.deleteShift);
//# sourceMappingURL=shifts.js.map