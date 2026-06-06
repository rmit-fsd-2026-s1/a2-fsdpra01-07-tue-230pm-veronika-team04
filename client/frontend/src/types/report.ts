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

export type CombinedTallyItem = {
  hirerName: string;
  venueName: string;
  tally: number;
};

export type ActiveHirerItem = {
  hirerName: string;
  tally: number;
};

export type VendorReport = {
  period: ReportPeriod;
  talliesByVenue: TalliesByVenueItem[];
  combinedTallies: CombinedTallyItem[];
  activeHirers: ActiveHirerItem[];
  mostActiveHirer: ActiveHirerItem | null;
  leastActiveHirer: ActiveHirerItem | null;
  utilisation: unknown[];
};

export type VendorReportResponse = {
  message: string;
  report: VendorReport;
};
