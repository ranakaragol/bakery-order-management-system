import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { createCorsOptions } from "./config/corsOptions.js";
import { getHealth } from "./controllers/healthController.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { apiRateLimit, securityHeaders } from "./middleware/securityMiddleware.js";
import { validateAuthCookieConfiguration } from "./utils/authCookies.js";

dotenv.config();
validateAuthCookieConfiguration();

const app = express();
app.disable("x-powered-by");
app.use(cors(createCorsOptions()));
app.use(securityHeaders);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", getHealth);
app.use("/api/auth", authRoutes);
app.use("/api", apiRateLimit);

app.use("/api/public", publicRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
