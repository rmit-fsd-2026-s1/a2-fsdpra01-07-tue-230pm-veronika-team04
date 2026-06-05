import { Button } from "@chakra-ui/react";

import VenueCard from "@/components/VenueCard";
import type { Venue } from "@/types/venue";

type VenueListProps = {
  venues: Venue[];
  isLoading?: boolean;
  error?: string;
  preferredVenueIds?: number[];
  onAddToPreferred?: (venueID: number) => void;
  isAddingPreferred?: boolean;
  onApply?: (venue: Venue) => void;
};

export default function VenueList({
  venues,
  isLoading = false,
  error = "",
  preferredVenueIds,
  onAddToPreferred,
  isAddingPreferred = false,
  onApply,
}: VenueListProps) {
  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading venues...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (venues.length === 0) {
    return <p className="text-sm text-zinc-600">No venues available</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {venues.map((venue) => {
        const isAdded = preferredVenueIds?.includes(venue.id) || false;
        const canAddToPreferred = Boolean(preferredVenueIds && onAddToPreferred);
        const hasActions = canAddToPreferred || onApply;

        return (
          <VenueCard
            key={venue.id}
            venue={venue}
            useChakraTags
            actions={
              hasActions ? (
                <div className="flex flex-wrap gap-2">
                  {canAddToPreferred && onAddToPreferred ? (
                    <Button
                      type="button"
                      onClick={() => onAddToPreferred(venue.id)}
                      disabled={isAdded || isAddingPreferred}
                      size="sm"
                      bg={isAdded ? "gray.200" : "#095d44"}
                      color={isAdded ? "gray.500" : "white"}
                      borderRadius="md"
                      _hover={{
                        bg: isAdded ? "gray.200" : "#074b37",
                      }}
                    >
                      {isAdded ? "Added" : "Add to Preferences"}
                    </Button>
                  ) : null}

                  {onApply ? (
                    <Button
                      type="button"
                      onClick={() => onApply(venue)}
                      size="sm"
                      variant="outline"
                      borderRadius="md"
                    >
                      Apply
                    </Button>
                  ) : null}
                </div>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}
