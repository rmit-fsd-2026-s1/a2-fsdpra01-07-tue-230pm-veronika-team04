import { Router } from "express";
import {
  downloadDocument,
  getDocuments,
  removeDocument,
  updateAbn,
  updateApplyAsBusiness,
  uploadDocument,
} from "../controllers/documentController";
import { upload } from "../config/multerconfig";

const router = Router();

router.get("/:hireAccountID", getDocuments);
router.get("/:hireAccountID/download/:field", downloadDocument);
router.post("/:hireAccountID/upload/:field", upload.single("file"), uploadDocument);
router.delete("/:hireAccountID/remove/:field", removeDocument);
router.patch("/:hireAccountID/abn", updateAbn);
router.patch("/:hireAccountID/business", updateApplyAsBusiness);

export default router;