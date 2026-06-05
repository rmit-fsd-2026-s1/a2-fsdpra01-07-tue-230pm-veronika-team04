import { Router } from "express";
import {
  addPreference,
  getPreferredVenues,
  removePreference,
  reorderPreferences,
} from "../controllers/venuePreferenceController";

const router = Router();

router.get("/hirer/:hireAccountID", getPreferredVenues);
router.post("/", addPreference);
router.patch("/reorder", reorderPreferences);
router.delete("/:hireAccountID/:venueID", removePreference);

export default router;
