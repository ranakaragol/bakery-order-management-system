import express from "express";
import { getHomeData, getPublicContactInfo } from "../controllers/publicController.js";

const router = express.Router();

router.get("/home", getHomeData);
router.get("/contact", getPublicContactInfo);

export default router;
