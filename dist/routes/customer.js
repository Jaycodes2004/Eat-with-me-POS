"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerRoutes = void 0;
const express_1 = require("express");
const customer_1 = require("../controllers/customer");
const checkPermission_1 = require("../middleware/checkPermission");
const router = (0, express_1.Router)();
exports.customerRoutes = router;
router.get('/', customer_1.getAllCustomers);
router.get('/extended', customer_1.getExtendedCustomers);
router.post('/', (0, checkPermission_1.checkPermission)('customer_management'), customer_1.createCustomer);
router.put('/:id', (0, checkPermission_1.checkPermission)('customer_management'), customer_1.updateCustomer);
router.get('/:id', customer_1.getCustomerById);
router.delete('/:id', (0, checkPermission_1.checkPermission)('customer_management'), customer_1.deleteCustomer);
//# sourceMappingURL=customer.js.map