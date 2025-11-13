"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const signup_1 = require("../controllers/signup");
const tenantPrisma_1 = require("../middleware/tenantPrisma");
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.post('/login', tenantPrisma_1.tenantPrisma, auth_1.login);
router.post('/signup', signup_1.signup);
//# sourceMappingURL=auth.js.map