import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendError } from "../utils/apiResponses.js";
import {
  clearAuthenticationCookies,
  getAuthCookieName,
  readRequestCookie
} from "../utils/authCookies.js";

export const protect = async (req, res, next) => {
  const token = readRequestCookie(req, getAuthCookieName());

  if (!token) {
    return sendError(res, 401, { message: "Authentication token is missing." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate("invoiceInfo");

    if (!user) {
      clearAuthenticationCookies(res);
      return sendError(res, 401, { message: "User could not be found." });
    }

    req.user = user;
    next();
  } catch {
    clearAuthenticationCookies(res);
    return sendError(res, 401, { message: "Authentication failed." });
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, 403, { message: "You are not authorized for this action." });
  }

  next();
};
