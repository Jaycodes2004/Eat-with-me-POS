"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = void 0;
const express_1 = require("express");
const ai_1 = require("../controllers/ai");
const router = (0, express_1.Router)();
exports.aiRoutes = router;
router.post("/chat", ai_1.aiChat);
router.get("/insights", ai_1.getAIInsights);
//# sourceMappingURL=ai.js.map