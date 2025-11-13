"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_1 = require("../controllers/settings");
const auth_1 = require("../middleware/auth"); // Ensure this path is correct
// 1. Create a new router instance
const router = (0, express_1.Router)();
// 2. Define the routes and apply the authentication middleware
// This middleware will run BEFORE getSettings or updateSettings
router.get("/", auth_1.authenticateToken, settings_1.getSettings);
router.put("/", auth_1.authenticateToken, settings_1.updateSettings);
// 3. CRITICAL: Export the router as the default export
exports.default = router;
//# sourceMappingURL=settings.js.map