import { Router } from 'express';
import { requestPasswordReset, verifyAndResetPassword } from '../controllers/forgotPassword';

const router = Router();

router.post('/forgot-password/request-reset', requestPasswordReset);
router.post('/reset-password/verify-and-reset', verifyAndResetPassword);

export default router;
