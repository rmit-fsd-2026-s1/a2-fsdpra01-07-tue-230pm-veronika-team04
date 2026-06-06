import { Router } from "express";
import { getVendorReport } from "../controllers/visualDataController";

const router = Router();

router.get("/vendor/:vendorAccountID", getVendorReport);

export default router;
