import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from "../controllers/categoryController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { categoryValidator } from "../validators/catalogValidators.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", protect, allowRoles("admin"), categoryValidator, validateRequest, createCategory);
router.put("/:id", protect, allowRoles("admin"), categoryValidator, validateRequest, updateCategory);
router.delete("/:id", protect, allowRoles("admin"), deleteCategory);

export default router;
