import express from "express";
import {
  getCurrentUser,
  login,
  register,
  updateProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginValidator, profileValidator, registerValidator } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, profileValidator, validateRequest, updateProfile);

export default router;
