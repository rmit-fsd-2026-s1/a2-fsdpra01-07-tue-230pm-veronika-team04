import { Router } from "express";
import {
  getUtilisationReport,
  getVendorSummaryReport,
} from "../controllers/visualDataController";

const router = Router();

router.get("/vendor/:vendorAccountID/summary", getVendorSummaryReport);
router.get("/vendor/:vendorAccountID/utilisation", getUtilisationReport);

export default router;
