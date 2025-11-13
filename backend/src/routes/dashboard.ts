import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getDashboardData } from "../controllers/dashboard";
import { checkPermission } from "../middleware/checkPermission";

interface AuthenticatedRequest extends Request {
  user?: any;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });
  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "";
  if (!secret) return res.status(500).json({ error: "JWT secret not configured" });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

const router = Router();

// The route calls the controller function after the permission check
router.get("/", checkPermission("dashboard_view"), getDashboardData);

export { router as dashboardRoutes };
