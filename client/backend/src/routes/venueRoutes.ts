import { Router } from "express";
import {
  createVenue,
  getAllVenues,
  // getVenueByID,
  searchVenues,
  getVenueByVendorId,
} from "../controllers/venueController";

const router = Router();

router.get("/search", searchVenues);
// router.get("/:venueID", getVenueByID);
router.post("/", createVenue);
router.get("/", getAllVenues);
router.get("/vendor/:id", getVenueByVendorId);

export default router;
