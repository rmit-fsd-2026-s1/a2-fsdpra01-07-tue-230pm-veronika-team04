import { Request, Response } from "express";
import { IsNull, Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { Booking } from "../entity/Booking";
import { HirerAccount } from "../entity/HirerAccount";
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

function getOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function getRating(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const rating = Number(value);

  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return null;
  }

  return rating;
}

function getReviewStatus(value: unknown): "Accepted" | "Rejected" | null {
  // Accept both frontend labels and older lowercase values from early testing.
  if (value === "Accepted" || value === "approved") {
    return "Accepted";
  }

  if (value === "Rejected" || value === "rejected") {
    return "Rejected";
  }

  return null;
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return "";
}

function mapBooking(booking: Booking) {
  const hirerUser = booking.hirerAccount?.user;
  const hirerName = hirerUser
    ? `${hirerUser.firstName} ${hirerUser.lastName}`.trim()
    : "";

  return {
    bookingID: booking.bookingID,
    venueID: booking.venueID,
    venueName: booking.venue?.venueName || "",
    venueLocation: booking.venue?.location || "",
    hireAccountID: booking.accountID,
    hirerAccountID: booking.accountID,
    hirerName,
    hirerEmail: hirerUser?.email || "",
    hirerReputation: booking.hirerAccount?.reputation ?? null,
    complianceScore: booking.hirerAccount?.complianceScore ?? null,
    eventName: booking.eventName,
    eventDate: formatDate(booking.eventDate),
    eventTime: formatTime(booking.eventTime),
    guestCount: booking.guestCount,
    duration: booking.duration,
    status: booking.status,
    rating: booking.rating ?? null,
    vendorComment: booking.vendorComment ?? null,
    vendorComments: booking.vendorComments ?? null,
    createdAt: formatDateTime(booking.createdAt),
  };
}

async function recalculateHirerReputation(hireAccountID: number): Promise<number> {
  const bookingRepository = AppDataSource.getRepository(Booking);
  const hirerAccountRepository = AppDataSource.getRepository(HirerAccount);

  // Only completed vendor ratings should affect the hirer's reputation.
  const ratedBookings = await bookingRepository.find({
    where: {
      accountID: hireAccountID,
      rating: Not(IsNull()),
    },
  });

  const ratings = ratedBookings
    .map((booking) => Number(booking.rating))
    .filter((rating) => Number.isFinite(rating));

  const average =
    ratings.length === 0
      ? 0
      // Keep one decimal place so profile/rating displays stay readable.
      : Math.round(
          (ratings.reduce((total, rating) => total + rating, 0) /
            ratings.length) *
            10,
        ) / 10;

  const hirerAccount = await hirerAccountRepository.findOneBy({
    hireAccountID,
  });

  if (hirerAccount) {
    hirerAccount.reputation = average;
    await hirerAccountRepository.save(hirerAccount);
  }

  return average;
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
      .leftJoinAndSelect("booking.hirerAccount", "hirerAccount")
      .leftJoinAndSelect("hirerAccount.user", "user")
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
// A vendor review updates status, rating, and comment in one editable action.
export async function updateApplicationStatus(req: Request, res: Response): Promise<void> {
  try {
    const bookingID = toPositiveInt(req.params.bookingID);
    const vendorAccountID = toPositiveInt(req.body.vendorAccountID);
    const status = getReviewStatus(req.body.status);
    const rating = getRating(req.body.rating);
    const vendorComment = getOptionalString(req.body.vendorComment);

    if (!bookingID) {
      res.status(400).json({ message: "Invalid booking ID" });
      return;
    }

    if (!vendorAccountID) {
      res.status(400).json({ message: "Invalid vendor account ID" });
      return;
    }

    if (!status) {
      res.status(400).json({ message: "Status must be 'Accepted' or 'Rejected'" });
      return;
    }

    if (rating === null) {
      res.status(400).json({ message: "Rating must be between 0 and 5" });
      return;
    }

    const bookingRepository = AppDataSource.getRepository(Booking);
    const booking = await bookingRepository.findOne({
      where: { bookingID },
      relations: {
        venue: true,
        hirerAccount: {
          user: true,
        },
      },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Prevent one vendor from reviewing an application for another vendor's venue.
    if (booking.venue.vendorAccountID !== vendorAccountID) {
      res.status(403).json({ message: "Vendor does not own this booking venue" });
      return;
    }

    booking.status = status;
    booking.rating = rating;
    booking.vendorComment = vendorComment;

    const updatedBooking = await bookingRepository.save(booking);
    updatedBooking.venue = booking.venue;
    updatedBooking.hirerAccount = booking.hirerAccount;

    // Recalculate from all rated bookings, not just this one review.
    const hirerReputation = await recalculateHirerReputation(booking.accountID);
    updatedBooking.hirerAccount.reputation = hirerReputation;

    res.status(200).json({
      message: "Application status updated successfully",
      booking: mapBooking(updatedBooking),
      hirerReputation,
    });
  } catch (error) {
    console.error("Update application status failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}
