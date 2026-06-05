import apiClient from "./api";
import type {
  BookingApplication,
  UpdateApplicationStatusPayload,
} from "@/types/booking";

type ApplicationResponse = {
  message: string;
  booking: BookingApplication;
  hirerReputation: number;
};

export const applicationApi = {
    getAllBookingApplications: (vendorAccountID: string | number) =>
        apiClient.get<{ message: string; bookings: BookingApplication[] }>(
            `/applications/vendor/${vendorAccountID}`,
        ),
    updateBookingApplication: (
        bookingID: string | number,
        payload: UpdateApplicationStatusPayload,
    ) =>
        // The backend uses this status route for the whole vendor review.
        apiClient.put<ApplicationResponse>(`/applications/${bookingID}/status`, payload),
};
