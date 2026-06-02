import apiClient from "./api";

export type BackendRole = "hirer" | "vendor" | "admin";

export type BackendAuthUser = {
  userID: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: BackendRole;
  accountID: number | null;
};

export type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  message: string;
  user: BackendAuthUser;
};

export const authApi = {
  signup: (data: SignupPayload) =>
    apiClient.post<AuthResponse>("/auth/signup", data),
  login: (data: LoginPayload) => apiClient.post<AuthResponse>("/auth/login", data),
  logout: () => apiClient.post<{ message: string }>("/auth/logout"),
};
