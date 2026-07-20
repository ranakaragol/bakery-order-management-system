import express from "express";
import {
  getContactInfo,
  getCustomerById,
  getCustomers,
  getDashboard,
  getOrders,
  updateOrderStatus,
  upsertContactInfo
} from "../controllers/adminController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { csrfProtection } from "../middleware/csrfMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { contactValidator, statusValidator } from "../validators/commerceValidators.js";

const router = express.Router();

router.use(protect, csrfProtection, allowRoles("admin"));

router.get("/dashboard", getDashboard);
router.get("/orders", getOrders);
router.patch("/orders/:id/status", statusValidator, validateRequest, updateOrderStatus);
router.get("/customers", getCustomers);
router.get("/customers/:id", getCustomerById);
router.get("/contact", getContactInfo);
router.put("/contact", contactValidator, validateRequest, upsertContactInfo);

export default router;
