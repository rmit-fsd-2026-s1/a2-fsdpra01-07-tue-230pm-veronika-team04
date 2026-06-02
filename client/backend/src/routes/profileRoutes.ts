import { Router } from "express";
import {
  getProfile,
  updatePassword,
  updateProfile,
} from "../controllers/profileController";

const router = Router();

router.get("/:userID", getProfile);
router.put("/:userID", updateProfile);
router.put("/:userID/password", updatePassword);

export default router;
