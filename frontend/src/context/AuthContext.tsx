import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, setToken, getToken } from "../api/client";
import type { AdminUser } from "../api/types";

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface LoginResponse {
  success: boolean;
  token: string;
  user: AdminUser;
}

interface MeResponse {
  success: boolean;
  user: AdminUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on mount if a token is present.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<MeResponse>("/auth/me")
      .then((res) => setUser(res.user))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}