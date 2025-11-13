"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingRoutes = void 0;
const express_1 = require("express");
const marketing_1 = require("../controllers/marketing");
const router = (0, express_1.Router)();
exports.marketingRoutes = router;
router.get("/eligible", marketing_1.marketingEligibleCustomers);
//# sourceMappingURL=marketing.js.map