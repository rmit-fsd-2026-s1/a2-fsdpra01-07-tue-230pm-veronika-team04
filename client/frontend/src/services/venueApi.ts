import apiClient from "./api";
import type { Venue } from "@/types/venue";

type VenueListResponse = {
  message: string;
  venues: Venue[];
};

type VenueResponse = {
  message: string;
  venue: Venue;
};

export type CreateVenuePayload = {
  vendorAccountID: number;
  name: string;
  location: string;
  capacity: number;
  price: number;
  description?: string;
  image?: string;
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
  createVenue: (payload: CreateVenuePayload) =>
    apiClient.post<VenueResponse>("/venues", payload),
  updateVenue: (venueId: string | number, payload: Partial<CreateVenuePayload>) =>
    apiClient.put<VenueResponse>(`/venues/${venueId}`, payload),
};
