import { Router } from 'express';
import { login } from '../controllers/auth';
import { signup } from '../controllers/signup';

const router = Router();

// Login now uses getPrismClientForRestaurant inside the controller.
// No tenantPrismaMiddleware needed here.
router.post('/login', login);

// Signup should NOT require restaurantId in body:
router.post('/signup', signup);

export { router as authRoutes };
