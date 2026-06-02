import axios from "axios";
import {
  createContext,
  useCallback,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  authApi,
  type BackendAuthUser,
  type LoginPayload,
  type SignupPayload,
} from "@/services/authApi";
import type { CurrentUser } from "@/types/user";

type SignupFormPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

type AuthContextValue = {
  currentUser: CurrentUser | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  signup: (payload: SignupFormPayload) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  overrideCurrentUser: (user: CurrentUser) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "venueVendorsCurrentUser";

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;

    if (data?.message) {
      return data.message;
    }
  }

  return "Something went wrong. Please try again later.";
}

function mapBackendUser(user: BackendAuthUser): CurrentUser {
  return {
    userID: user.userID,
    accountID: user.accountID,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
  };
}

function splitName(name: string): Pick<SignupPayload, "firstName" | "lastName"> {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const [firstName = "", ...lastNameParts] = parts;

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedUser = window.localStorage.getItem(STORAGE_KEY);

      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser) as CurrentUser);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
          setCurrentUser(null);
        }
      }

      setIsAuthReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const saveUser = useCallback((user: CurrentUser) => {
    setCurrentUser(user);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const payload: LoginPayload = { email, password };
      const response = await authApi.login(payload);
      return saveUser(mapBackendUser(response.data.user));
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }, [saveUser]);

  const signup = useCallback(async (payload: SignupFormPayload) => {
    try {
      const { firstName, lastName } = splitName(payload.name);
      const response = await authApi.signup({
        firstName,
        lastName,
        email: payload.email,
        password: payload.password,
        phone: payload.phone ?? "",
      });

      return saveUser(mapBackendUser(response.data.user));
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }, [saveUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Frontend auth state is still cleared when the simple backend logout fails.
    } finally {
      window.localStorage.removeItem(STORAGE_KEY);
      setCurrentUser(null);
    }
  }, []);

  const overrideCurrentUser = useCallback((user: CurrentUser) => {
    saveUser(user);
  }, [saveUser]);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthReady,
      isAuthenticated: currentUser !== null,
      isLoading: !isAuthReady,
      login,
      signup,
      logout,
      overrideCurrentUser,
    }),
    [currentUser, isAuthReady, login, signup, logout, overrideCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export type { CurrentUser, LoginPayload, SignupFormPayload };
