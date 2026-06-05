export type BookingApplicationStatus = "Pending" | "Accepted" | "Rejected";

export type UpdateApplicationStatusPayload = {
  vendorAccountID: number;
  status: "Accepted" | "Rejected";
  rating: number;
  vendorComment: string;
};

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
  rating: number | null;
  vendorComment: string | null;
  vendorComments?: string | null;
  hirerAccountID?: number;
  hirerName?: string;
  hirerEmail?: string;
  hirerReputation?: number | null;
  complianceScore?: number | null;
  createdAt: string;
};
