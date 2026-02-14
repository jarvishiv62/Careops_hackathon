// frontend/lib/auth.ts
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "./api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
}

interface Workspace {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  userRole?: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  businessName: string;
  contactEmail: string;
  address?: string;
  timezone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("careops_token");
    if (storedToken) {
      setToken(storedToken);
      fetchCurrentUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken: string, retryCount = 0) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        setWorkspace({
          ...data.data.workspace,
          userRole: data.data.role,
        });
      } else {
        // Token invalid, clear it
        localStorage.removeItem("careops_token");
        setToken(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      // If it's a network error and we haven't retried yet, try once more
      if (
        retryCount === 0 &&
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.log("Retrying user fetch...");
        setTimeout(() => fetchCurrentUser(authToken, 1), 1000);
        return;
      }
      // Clear invalid token on network error
      localStorage.removeItem("careops_token");
      setToken(null);
    } finally {
      if (retryCount === 0) {
        setIsLoading(false);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const {
        user: userData,
        workspace: workspaceData,
        token: authToken,
      } = data.data;

      setUser(userData);
      setWorkspace({
        ...workspaceData,
        userRole: userData.role,
      });
      setToken(authToken);
      localStorage.setItem("careops_token", authToken);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      const {
        user: userData,
        workspace: workspaceData,
        token: authToken,
      } = result.data;

      setUser(userData);
      setWorkspace({
        ...workspaceData,
        userRole: userData.role,
      });
      setToken(authToken);
      localStorage.setItem("careops_token", authToken);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setWorkspace(null);
    setToken(null);
    localStorage.removeItem("careops_token");
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper to get auth headers for API calls
export function getAuthHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
