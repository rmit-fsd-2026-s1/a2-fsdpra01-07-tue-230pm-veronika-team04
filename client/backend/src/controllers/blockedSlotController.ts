import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { BlockedSlot } from "../entity/BlockedSlot";
import { Venue } from "../entity/Venue";
import { Booking } from "../entity/Booking";

function toPositiveInt(value: unknown) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function mapBlockedSlot(slot: BlockedSlot) {
  return {
    blockedSlotID: slot.blockedSlotID,
    venueID: slot.venueID,
    startDateTime: slot.startDateTime.toISOString(),
    endDateTime: slot.endDateTime.toISOString(),
    reason: slot.reason ?? null,
    isActive: slot.isActive,
  };
}

// GET /blocked-slots/venue/:venueID
export async function getBlockedSlotsByVenue(req: Request, res: Response): Promise<void> {
  try {
    const venueID = toPositiveInt(req.params.venueID);
    if (!venueID) {
      res.status(400).json({ message: "Invalid venue ID" });
      return;
    }

    const repo = AppDataSource.getRepository(BlockedSlot);
    const slots = await repo.find({
      where: { venueID },
      order: { startDateTime: "DESC" },
    });

    res.status(200).json({
      message: "Blocked slots retrieved successfully",
      blockedSlots: slots.map(mapBlockedSlot),
    });
  } catch (error) {
    console.error("Get blocked slots failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// POST /blocked-slots
export async function createBlockedSlot(req: Request, res: Response): Promise<void> {
  try {
    const venueID = toPositiveInt(req.body.venueID);
    const date = typeof req.body.date === "string" ? req.body.date.trim() : "";
    const startTime = typeof req.body.startTime === "string" ? req.body.startTime.trim() : "";
    const endTime = typeof req.body.endTime === "string" ? req.body.endTime.trim() : "";
    const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : null;

    if (!venueID) {
      res.status(400).json({ message: "Invalid venue ID" });
      return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ message: "Date is required (YYYY-MM-DD)" });
      return;
    }

    if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
      res.status(400).json({ message: "Start time is required (HH:mm)" });
      return;
    }

    if (!endTime || !/^\d{2}:\d{2}$/.test(endTime)) {
      res.status(400).json({ message: "End time is required (HH:mm)" });
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      res.status(400).json({ message: "Invalid date or time" });
      return;
    }

    if (endDateTime <= startDateTime) {
      res.status(400).json({ message: "End time must be after start time" });
      return;
    }

    const venueRepo = AppDataSource.getRepository(Venue);
    const venue = await venueRepo.findOneBy({ venueID });
    if (!venue) {
      res.status(404).json({ message: "Venue not found" });
      return;
    }

    // Reject any pending bookings that overlap this blocked slot on the same venue
    const bookingRepo = AppDataSource.getRepository(Booking);
    const overlappingBookings = await bookingRepo
      .createQueryBuilder("booking")
      .where("booking.venueID = :venueID", { venueID })
      .andWhere("booking.status = :status", { status: "Pending" })
      .andWhere("booking.eventDate = :date", { date: new Date(`${date}T00:00:00`) })
      .getMany();

    for (const booking of overlappingBookings) {
      // booking.eventTime is the start, booking.duration is hours
      const bookingStart = new Date(booking.eventTime);
      const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60 * 60 * 1000);

      const overlaps = bookingStart < endDateTime && bookingEnd > startDateTime;
      if (overlaps) {
        booking.status = "Rejected";
        await bookingRepo.save(booking);
      }
    }

    const slotRepo = AppDataSource.getRepository(BlockedSlot);
    const slot = slotRepo.create({
      venueID,
      startDateTime,
      endDateTime,
      reason: reason || null,
      isActive: true,
    });

    const saved = await slotRepo.save(slot);

    res.status(201).json({
      message: "Blocked slot created successfully",
      blockedSlot: mapBlockedSlot(saved),
    });
  } catch (error) {
    console.error("Create blocked slot failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// PATCH /blocked-slots/:blockedSlotID/deactivate
export async function deactivateBlockedSlot(req: Request, res: Response): Promise<void> {
  try {
    const blockedSlotID = toPositiveInt(req.params.blockedSlotID);
    if (!blockedSlotID) {
      res.status(400).json({ message: "Invalid blocked slot ID" });
      return;
    }

    const repo = AppDataSource.getRepository(BlockedSlot);
    const slot = await repo.findOneBy({ blockedSlotID });

    if (!slot) {
      res.status(404).json({ message: "Blocked slot not found" });
      return;
    }

    slot.isActive = false;
    const saved = await repo.save(slot);

    res.status(200).json({
      message: "Blocked slot deactivated successfully",
      blockedSlot: mapBlockedSlot(saved),
    });
  } catch (error) {
    console.error("Deactivate blocked slot failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}