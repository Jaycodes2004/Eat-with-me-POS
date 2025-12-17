"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const signup_1 = require("../controllers/signup");
const router = (0, express_1.Router)();
exports.authRoutes = router;
// Login now uses getPrismClientForRestaurant inside the controller.
// No tenantPrismaMiddleware needed here.
router.post('/login', auth_1.login);
// Signup should NOT require restaurantId in body:
router.post('/signup', signup_1.signup);
//# sourceMappingURL=auth.js.map