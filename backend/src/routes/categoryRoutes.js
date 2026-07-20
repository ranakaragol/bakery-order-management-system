import express from "express";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  getCategories,
  updateCategory
} from "../controllers/categoryController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { csrfProtection } from "../middleware/csrfMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { categoryValidator } from "../validators/catalogValidators.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/admin", protect, allowRoles("admin"), getAdminCategories);
router.post("/", protect, csrfProtection, allowRoles("admin"), categoryValidator, validateRequest, createCategory);
router.put("/:id", protect, csrfProtection, allowRoles("admin"), categoryValidator, validateRequest, updateCategory);
router.delete("/:id", protect, csrfProtection, allowRoles("admin"), deleteCategory);

export default router;
