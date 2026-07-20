import express from "express";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getProductById,
  getProducts,
  updateProduct
} from "../controllers/productController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { productValidator } from "../validators/catalogValidators.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/admin", protect, allowRoles("admin"), getAdminProducts);
router.get("/:id", getProductById);
router.post("/", protect, allowRoles("admin"), productValidator, validateRequest, createProduct);
router.put("/:id", protect, allowRoles("admin"), productValidator, validateRequest, updateProduct);
router.delete("/:id", protect, allowRoles("admin"), deleteProduct);

export default router;
