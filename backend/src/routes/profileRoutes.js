import express from "express";
import {
  getProfile,
  updatePassword,
  updateProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { csrfProtection } from "../middleware/csrfMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { profilePasswordValidator, profileValidator } from "../validators/authValidators.js";

const router = express.Router();

router.use(protect, csrfProtection);

router.get("/", getProfile);
router.put("/", profileValidator, validateRequest, updateProfile);
router.put("/password", profilePasswordValidator, validateRequest, updatePassword);

export default router;
