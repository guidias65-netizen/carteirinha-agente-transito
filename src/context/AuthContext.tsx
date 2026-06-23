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

  const applySession = useCallback((token: string, nivel: string, nome: string) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(NIVEL_KEY, nivel);
    sessionStorage.setItem(NOME_KEY, nome);
    setToken(token);
    setNivel(nivel);
    setUserName(nome);
  }, []);

  const login = useCallback(async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: user, senha: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        applySession(data.token, data.nivel, data.nome || "");
        return true;
      }
      // 401 = senha errada no servidor real → não faz fallback
      if (res.status === 401) return false;
      // 404 / erro = endpoint ausente (servidor de dev sem módulo de auth)
      // → usa credencial padrão local
    } catch {
      // Servidor indisponível ou erro de rede → usa credencial padrão local
    }
    // Fallback para ambiente de desenvolvimento (sem endpoint de auth)
    if (user === "admin" && pass === "mobilidade@2025") {
      applySession("dev_local", "super_admin", "Administrador");
      return true;
    }
    return false;
  }, [applySession]);

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
