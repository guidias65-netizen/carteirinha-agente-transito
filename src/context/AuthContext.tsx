import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const TOKEN_KEY = "smob_auth_token";
const NIVEL_KEY = "smob_nivel";
const NOME_KEY = "smob_nome";
const API_BASE = (import.meta.env.VITE_API_URL ?? "/api") as string;

interface AuthContextType {
  loggedIn: boolean;
  nivel: string;
  userName: string;
  token: string;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [nivel, setNivel] = useState<string>(() => sessionStorage.getItem(NIVEL_KEY) || "");
  const [userName, setUserName] = useState<string>(() => sessionStorage.getItem(NOME_KEY) || "");

  const login = useCallback(async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: user, senha: pass }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(NIVEL_KEY, data.nivel);
      sessionStorage.setItem(NOME_KEY, data.nome || "");
      setToken(data.token);
      setNivel(data.nivel);
      setUserName(data.nome || "");
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(NIVEL_KEY);
    sessionStorage.removeItem(NOME_KEY);
    setToken("");
    setNivel("");
    setUserName("");
  }, []);

  return (
    <AuthContext.Provider value={{ loggedIn: !!token, nivel, userName, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
