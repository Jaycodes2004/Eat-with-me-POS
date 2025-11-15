"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const express_1 = require("express");
const report_1 = require("../controllers/report");
const checkPermission_1 = require("../middleware/checkPermission");
const router = (0, express_1.Router)();
exports.reportRoutes = router;
router.get('/sales', (0, checkPermission_1.checkPermission)('reports_view'), report_1.getSalesReport);
router.get('/sales-summary', (0, checkPermission_1.checkPermission)('reports_view'), report_1.getSalesSummaryReport);
router.get('/inventory', (0, checkPermission_1.checkPermission)('reports_view'), report_1.getInventoryReport);
router.get('/customer', (0, checkPermission_1.checkPermission)('reports_view'), report_1.getCustomerReport);
//# sourceMappingURL=report.js.map