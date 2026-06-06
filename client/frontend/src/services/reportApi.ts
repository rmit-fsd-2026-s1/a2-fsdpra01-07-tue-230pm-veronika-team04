import apiClient from "./api";
import type { ReportPeriod, VendorReportResponse } from "@/types/report";

const change2ReportPeriod: ReportPeriod = "allTime";

export const reportApi = {
  getVendorReport: (vendorAccountID: number) =>
    apiClient.get<VendorReportResponse>(
      `/reports/vendor/${vendorAccountID}`,
      {
        params: { period: change2ReportPeriod },
      },
    ),
};
