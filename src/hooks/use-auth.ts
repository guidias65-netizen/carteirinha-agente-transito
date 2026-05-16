import { useState, useCallback } from "react";

const SESSION_KEY = "smob_auth";

const CREDENTIALS: Record<string, string> = {
  admin: "mobilidade@2025",
};

export function useAuth() {
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

  return { loggedIn, login, logout };
}
