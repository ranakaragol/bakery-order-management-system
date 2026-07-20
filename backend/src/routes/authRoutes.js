import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  register,
  updateProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { csrfProtection } from "../middleware/csrfMiddleware.js";
import { authLoginRateLimit, authRegisterRateLimit } from "../middleware/securityMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginValidator, profileValidator, registerValidator } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", authRegisterRateLimit, registerValidator, validateRequest, register);
router.post("/login", authLoginRateLimit, loginValidator, validateRequest, login);
router.post("/logout", csrfProtection, logout);
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, csrfProtection, profileValidator, validateRequest, updateProfile);

export default router;
