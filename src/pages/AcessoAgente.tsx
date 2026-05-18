import { useState } from "react";
import { useLocation } from "wouter";

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api") as string;

export default function AcessoAgente() {
  const [, navigate] = useLocation();
  const [matricula, setMatricula] = useState("");
  const [cpf4, setCpf4] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matricula.trim() || cpf4.length < 4) return;
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch(`${API_BASE}/agentes/buscar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula: matricula.trim(), cpf4: cpf4.trim() }),
      });
      if (res.ok) {
        const { id } = await res.json() as { id: string };
        navigate(`/minha-carteirinha/${id}`);
      } else {
        setErro("Matrícula ou CPF incorretos. Verifique e tente novamente.");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#f3f4f6",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        padding: "36px 32px",
        width: "100%",
        maxWidth: 380,
      }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <img src="/brasao-prefeitura.png" alt="Brasão de Sorocaba"
            style={{ height: 64, objectFit: "contain" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{
              color: "#111827", fontWeight: 800, fontSize: 13,
              letterSpacing: "0.1em", textTransform: "uppercase", margin: 0,
            }}>
              Secretaria de Mobilidade
            </p>
            <p style={{ color: "#6b7280", fontSize: 12, margin: "4px 0 0" }}>
              Acesse sua carteirinha funcional
            </p>
          </div>
          <div style={{ display: "flex", width: 100, height: 4, borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
            <div style={{ flex: 1, background: "#1a1a1a" }} />
            <div style={{ flex: 1, background: "#c8102e" }} />
            <div style={{ flex: 1, background: "#f5c518" }} />
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.04em" }}>
              MATRÍCULA
            </label>
            <input
              type="text"
              value={matricula}
              onChange={e => { setMatricula(e.target.value); setErro(""); }}
              placeholder="Digite sua matrícula"
              autoComplete="off"
              style={{
                height: 44, borderRadius: 8, border: "1.5px solid #d1d5db",
                padding: "0 14px", fontSize: 15, outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#c8102e")}
              onBlur={e => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.04em" }}>
              4 PRIMEIROS DÍGITOS DO CPF
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={cpf4}
              onChange={e => { setCpf4(e.target.value.replace(/\D/g, "").slice(0, 4)); setErro(""); }}
              placeholder="Ex: 1234"
              autoComplete="off"
              style={{
                height: 44, borderRadius: 8, border: "1.5px solid #d1d5db",
                padding: "0 14px", fontSize: 15, letterSpacing: "0.2em", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#c8102e")}
              onBlur={e => (e.target.style.borderColor = "#d1d5db")}
            />
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
              Apenas os 4 primeiros números, sem ponto ou traço.
            </p>
          </div>

          {erro && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px",
              color: "#b91c1c", fontSize: 13, fontWeight: 500,
            }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando || !matricula.trim() || cpf4.length < 4}
            style={{
              height: 48, borderRadius: 8, border: "none",
              background: carregando || !matricula.trim() || cpf4.length < 4 ? "#e5e7eb" : "#c8102e",
              color: carregando || !matricula.trim() || cpf4.length < 4 ? "#9ca3af" : "#ffffff",
              fontWeight: 800, fontSize: 14, letterSpacing: "0.06em",
              textTransform: "uppercase", cursor: carregando ? "wait" : "pointer",
              transition: "background 0.15s",
              marginTop: 4,
            }}
          >
            {carregando ? "Verificando..." : "Ver minha carteirinha"}
          </button>
        </form>
      </div>
    </div>
  );
}
