import { Router } from "express";
import {
  createAndUpdateVenue,
  getAllVenues,
  // getVenueByID,
  searchVenues,
  getVenueByVendorId,
} from "../controllers/venueController";

const router = Router();

router.get("/search", searchVenues);
// router.get("/:venueID", getVenueByID);
router.post("/", createAndUpdateVenue);
router.put("/:venueID", createAndUpdateVenue); // Reuse createAndUpdateVenue controller for updating since they have similar logic. 
                                      // The controller will check if the venueID exists to determine whether to create or update.
router.get("/", getAllVenues);
router.get("/vendor/:id", getVenueByVendorId);

export default router;
