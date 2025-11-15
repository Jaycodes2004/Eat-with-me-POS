import { Router } from 'express';
import { getSalesReport, getInventoryReport, getCustomerReport, getSalesSummaryReport } from '../controllers/report';
import { checkPermission } from '../middleware/checkPermission';

const router = Router();

router.get('/sales', checkPermission('reports_view'), getSalesReport);
router.get('/sales-summary', checkPermission('reports_view'), getSalesSummaryReport);
router.get('/inventory', checkPermission('reports_view'), getInventoryReport);
router.get('/customer', checkPermission('reports_view'), getCustomerReport);

export { router as reportRoutes };
