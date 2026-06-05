import apiClient from "./api";

export type BlockedSlot = {
  blockedSlotID: number;
  venueID: number;
  startDateTime: string;
  endDateTime: string;
  reason: string | null;
  isActive: boolean;
};

type BlockedSlotResponse = {
  message: string;
  blockedSlot: BlockedSlot;
};

type BlockedSlotsResponse = {
  message: string;
  blockedSlots: BlockedSlot[];
};

export type CreateBlockedSlotPayload = {
  venueID: number;
  date: string;        // "YYYY-MM-DD"
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  reason?: string;
};

export const blockedSlotApi = {
  getBlockedSlotsByVenue: (venueID: number) =>
    apiClient.get<BlockedSlotsResponse>(`/api/blocked-slots/venue/${venueID}`),
  createBlockedSlot: (payload: CreateBlockedSlotPayload) =>
    apiClient.post<BlockedSlotResponse>("/api/blocked-slots", payload),
  deactivateBlockedSlot: (blockedSlotID: number) =>
    apiClient.patch<BlockedSlotResponse>(`/api/blocked-slots/${blockedSlotID}/deactivate`),
};