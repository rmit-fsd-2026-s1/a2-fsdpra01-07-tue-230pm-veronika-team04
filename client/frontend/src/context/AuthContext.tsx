import axios from "axios";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { authApi, type BackendAuthUser } from "@/services/authApi";
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

function splitName(name: string) {
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
    /* eslint-disable react-hooks/set-state-in-effect */
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
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function saveUser(user: CurrentUser) {
    setCurrentUser(user);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  async function login(email: string, password: string) {
    try {
      const response = await authApi.login({ email, password });
      return saveUser(mapBackendUser(response.data.user));
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function signup(payload: SignupFormPayload) {
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
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Frontend auth state is still cleared when the simple backend logout fails.
    } finally {
      window.localStorage.removeItem(STORAGE_KEY);
      setCurrentUser(null);
    }
  }

  function overrideCurrentUser(user: CurrentUser) {
    saveUser(user);
  }

  const value: AuthContextValue = {
    currentUser,
    isAuthReady,
    isAuthenticated: currentUser !== null,
    login,
    signup,
    logout,
    overrideCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export type { CurrentUser, SignupFormPayload };
