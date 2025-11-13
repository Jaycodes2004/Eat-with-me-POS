"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableRoutes = void 0;
const express_1 = require("express");
const table_1 = require("../controllers/table");
const router = (0, express_1.Router)();
exports.tableRoutes = router;
router.get("/", table_1.getAllTables);
router.get("/search", table_1.searchTables);
router.get("/stats", table_1.getTableStats);
router.get("/:id", table_1.getTableById);
router.post("/", table_1.createTable);
router.put("/:id", table_1.updateTable);
router.delete("/:id", table_1.deleteTable);
//# sourceMappingURL=table.js.map