/** @format */

import { Router } from 'express';
import {
	getAllCustomers,
	createCustomer,
	updateCustomer,
	deleteCustomer,
	getCustomerById,
	getExtendedCustomers,
} from '../controllers/customer';
import { checkPermission } from '../middleware/checkPermission';

const router = Router();

router.get('/', getAllCustomers);
router.get('/extended', getExtendedCustomers);
router.post('/', checkPermission('customer_management'), createCustomer);
router.put('/:id', checkPermission('customer_management'), updateCustomer);
router.get('/:id', getCustomerById);
router.delete('/:id', checkPermission('customer_management'), deleteCustomer);

export { router as customerRoutes };
