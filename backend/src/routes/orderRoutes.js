import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createOrderValidator } from "../validators/commerceValidators.js";

const router = express.Router();

router.use(protect);

router.get("/my", getMyOrders);
router.get("/:id", getOrderById);
router.post("/", createOrderValidator, validateRequest, createOrder);

export default router;
