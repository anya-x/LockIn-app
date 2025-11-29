import React, { createContext, useState, useContext, useEffect } from "react";
import { authService, type User } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface JwtPayload {
  sub: string; // email
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
}

/**
 * Decodes a JWT token payload without external dependencies.
 * JWT structure: header.payload.signature (all base64 encoded)
 */
const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    // Handle base64url encoding by replacing chars and adding padding
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

/**
 * Checks if a JWT token is expired with a 30-second buffer
 */
const isTokenExpired = (payload: JwtPayload): boolean => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const bufferSeconds = 30;
  return payload.exp < nowInSeconds + bufferSeconds;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      const payload = decodeJwtPayload(token);

      if (payload && !isTokenExpired(payload)) {
        // Extract email from JWT subject claim
        setUser({
          email: payload.sub,
          firstName: "",
          lastName: "",
        });
      } else {
        // Token is invalid or expired, clear it
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
