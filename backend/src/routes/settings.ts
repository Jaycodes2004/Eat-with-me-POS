import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings";
import { authenticateToken } from "../middleware/auth"; // Ensure this path is correct

// 1. Create a new router instance
const router = Router();

// 2. Define the routes and apply the authentication middleware
// This middleware will run BEFORE getSettings or updateSettings
router.get("/", authenticateToken, getSettings);
router.put("/", authenticateToken, updateSettings);

// 3. CRITICAL: Export the router as the default export
export default router;
