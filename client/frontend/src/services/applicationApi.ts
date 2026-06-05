import apiClient from "./api";
import type { BookingApplication } from "@/types/booking";

type ApplicationResponse = {
  message: string;
  booking: BookingApplication;
};

export const applicationApi = {
    getAllBookingApplications: (vendorAccountID: string | number) =>
        apiClient.get<{ message: string; bookings: BookingApplication[] }>(
            `/applications/vendor/${vendorAccountID}`,
        ),
    updateBookingApplication: (bookingID: string | number, status: "approved" | "rejected", vendorComments?: string) =>
        apiClient.put<ApplicationResponse>(`/applications/${bookingID}/status`, { status, vendorComments }),
};