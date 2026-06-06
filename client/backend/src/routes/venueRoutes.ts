import { Router } from "express";
import {
  createVenue,
  updateVenue,
  getAllVenues,
  getSuitabilityTags,
  searchVenues,
  getVenueByVendorId,
  deleteVenue,
  uploadVenueImageForVenue,
} from "../controllers/venueController";
import { uploadVenueImage } from "../config/multerConfig";

const router = Router();

router.get("/suitability-tags", getSuitabilityTags);
router.get("/search", searchVenues);
// router.get("/:venueID", getVenueByID);
router.post("/", createVenue);
router.post("/:venueID/image", uploadVenueImage.single("file"), uploadVenueImageForVenue);
router.put("/:venueID", updateVenue);
router.get("/", getAllVenues);
router.get("/vendor/:id", getVenueByVendorId);
router.delete("/:venueID", deleteVenue);

export default router;
