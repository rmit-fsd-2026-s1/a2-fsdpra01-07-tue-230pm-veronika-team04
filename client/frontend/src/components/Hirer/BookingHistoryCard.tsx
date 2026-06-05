import { Badge, HStack } from "@chakra-ui/react";
import { FaStar } from "react-icons/fa";

import { Rating } from "@/components/ui/rating";
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
          {/* Hirers can view the vendor review, but cannot edit it here. */}
          <div>
            <HStack gap={2} align="center">
              <span className="font-medium text-zinc-900">Rating:</span>
              <Rating
                readOnly
                size="sm"
                value={booking.rating ?? 0}
                icon={<FaStar />}
              />
              <span>
                {booking.rating == null ? "Not rated yet" : `${booking.rating} / 5`}
              </span>
            </HStack>
          </div>
          <p>
            <span className="font-medium text-zinc-900">Vendor comment:</span>{" "}
            {booking.vendorComment?.trim() || "No comment yet"}
          </p>
        </div>
      </div>
    </article>
  );
}
