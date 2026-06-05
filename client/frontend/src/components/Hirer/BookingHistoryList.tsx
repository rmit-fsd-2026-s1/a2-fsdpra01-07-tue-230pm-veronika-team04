import BookingHistoryCard from "@/components/Hirer/BookingHistoryCard";
import type { BookingApplication } from "@/types/booking";

type BookingHistoryListProps = {
  bookings: BookingApplication[];
  isLoading?: boolean;
  error?: string;
};

export default function BookingHistoryList({
  bookings,
  isLoading = false,
  error = "",
}: BookingHistoryListProps) {
  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading booking history...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        No booking requests submitted yet.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {bookings.map((booking) => (
        <BookingHistoryCard key={booking.bookingID} booking={booking} />
      ))}
    </div>
  );
}
