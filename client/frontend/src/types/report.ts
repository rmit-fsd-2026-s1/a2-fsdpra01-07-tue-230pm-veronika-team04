export type ReportPeriod =
  | "thisWeek"
  | "thisMonth"
  | "lastMonth"
  | "allTime";

export type TalliesByVenueItem = {
  venueID: number;
  venueName: string;
  hirerName: string;
  tally: number;
};

export type VendorReport = {
  period: ReportPeriod;
  talliesByVenue: TalliesByVenueItem[];
  combinedTallies: unknown[];
  activeHirers: unknown[];
  mostActiveHirer: unknown | null;
  leastActiveHirer: unknown | null;
  utilisation: unknown[];
};

export type VendorReportResponse = {
  message: string;
  report: VendorReport;
};
