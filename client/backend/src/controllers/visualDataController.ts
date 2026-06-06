import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../entity/Booking";
import { VendorAccount } from "../entity/VendorAccount";
import { Venue } from "../entity/Venue";

type ReportPeriod = "thisWeek" | "thisMonth" | "lastMonth" | "allTime";

type PeriodRange = {
  startDate: Date | null;
  endDate: Date | null;
};

type VenueTallyItem = {
  venueID: number;
  venueName: string;
  hirerName: string;
  tally: number;
};

type CombinedTallyItem = {
  hirerName: string;
  venueName: string;
  tally: number;
};

type ActiveHirerItem = {
  hirerName: string;
  tally: number;
};

type UtilisationItem = {
  date: string;
  utilisationPercent: number;
  activeVenueCount: number;
  totalVenueCount: number;
};

const allowedPeriods: ReportPeriod[] = [
  "thisWeek",
  "thisMonth",
  "lastMonth",
  "allTime",
];

// Parses a route parameter into a positive integer and returns null when invalid.
function parsePositiveInteger(value: unknown): number | null {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

// Gets the selected report period, or uses thisMonth when no period is given.
function getReportPeriod(value: unknown): ReportPeriod | null {
  if (value === undefined) {
    return "thisMonth";
  }

  if (typeof value !== "string") {
    return null;
  }

  if (!allowedPeriods.includes(value as ReportPeriod)) {
    return null;
  }

  return value as ReportPeriod;
}

// Converts a report period into a date range for filtering bookings.
function getPeriodRange(period: ReportPeriod): PeriodRange {
  const today = new Date();

  if (period === "allTime") {
    return { startDate: null, endDate: null };
  }

  if (period === "thisWeek") {
    const dayOfWeek = today.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - daysSinceMonday,
    );
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + 6,
    );

    return { startDate, endDate };
  }

  if (period === "lastMonth") {
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0);

    return { startDate, endDate };
  }

  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return { startDate, endDate };
}

// Formats a Date or date string into YYYY-MM-DD for grouping report data.
function formatDateKey(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

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

// Checks whether a booking date is inside the selected report period.
function isDateInRange(
  eventDate: Date | string | null | undefined,
  range: PeriodRange,
): boolean {
  const eventDateKey = formatDateKey(eventDate);

  if (!eventDateKey) {
    return false;
  }

  const startDateKey = range.startDate ? formatDateKey(range.startDate) : null;
  const endDateKey = range.endDate ? formatDateKey(range.endDate) : null;

  if (startDateKey && eventDateKey < startDateKey) {
    return false;
  }

  if (endDateKey && eventDateKey > endDateKey) {
    return false;
  }

  return true;
}

// Builds a readable hirer name from the booking's hirer account user relation.
function getHirerDisplayName(booking: Booking): string {
  const user = booking.hirerAccount?.user;
  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "";

  return fullName || user?.email || `Hirer ${booking.accountID}`;
}

// Gets a readable venue name from the booking relation.
function getVenueName(booking: Booking): string {
  return booking.venue?.venueName || `Venue ${booking.venueID}`;
}

// Builds data for the bar chart grouped by venue and hirer.
function buildTalliesByVenue(bookings: Booking[]): VenueTallyItem[] {
  const tallyMap = new Map<string, VenueTallyItem>();

  bookings.forEach((booking) => {
    const venueName = getVenueName(booking);
    const hirerName = getHirerDisplayName(booking);
    const key = `${booking.venueID}:${booking.accountID}`;
    const current = tallyMap.get(key);

    if (current) {
      current.tally += 1;
      return;
    }

    tallyMap.set(key, {
      venueID: booking.venueID,
      venueName,
      hirerName,
      tally: 1,
    });
  });

  return Array.from(tallyMap.values()).sort((a, b) => {
    const venueCompare = a.venueName.localeCompare(b.venueName);

    if (venueCompare !== 0) {
      return venueCompare;
    }

    if (b.tally !== a.tally) {
      return b.tally - a.tally;
    }

    return a.hirerName.localeCompare(b.hirerName);
  });
}

// Builds data for the stacked bar chart grouped by hirer and venue.
function buildCombinedTallies(bookings: Booking[]): CombinedTallyItem[] {
  const tallyMap = new Map<string, CombinedTallyItem>();

  bookings.forEach((booking) => {
    const hirerName = getHirerDisplayName(booking);
    const venueName = getVenueName(booking);
    const key = `${booking.accountID}:${booking.venueID}`;
    const current = tallyMap.get(key);

    if (current) {
      current.tally += 1;
      return;
    }

    tallyMap.set(key, {
      hirerName,
      venueName,
      tally: 1,
    });
  });

  return Array.from(tallyMap.values()).sort((a, b) => {
    const hirerCompare = a.hirerName.localeCompare(b.hirerName);

    if (hirerCompare !== 0) {
      return hirerCompare;
    }

    return a.venueName.localeCompare(b.venueName);
  });
}

// Builds data for the pie chart and finds the most/least active hirers.
function buildActiveHirers(bookings: Booking[]) {
  const tallyMap = new Map<string, ActiveHirerItem>();

  bookings.forEach((booking) => {
    const hirerName = getHirerDisplayName(booking);
    const key = String(booking.accountID);
    const current = tallyMap.get(key);

    if (current) {
      current.tally += 1;
      return;
    }

    tallyMap.set(key, {
      hirerName,
      tally: 1,
    });
  });

  const activeHirers = Array.from(tallyMap.values())
    .filter((item) => item.tally > 0)
    .sort((a, b) => {
      if (b.tally !== a.tally) {
        return b.tally - a.tally;
      }

      return a.hirerName.localeCompare(b.hirerName);
    });

  let leastActiveHirer: ActiveHirerItem | null = null;

  activeHirers.forEach((hirer) => {
    if (!leastActiveHirer) {
      leastActiveHirer = hirer;
      return;
    }

    const hasLowerTally = hirer.tally < leastActiveHirer.tally;
    const hasSameTallyAndEarlierName =
      hirer.tally === leastActiveHirer.tally &&
      hirer.hirerName.localeCompare(leastActiveHirer.hirerName) < 0;

    if (hasLowerTally || hasSameTallyAndEarlierName) {
      leastActiveHirer = hirer;
    }
  });

  return {
    activeHirers,
    mostActiveHirer: activeHirers[0] || null,
    leastActiveHirer,
  };
}

// Builds data for the line chart showing venue utilisation by date.
function buildUtilisation(
  bookings: Booking[],
  totalVenueCount: number,
): UtilisationItem[] {
  const activeVenueIDsByDate = new Map<string, Set<number>>();

  bookings.forEach((booking) => {
    const dateKey = formatDateKey(booking.eventDate);

    if (!dateKey) {
      return;
    }

    const venueIDs = activeVenueIDsByDate.get(dateKey) || new Set<number>();
    venueIDs.add(booking.venueID);
    activeVenueIDsByDate.set(dateKey, venueIDs);
  });

  // TODO: More precise utilisation could use event start/end intervals if required.
  return Array.from(activeVenueIDsByDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, venueIDs]) => {
      const activeVenueCount = venueIDs.size;
      const utilisationPercent =
        totalVenueCount === 0
          ? 0
          : Math.round((activeVenueCount / totalVenueCount) * 1000) / 10;

      const utilisationItem: UtilisationItem = {
        date,
        utilisationPercent,
        activeVenueCount,
        totalVenueCount,
      };

      return utilisationItem;
    });
}

// Builds an empty report when the vendor has no venues.
function buildEmptyReport(period: ReportPeriod) {
  return {
    period,
    talliesByVenue: [],
    combinedTallies: [],
    activeHirers: [],
    mostActiveHirer: null,
    leastActiveHirer: null,
    utilisation: [],
  };
}

// Gets all visual summary data for one vendor from accepted bookings.
export async function getVendorReport(req: Request, res: Response): Promise<void> {
  try {
    const vendorAccountID = parsePositiveInteger(req.params.vendorAccountID);
    const period = getReportPeriod(req.query.period);

    if (!vendorAccountID) {
      res.status(400).json({ message: "Invalid vendorAccountID" });
      return;
    }

    if (!period) {
      res.status(400).json({ message: "Invalid report period" });
      return;
    }

    const vendorAccountRepository = AppDataSource.getRepository(VendorAccount);
    const vendorAccount = await vendorAccountRepository.findOneBy({
      vendorAccountID,
    });

    if (!vendorAccount) {
      res.status(404).json({ message: "Vendor account not found" });
      return;
    }

    const venueRepository = AppDataSource.getRepository(Venue);
    const venues = await venueRepository.findBy({ vendorAccountID });
    const venueIDs = venues.map((venue) => venue.venueID);

    if (venueIDs.length === 0) {
      res.status(200).json({
        message: "Vendor report retrieved successfully",
        report: buildEmptyReport(period),
      });
      return;
    }

    const bookingRepository = AppDataSource.getRepository(Booking);
    const bookings = await bookingRepository
      .createQueryBuilder("booking")
      .leftJoinAndSelect("booking.venue", "venue")
      .leftJoinAndSelect("booking.hirerAccount", "hirerAccount")
      .leftJoinAndSelect("hirerAccount.user", "user")
      .where("booking.venueID IN (:...venueIDs)", { venueIDs })
      .andWhere("booking.status = :status", { status: "Accepted" })
      .orderBy("booking.eventDate", "ASC")
      .getMany();

    const periodRange = getPeriodRange(period);
    const filteredBookings = bookings.filter((booking) =>
      isDateInRange(booking.eventDate, periodRange),
    );
    const activeHirerReport = buildActiveHirers(filteredBookings);

    res.status(200).json({
      message: "Vendor report retrieved successfully",
      report: {
        period,
        talliesByVenue: buildTalliesByVenue(filteredBookings),
        combinedTallies: buildCombinedTallies(filteredBookings),
        activeHirers: activeHirerReport.activeHirers,
        mostActiveHirer: activeHirerReport.mostActiveHirer,
        leastActiveHirer: activeHirerReport.leastActiveHirer,
        utilisation: buildUtilisation(filteredBookings, venues.length),
      },
    });
  } catch (error) {
    console.error("Get vendor report failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}
