import apiClient from "./api";
import type { Venue } from "@/types/venue";

type VenueListResponse = {
  message: string;
  venues: Venue[];
};

export type VenueSearchFilters = {
  name?: string;
  location?: string;
  capacity?: string | number;
  suitability?: string;
};

function cleanFilters(filters: VenueSearchFilters) {
  return {
    name: filters.name || undefined,
    location: filters.location || undefined,
    capacity: filters.capacity || undefined,
    suitability: filters.suitability || undefined,
  };
}

export const venueApi = {
  getAllVenues: () => apiClient.get<VenueListResponse>("/venues"),
  searchVenues: (filters: VenueSearchFilters) =>
    apiClient.get<VenueListResponse>("/venues/search", {
      params: cleanFilters(filters),
    }),
  getVenueByVendorId: (vendorId: string | number) =>
    apiClient.get<VenueListResponse>(`/venues/vendor/${vendorId}`),
};
