import apiClient from "@/services/api";
import type {
  BookingApplication,
  CreateBookingPayload,
} from "@/types/booking";

type CreateBookingResponse = {
  message: string;
  booking: BookingApplication;
};

type BookingHistoryResponse = {
  message: string;
  bookings: BookingApplication[];
};

export const bookingApi = {
  createBooking: (payload: CreateBookingPayload) =>
    apiClient.post<CreateBookingResponse>("/bookings", payload),
  getHirerBookingHistory: (hireAccountID: string | number) =>
    apiClient.get<BookingHistoryResponse>(`/bookings/hirer/${hireAccountID}`),
};
