import apiClient from "@/services/api";
import type {
  BookingApplication,
  CreateBookingPayload,
} from "@/types/booking";

type CreateBookingResponse = {
  message: string;
  booking: BookingApplication;
};

export const bookingApi = {
  createBooking: (payload: CreateBookingPayload) =>
    apiClient.post<CreateBookingResponse>("/bookings", payload),
};
