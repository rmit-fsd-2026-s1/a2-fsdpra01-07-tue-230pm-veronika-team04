import { Router } from "express";
import {
  getUtilisationReport,
  getVendorReport,
  getVendorSummaryReport,
} from "../controllers/visualDataController";

const router = Router();

router.get("/vendor/:vendorAccountID/summary", getVendorSummaryReport);
router.get("/vendor/:vendorAccountID/utilisation", getUtilisationReport);
router.get("/vendor/:vendorAccountID", getVendorReport);

export default router;
