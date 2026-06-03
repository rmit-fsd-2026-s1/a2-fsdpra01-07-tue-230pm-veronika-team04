import { Router } from "express";
import {
  getAllVenues,
  // getVenueByID,
  searchVenues,
} from "../controllers/venueController";

const router = Router();

router.get("/search", searchVenues);
// router.get("/:venueID", getVenueByID);
router.get("/", getAllVenues);

export default router;
