import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const ok = login(user.trim(), pass);
      if (ok) {
        navigate("/");
      } else {
        setError("Usuário ou senha incorretos.");
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#ffffff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: "#ffffff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
        border: "1px solid #e5e7eb",
      }}>
        {/* Header — white stripe area with brasão */}
        <div style={{
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 24px 24px",
          gap: 10,
        }}>
          <img
            src="/brasao-prefeitura.png"
            alt="Brasão de Sorocaba"
            style={{ height: 88, objectFit: "contain" }}
          />
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <p style={{
              color: "#111827",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: 0,
            }}>
              Secretaria de Mobilidade
            </p>
            <p style={{
              color: "#374151",
              fontWeight: 500,
              fontSize: 12,
              margin: "3px 0 0",
            }}>
              Prefeitura de Sorocaba — SP
            </p>
          </div>

          {/* Colored stripe — Sorocaba flag colors */}
          <div style={{
            display: "flex",
            width: "100%",
            height: 6,
            borderRadius: 3,
            overflow: "hidden",
            marginTop: 8,
          }}>
            <div style={{ flex: 1, background: "#1a1a1a" }} />
            <div style={{ flex: 1, background: "#c8102e" }} />
            <div style={{ flex: 1, background: "#f5c518" }} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#f3f4f6" }} />

        {/* System label */}
        <div style={{
          background: "#f9fafb",
          textAlign: "center",
          padding: "8px 0",
        }}>
          <span style={{
            color: "#6b7280",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Sistema de Carteirinhas
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#f3f4f6" }} />

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px 28px", background: "#ffffff" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block",
              color: "#374151",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>
              Usuário
            </label>
            <input
              type="text"
              value={user}
              onChange={e => setUser(e.target.value)}
              autoComplete="username"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#f9fafb",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                color: "#111827",
                fontSize: 14,
                fontWeight: 500,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#c8102e"}
              onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              color: "#374151",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>
              Senha
            </label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#f9fafb",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                color: "#111827",
                fontSize: 14,
                fontWeight: 500,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#c8102e"}
              onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16,
              padding: "8px 12px",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              color: "#b91c1c",
              fontSize: 12,
              fontWeight: 600,
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px 0",
              background: loading ? "#9ca3af" : "#1a1a1a",
              border: "none",
              borderRadius: 8,
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
