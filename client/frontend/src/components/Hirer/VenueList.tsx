import VenueCard from "@/components/VenueCard";
import type { Venue } from "@/types/venue";

type VenueListProps = {
  venues: Venue[];
  isLoading?: boolean;
  error?: string;
};

export default function VenueList({
  venues,
  isLoading = false,
  error = "",
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
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} useChakraTags />
      ))}
    </div>
  );
}
