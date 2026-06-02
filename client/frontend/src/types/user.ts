export type UserRole = "hirer" | "vendor" | "admin";

export type StoredUser = {
  userID?: number;
  accountID?: number | null;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
};

export type CurrentUser = StoredUser;
