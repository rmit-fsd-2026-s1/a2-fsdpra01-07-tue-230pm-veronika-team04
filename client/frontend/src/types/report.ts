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

export type UtilisationItem = {
  date: string;
  utilisationPercent: number;
  activeVenueCount: number;
  totalVenueCount: number;
};

export type VendorSummaryReport = {
  talliesByVenue: TalliesByVenueItem[];
  combinedTallies: CombinedTallyItem[];
  activeHirers: ActiveHirerItem[];
  mostActiveHirer: ActiveHirerItem | null;
  leastActiveHirer: ActiveHirerItem | null;
};

export type VendorUtilisationReport = {
  period: ReportPeriod;
  utilisation: UtilisationItem[];
};

export type VendorSummaryReportResponse = {
  message: string;
  report: VendorSummaryReport;
};

export type VendorUtilisationReportResponse = {
  message: string;
  report: VendorUtilisationReport;
};
