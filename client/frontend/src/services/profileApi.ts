import apiClient from "./api";
import type { UserRole } from "@/types/user";

type ProfileResponse = {
  message: string;
  profile: {
    userID: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: UserRole;
    createdAt: string;
    accountID: number | null;
    reputation: number | null;
    complianceScore: number | null;
  };
};

type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  phone?: string;
};

type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const profileApi = {
  getProfile: (userID: number) =>
    apiClient.get<ProfileResponse>(`/profile/${userID}`),
  updateProfile: (userID: number, payload: UpdateProfilePayload) =>
    apiClient.patch<ProfileResponse>(`/profile/${userID}`, payload),
  updateEmail: (userID: number, email: string) =>
  apiClient.patch<ProfileResponse>(`/profile/${userID}/email`, { email }),
  updatePassword: (userID: number, payload: UpdatePasswordPayload) =>
    apiClient.patch<{ message: string }>(`/profile/${userID}/password`, payload),
};