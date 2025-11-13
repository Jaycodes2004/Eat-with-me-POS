"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // The token is expected in the format "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];
    const headerRestaurantId = req.headers['x-restaurant-id'];
    if (token == null) {
        // No token was provided
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // The token is invalid or expired
            return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
        }
        // The decoded payload from your login/signup should contain the restaurant's unique code
        if (!decoded || !decoded.restaurantId) {
            return res.status(403).json({ message: 'Forbidden: Invalid token payload' });
        }
        if (headerRestaurantId && headerRestaurantId !== decoded.restaurantId) {
            return res.status(403).json({ message: 'Forbidden: Restaurant mismatch' });
        }
        // Attach the restaurantId to the request object so subsequent middleware can use it
        req.restaurantId = decoded.restaurantId;
        // Attach the decoded user payload to the request object
        req.user = decoded;
        req.staffId = decoded.staffId;
        req.roleId = decoded.roleId;
        // Proceed to the next middleware in the chain (e.g., the tenantPrisma middleware)
        next();
    });
}
//# sourceMappingURL=auth.js.map