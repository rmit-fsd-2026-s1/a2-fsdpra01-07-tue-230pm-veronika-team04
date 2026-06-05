import { Button } from "@chakra-ui/react";

import VenueCard from "@/components/VenueCard";
import type { PreferredVenue } from "@/types/venuePreference";

type PreferredVenueCardProps = {
  venue: PreferredVenue;
  rank: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onApply?: () => void;
};

export default function PreferredVenueCard({
  venue,
  rank,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onApply,
}: PreferredVenueCardProps) {
  return (
    <VenueCard
      venue={venue}
      useChakraTags
      actions={
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[#095d44]">
            Your favourite #{rank}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              size="sm"
              variant={isFirst ? "subtle" : "solid"}
              borderRadius="md"
            >
              Move Up
            </Button>
            <Button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              size="sm"
              variant={isLast ? "subtle" : "solid"}
              borderRadius="md"
            >
              Move Down
            </Button>
            <Button
              type="button"
              onClick={onRemove}
              size="sm"
              colorPalette="red"
              variant="subtle"
              borderRadius="md"
            >
              Remove
            </Button>
            {onApply ? (
              <Button
                type="button"
                onClick={onApply}
                size="sm"
                bg="#095d44"
                color="white"
                borderRadius="md"
                _hover={{ bg: "#074b37" }}
              >
                Apply
              </Button>
            ) : null}
          </div>
        </div>
      }
    />
  );
}
