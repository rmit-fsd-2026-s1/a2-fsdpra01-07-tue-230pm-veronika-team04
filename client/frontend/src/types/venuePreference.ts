import type { Venue } from "@/types/venue";

export type PreferredVenue = Venue & {
  preferenceRank: number;
};

export type AddPreferencePayload = {
  hireAccountID: number;
  venueID: number;
};

export type ReorderPreferencePayload = {
  hireAccountID: number;
  venueIDs: number[];
};
