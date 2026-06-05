export type BookingApplicationStatus = "Pending" | "Accepted" | "Rejected";

export type CreateBookingPayload = {
  hireAccountID: number;
  venueID: number;
  eventName: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  duration: number;
};

export type BookingApplication = {
  bookingID: number;
  venueID: number;
  venueName: string;
  venueLocation: string;
  hireAccountID: number;
  eventName: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  duration: number;
  status: BookingApplicationStatus;
  createdAt: string;
  vendorComments: string | null;
};
