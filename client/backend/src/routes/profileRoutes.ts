import { Router } from "express";
import {
  getProfile,
  updatePassword,
  updateProfile,
} from "../controllers/profileController";

const router = Router();

router.get("/:userID", getProfile);
router.patch("/:userID", updateProfile);
router.patch("/:userID/password", updatePassword);

export default router;
