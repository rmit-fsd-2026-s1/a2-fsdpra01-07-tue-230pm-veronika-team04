import { Badge } from "@chakra-ui/react";

import type { BookingApplication, BookingApplicationStatus } from "@/types/booking";

type BookingHistoryCardProps = {
  booking: BookingApplication;
};

function getStatusColor(status: BookingApplicationStatus) {
  if (status === "Accepted") {
    return "green";
  }

  if (status === "Rejected") {
    return "red";
  }

  return "yellow";
}

function formatSubmittedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function BookingHistoryCard({ booking }: BookingHistoryCardProps) {
  return (
    <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-zinc-950">
              {booking.eventName}
            </h3>
            <p className="text-sm text-zinc-600">{booking.venueName}</p>
          </div>
          <Badge colorPalette={getStatusColor(booking.status)} variant="subtle">
            {booking.status}
          </Badge>
        </div>

        <div className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
          <p>
            <span className="font-medium text-zinc-900">Location:</span>{" "}
            {booking.venueLocation}
          </p>
          <p>
            <span className="font-medium text-zinc-900">Date:</span>{" "}
            {booking.eventDate}
          </p>
          <p>
            <span className="font-medium text-zinc-900">Time:</span>{" "}
            {booking.eventTime}
          </p>
          <p>
            <span className="font-medium text-zinc-900">Guests:</span>{" "}
            {booking.guestCount}
          </p>
          <p>
            <span className="font-medium text-zinc-900">Duration:</span>{" "}
            {booking.duration} {booking.duration === 1 ? "hour" : "hours"}
          </p>
          <p>
            <span className="font-medium text-zinc-900">Submitted:</span>{" "}
            {formatSubmittedDate(booking.createdAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
