"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryRole_1 = require("../controllers/categoryRole");
const router = (0, express_1.Router)();
router.get('/', categoryRole_1.getCategoriesAndRoles);
// --- Category routes ---
router.get('/categories', categoryRole_1.getCategories);
router.post('/categories', categoryRole_1.createCategory);
router.put('/categories/:id', categoryRole_1.updateCategory);
router.delete('/categories/:id', categoryRole_1.deleteCategory);
// --- Role routes ---
router.get('/roles', categoryRole_1.getRoles);
router.post('/roles', categoryRole_1.createRole);
router.put('/roles/:id', categoryRole_1.updateRole);
router.delete('/roles/:id', categoryRole_1.deleteRole);
exports.default = router;
//# sourceMappingURL=categoryRole.js.map