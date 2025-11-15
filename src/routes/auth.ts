import { Router } from 'express';
import { login } from '../controllers/auth';
import { signup } from '../controllers/signup';
import { tenantPrisma } from '../middleware/tenantPrisma';
const router = Router();

router.post('/login', tenantPrisma, login);
router.post('/signup', signup);

export { router as authRoutes };
