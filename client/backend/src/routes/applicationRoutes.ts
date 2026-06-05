import { Router } from "express";
import { getAllApplications, updateApplicationStatus } from "../controllers/applicationController";

const router = Router();

router.get("/vendor/:vendorAccountID", getAllApplications);
router.put("/:bookingID/status", updateApplicationStatus);

export default router;