import apiClient from "./api";
import type { ReportPeriod, VendorReportResponse } from "@/types/report";

export const reportApi = {
  getVendorReport: (vendorAccountID: number, period: ReportPeriod) =>
    apiClient.get<VendorReportResponse>(
      `/reports/vendor/${vendorAccountID}`,
      {
        params: { period },
      },
    ),
};
