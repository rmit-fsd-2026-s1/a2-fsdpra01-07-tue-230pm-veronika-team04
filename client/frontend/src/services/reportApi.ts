import apiClient from "./api";
import type {
  ReportPeriod,
  VendorSummaryReportResponse,
  VendorUtilisationReportResponse,
} from "@/types/report";

export const reportApi = {
  getVendorSummaryReport: (vendorAccountID: number) =>
    apiClient.get<VendorSummaryReportResponse>(
      `/reports/vendor/${vendorAccountID}/summary`,
    ),

  getUtilisationReport: (vendorAccountID: number, period: ReportPeriod) =>
    apiClient.get<VendorUtilisationReportResponse>(
      `/reports/vendor/${vendorAccountID}/utilisation`,
      {
        params: { period },
      },
    ),
};
