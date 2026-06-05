import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../entity/Booking";
import { HirerAccount } from "../entity/HirerAccount";
import { Venue } from "../entity/Venue";

function toPositiveInt(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

function getRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDateText(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeText(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  // MSSQL date columns may come back as "YYYY-MM-DD" strings.
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return "";
}

function formatTime(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  // MSSQL time/datetime values may come back as "HH:mm:ss" strings.
  if (typeof value === "string") {
    return value.slice(0, 5);
  }

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
  };
}

export async function createBooking(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.body.hireAccountID);
    const venueID = toPositiveInt(req.body.venueID);
    const eventName = getRequiredString(req.body.eventName);
    const eventDate = getRequiredString(req.body.eventDate);
    const eventTime = getRequiredString(req.body.eventTime);
    const guestCount = toPositiveInt(req.body.guestCount);
    const duration = toPositiveInt(req.body.duration);

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    if (!venueID) {
      res.status(400).json({ message: "Invalid venueID" });
      return;
    }

    if (!eventName) {
      res.status(400).json({ message: "Event name is required" });
      return;
    }

    if (!eventDate || !isDateText(eventDate)) {
      res.status(400).json({ message: "Event date is required" });
      return;
    }

    if (!eventTime || !isTimeText(eventTime)) {
      res.status(400).json({ message: "Event time is required" });
      return;
    }

    if (!guestCount) {
      res.status(400).json({ message: "Guest count must be a positive whole number" });
      return;
    }

    if (!duration) {
      res.status(400).json({ message: "Duration must be a positive whole number" });
      return;
    }

    const hirerAccountRepository = AppDataSource.getRepository(HirerAccount);
    const hirerAccount = await hirerAccountRepository.findOneBy({
      hireAccountID,
    });

    if (!hirerAccount) {
      res.status(404).json({ message: "Hirer account not found" });
      return;
    }

    const venueRepository = AppDataSource.getRepository(Venue);
    const venue = await venueRepository.findOneBy({ venueID });

    if (!venue) {
      res.status(404).json({ message: "Venue not found" });
      return;
    }

    if (venue.status !== "available") {
      res.status(400).json({ message: "Venue is not available" });
      return;
    }

    if (guestCount > venue.capacity) {
      res.status(400).json({ message: "Guest count cannot exceed venue capacity" });
      return;
    }

    // TODO: Check duplicate booking for the same venue/date/time.
    // TODO: Check blocked slot conflicts before accepting the request.

    const bookingRepository = AppDataSource.getRepository(Booking);
    const booking = bookingRepository.create({
      venueID,
      accountID: hireAccountID,
      eventName,
      eventDate: new Date(`${eventDate}T00:00:00`),
      eventTime: new Date(`${eventDate}T${eventTime}:00`),
      guestCount,
      duration,
      status: "Pending",
    });

    const savedBooking = await bookingRepository.save(booking);
    savedBooking.venue = venue;

    res.status(201).json({
      message: "Booking request submitted successfully",
      booking: mapBooking(savedBooking),
    });
  } catch (error) {
    console.error("Create booking failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}

export async function getHirerBookingHistory(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    const hirerAccountRepository = AppDataSource.getRepository(HirerAccount);
    const hirerAccount = await hirerAccountRepository.findOneBy({
      hireAccountID,
    });

    if (!hirerAccount) {
      res.status(404).json({ message: "Hirer account not found" });
      return;
    }

    const bookingRepository = AppDataSource.getRepository(Booking);
    const bookings = await bookingRepository.find({
      where: { accountID: hireAccountID },
      relations: {
        venue: true,
      },
      order: {
        createdAt: "DESC",
      },
    });

    res.status(200).json({
      message: "Booking history retrieved successfully",
      bookings: bookings.map(mapBooking),
    });
  } catch (error) {
    console.error("Get booking history failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}
