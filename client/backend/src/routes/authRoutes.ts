import { Router } from "express";
import { login, logout, signUp } from "../controllers/authController";

const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);

export default router;
