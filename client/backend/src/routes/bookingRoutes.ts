import { Router } from "express";
import {
  createBooking,
  getHirerBookingHistory,
} from "../controllers/bookingController";

const router = Router();

router.get("/hirer/:hireAccountID", getHirerBookingHistory);
router.post("/", createBooking);

export default router;
