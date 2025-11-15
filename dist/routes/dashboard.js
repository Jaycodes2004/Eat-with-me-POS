"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dashboard_1 = require("../controllers/dashboard");
const checkPermission_1 = require("../middleware/checkPermission");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "Missing token" });
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "";
    if (!secret)
        return res.status(500).json({ error: "JWT secret not configured" });
    try {
        req.user = jsonwebtoken_1.default.verify(token, secret);
        next();
    }
    catch (_a) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
const router = (0, express_1.Router)();
exports.dashboardRoutes = router;
// The route calls the controller function after the permission check
router.get("/", (0, checkPermission_1.checkPermission)("dashboard_view"), dashboard_1.getDashboardData);
//# sourceMappingURL=dashboard.js.map