import Image from "next/image";
import type { ReactNode } from "react";

import { Tag } from "@/components/ui/tag";
import { BACKEND_BASE_URL } from "@/services/api";
import type { Venue } from "@/types/venue";

type VenueCardProps = {
  venue: Venue;
  actions?: ReactNode;
  variant?: "default" | "summary";
  useChakraTags?: boolean;
};

function isImageFileName(value: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(value);
}

function getVenueImageSrc(image: string) {
  const imageValue = image.trim();

  if (!imageValue) {
    return null;
  }

  if (imageValue.startsWith("http")) {
    return imageValue;
  }

  if (imageValue.startsWith("/uploads")) {
    return `${BACKEND_BASE_URL}${imageValue}`;
  }

  // Legacy DB rows may still contain venue_1.jpg or /venue_1.jpg.
  if (isImageFileName(imageValue)) {
    return imageValue.startsWith("/")
      ? `${BACKEND_BASE_URL}/uploads/venues${imageValue}`
      : `${BACKEND_BASE_URL}/uploads/venues/${imageValue}`;
  }

  return null;
}

export default function VenueCard({
  venue,
  actions,
  variant = "default",
  useChakraTags = false,
}: VenueCardProps) {
  const isSummary = variant === "summary";
  const imageSrc = getVenueImageSrc(venue.image);
  const isBackendUploadImage =
    imageSrc?.startsWith(`${BACKEND_BASE_URL}/uploads/`) ?? false;
  const statusColor =
    venue.status === "available"
      ? "green"
      : "red";

  return (
    <article className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
      {imageSrc ? (
        <div className="relative h-52 w-full">
          <Image
            src={imageSrc}
            alt={venue.name}
            fill
            unoptimized={isBackendUploadImage}
            className="object-cover"
            sizes="(min-width: 1024px) 30vw, 100vw"
          />
        </div>
      ) : (
        <div className="flex h-52 w-full items-center justify-center bg-zinc-100 text-sm font-medium text-zinc-500">
          No image
        </div>
      )}

      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-zinc-950">{venue.name}</h3>
            <p className="mt-1 text-sm text-zinc-600">{venue.location}</p>
          </div>
          {useChakraTags ? (
            <Tag
              colorPalette={statusColor}
              size="sm"
              textTransform="uppercase"
              variant="subtle"
            >
              {venue.status}
            </Tag>
          ) : (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#095d44]">
              {venue.status}
            </span>
          )}
        </div>

        {!isSummary ? (
          <div className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <div>
              <span className="font-medium text-zinc-900">Capacity:</span>{" "}
              {venue.capacity}
            </div>
            <div>
              <span className="font-medium text-zinc-900">Price:</span>{" "}
              ${venue.price.toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-zinc-900">Best for:</span>{" "}
              {useChakraTags ? (
                <Tag colorPalette="teal" size="sm" variant="subtle">
                  {venue.recommendedSuitability}
                </Tag>
              ) : (
                venue.recommendedSuitability
              )}
            </div>
          </div>
        ) : null}

        <p className="text-sm font-semibold leading-6 text-zinc-600">{venue.description}</p>

        {!isSummary && actions ? <div className="pt-2">{actions}</div> : null}
      </div>
    </article>
  );
}
