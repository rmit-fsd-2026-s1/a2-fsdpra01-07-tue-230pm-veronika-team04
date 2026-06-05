import apiClient from "@/services/api";
import type {
  AddPreferencePayload,
  PreferredVenue,
  ReorderPreferencePayload,
} from "@/types/venuePreference";

type PreferredVenueListResponse = {
  message: string;
  preferredVenues: PreferredVenue[];
};

export const venuePreferenceApi = {
  getHirerPreferredVenues: (hireAccountID: string | number) =>
    apiClient.get<PreferredVenueListResponse>(
      `/venue-preferences/hirer/${hireAccountID}`,
    ),
  addVenuePreference: (payload: AddPreferencePayload) =>
    apiClient.post<PreferredVenueListResponse>("/venue-preferences", payload),
  reorderVenuePreferences: (payload: ReorderPreferencePayload) =>
    apiClient.patch<PreferredVenueListResponse>(
      "/venue-preferences/reorder",
      payload,
    ),
  removeVenuePreference: (hireAccountID: string | number, venueID: string | number) =>
    apiClient.delete<PreferredVenueListResponse>(
      `/venue-preferences/${hireAccountID}/${venueID}`,
    ),
};
