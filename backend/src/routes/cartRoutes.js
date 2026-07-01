import express from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { addToCartValidator, updateCartItemValidator } from "../validators/commerceValidators.js";

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post("/items", addToCartValidator, validateRequest, addToCart);
router.put("/items/:itemId", updateCartItemValidator, validateRequest, updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);

export default router;
