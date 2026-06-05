import { Router } from "express";
import {
  createVenue,
  updateVenue,
  getAllVenues,
  getSuitabilityTags,
  searchVenues,
  getVenueByVendorId,
  deleteVenue
} from "../controllers/venueController";

const router = Router();

router.get("/suitability-tags", getSuitabilityTags);
router.get("/search", searchVenues);
// router.get("/:venueID", getVenueByID);
router.post("/", createVenue);
router.put("/:venueID", updateVenue);
router.get("/", getAllVenues);
router.get("/vendor/:id", getVenueByVendorId);
router.delete("/:venueID", deleteVenue);

export default router;
