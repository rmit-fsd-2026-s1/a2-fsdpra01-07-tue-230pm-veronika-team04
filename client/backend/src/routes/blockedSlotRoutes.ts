import { Router } from "express";
import {
  createBlockedSlot,
  deactivateBlockedSlot,
  getBlockedSlotsByVenue,
} from "../controllers/blockedSlotController";

const router = Router();

router.get("/venue/:venueID", getBlockedSlotsByVenue);
router.post("/", createBlockedSlot);
router.patch("/:blockedSlotID/deactivate", deactivateBlockedSlot);

export default router;