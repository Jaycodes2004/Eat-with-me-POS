import { Router } from "express";
import {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  getTableStats,
  searchTables
} from "../controllers/table";

const router = Router();

router.get("/", getAllTables);
router.get("/search", searchTables);
router.get("/stats", getTableStats);
router.get("/:id", getTableById);
router.post("/", createTable);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);

export { router as tableRoutes };
