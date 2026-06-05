import { Router } from "express";
import { getAllApplications, updateApplicationStatus } from "../controllers/applicationController";

const router = Router();

router.get("/", getAllApplications);
router.put("/:bookingID/status", updateApplicationStatus);

export default router;