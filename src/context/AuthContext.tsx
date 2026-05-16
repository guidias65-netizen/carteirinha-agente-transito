import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const SESSION_KEY = "smob_auth";

const CREDENTIALS: Record<string, string> = {
  admin: "mobilidade@2025",
};

interface AuthContextType {
  loggedIn: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState<boolean>(() =>
    sessionStorage.getItem(SESSION_KEY) === "1"
  );

  const login = useCallback((user: string, pass: string): boolean => {
    if (CREDENTIALS[user] && CREDENTIALS[user] === pass) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setLoggedIn(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ loggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
