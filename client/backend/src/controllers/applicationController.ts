import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../entity/Booking";
import { Venue } from "../entity/Venue";

function toPositiveInt(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) return null;
  return numberValue;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 5);
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  return "";
}

function mapBooking(booking: Booking) {
  return {
    bookingID: booking.bookingID,
    venueID: booking.venueID,
    venueName: booking.venue?.venueName || "",
    venueLocation: booking.venue?.location || "",
    hireAccountID: booking.accountID,
    eventName: booking.eventName,
    eventDate: formatDate(booking.eventDate),
    eventTime: formatTime(booking.eventTime),
    guestCount: booking.guestCount,
    duration: booking.duration,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    vendorComments: booking.vendorComments ?? null,
  };
}

// GET /applications/vendor/:vendorAccountID
// Returns all bookings for venues managed by this vendor
export async function getAllApplications(req: Request, res: Response): Promise<void> {
  try {
    const vendorAccountID = toPositiveInt(req.params.vendorAccountID);

    if (!vendorAccountID) {
      res.status(400).json({ message: "Invalid vendor account ID" });
      return;
    }

    // First find all venueIDs belonging to this vendor
    const venueRepository = AppDataSource.getRepository(Venue);
    const venues = await venueRepository.findBy({ vendorAccountID });
    const venueIDs = venues.map((v) => v.venueID);

    if (venueIDs.length === 0) {
      res.status(200).json({ message: "No applications found", bookings: [] });
      return;
    }

    const bookingRepository = AppDataSource.getRepository(Booking);
    const bookings = await bookingRepository
      .createQueryBuilder("booking")
      .leftJoinAndSelect("booking.venue", "venue")
      .where("booking.venueID IN (:...venueIDs)", { venueIDs })
      .orderBy("booking.createdAt", "DESC")
      .getMany();

    res.status(200).json({
      message: "Applications retrieved successfully",
      bookings: bookings.map(mapBooking),
    });
  } catch (error) {
    console.error("Get applications failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// PUT /applications/:bookingID/status
// Vendor updates status to approved/rejected, and optionally adds comments
export async function updateApplicationStatus(req: Request, res: Response): Promise<void> {
  try {
    const bookingID = toPositiveInt(req.params.bookingID);

    if (!bookingID) {
      res.status(400).json({ message: "Invalid booking ID" });
      return;
    }

    const { status, vendorComments } = req.body;

    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      return;
    }

    const bookingRepository = AppDataSource.getRepository(Booking);
    const booking = await bookingRepository.findOne({
      where: { bookingID },
      relations: { venue: true },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    if (booking.status !== "Pending") {
      res.status(400).json({ message: "Only pending applications can be reviewed" });
      return;
    }

    booking.status = status === "approved" ? "Accepted" : "Rejected";
    booking.vendorComments = typeof vendorComments === "string" && vendorComments.trim()
      ? vendorComments.trim()
      : null;

    const updatedBooking = await bookingRepository.save(booking);

    res.status(200).json({
      message: "Application status updated successfully",
      booking: mapBooking(updatedBooking),
    });
  } catch (error) {
    console.error("Update application status failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}