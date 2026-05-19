import { useState, useRef } from "react";
import { useLocation } from "wouter";

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api") as string;

type Etapa = "login" | "upload" | "aguardando";

export default function AcessoAgente() {
  const [, navigate] = useLocation();
  const [etapa, setEtapa] = useState<Etapa>("login");
  const [agenteId, setAgenteId] = useState("");

  // Login
  const [matricula, setMatricula] = useState("");
  const [cpf4, setCpf4] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Upload foto
  const [fotoBase64, setFotoBase64] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);

  async function handleSubmitLogin(e: React.FormEvent) {
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
        const data = await res.json() as { id: string; foto: string; fotoPendente: string };
        setAgenteId(data.id);
        if (data.foto) {
          navigate(`/minha-funcional/${data.id}`);
        } else if (data.fotoPendente) {
          setEtapa("aguardando");
        } else {
          setEtapa("upload");
        }
      } else {
        setErro("Matrícula ou CPF incorretos. Verifique e tente novamente.");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 600, MAX_H = 800;
        let w = img.width, h = img.height;
        if (w > MAX_W || h > MAX_H) {
          const ratio = Math.min(MAX_W / w, MAX_H / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        setFotoBase64(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleEnviarFoto(e: React.FormEvent) {
    e.preventDefault();
    if (!fotoBase64) return;
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/agentes/${agenteId}/foto-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foto: fotoBase64 }),
      });
      if (res.ok) {
        setEtapa("aguardando");
      } else {
        setErro("Erro ao enviar foto. Tente novamente.");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 44, borderRadius: 8, border: "1.5px solid #d1d5db",
    padding: "0 14px", fontSize: 15, outline: "none",
    transition: "border-color 0.15s", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#f3f4f6",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "24px 16px",
    }}>
      <div style={{
        background: "#ffffff", borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        padding: "36px 32px", width: "100%", maxWidth: 380,
      }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <img src="/brasao-prefeitura.png" alt="Brasão de Sorocaba"
            style={{ height: 64, objectFit: "contain" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#111827", fontWeight: 800, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              Secretaria de Mobilidade
            </p>
            <p style={{ color: "#6b7280", fontSize: 12, margin: "4px 0 0" }}>
              {etapa === "login" ? "Acesse sua funcional" :
               etapa === "upload" ? "Envie sua foto 3x4" :
               "Aguardando aprovação"}
            </p>
          </div>
          <div style={{ display: "flex", width: 100, height: 4, borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
            <div style={{ flex: 1, background: "#1a1a1a" }} />
            <div style={{ flex: 1, background: "#c8102e" }} />
            <div style={{ flex: 1, background: "#f5c518" }} />
          </div>
        </div>

        {/* ETAPA 1 — Login */}
        {etapa === "login" && (
          <form onSubmit={handleSubmitLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                style={inputStyle}
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
                style={{ ...inputStyle, letterSpacing: "0.2em" }}
                onFocus={e => (e.target.style.borderColor = "#c8102e")}
                onBlur={e => (e.target.style.borderColor = "#d1d5db")}
              />
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                Apenas os 4 primeiros números, sem ponto ou traço.
              </p>
            </div>
            {erro && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", fontSize: 13, fontWeight: 500 }}>
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
                transition: "background 0.15s", marginTop: 4,
              }}
            >
              {carregando ? "Verificando..." : "Ver minha funcional"}
            </button>
          </form>
        )}

        {/* ETAPA 2 — Upload de foto */}
        {etapa === "upload" && (
          <form onSubmit={handleEnviarFoto} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
              Sua foto 3x4 ainda não está cadastrada. Envie uma foto para que o administrador possa aprová-la.
            </div>

            {/* Preview da foto */}
            <div
              onClick={() => inputFileRef.current?.click()}
              style={{
                width: "100%", height: 180, borderRadius: 8,
                border: "2px dashed #d1d5db", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                overflow: "hidden", background: "#f9fafb", transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#c8102e")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#d1d5db")}
            >
              {fotoBase64 ? (
                <img src={fotoBase64} alt="Prévia da foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>Toque para selecionar a foto</span>
                  <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Formato 3x4 recomendado</span>
                </>
              )}
            </div>
            <input
              ref={inputFileRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              style={{ display: "none" }}
            />

            {fotoBase64 && (
              <button
                type="button"
                onClick={() => inputFileRef.current?.click()}
                style={{ background: "none", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Trocar foto
              </button>
            )}

            {erro && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", fontSize: 13, fontWeight: 500 }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={!fotoBase64 || enviando}
              style={{
                height: 48, borderRadius: 8, border: "none",
                background: !fotoBase64 || enviando ? "#e5e7eb" : "#c8102e",
                color: !fotoBase64 || enviando ? "#9ca3af" : "#ffffff",
                fontWeight: 800, fontSize: 14, letterSpacing: "0.06em",
                textTransform: "uppercase", cursor: enviando ? "wait" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {enviando ? "Enviando..." : "Enviar foto"}
            </button>
          </form>
        )}

        {/* ETAPA 3 — Aguardando aprovação */}
        {etapa === "aguardando" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: "#111827", margin: "0 0 6px" }}>
                Foto aguardando aprovação
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                Sua foto foi enviada e está sendo analisada pelo administrador. Em breve você poderá acessar sua funcional.
              </p>
            </div>
            <button
              onClick={() => { setEtapa("login"); setMatricula(""); setCpf4(""); setFotoBase64(""); setErro(""); }}
              style={{
                marginTop: 8, height: 40, borderRadius: 8, border: "1.5px solid #e5e7eb",
                background: "#ffffff", color: "#374151", fontWeight: 700, fontSize: 13,
                letterSpacing: "0.04em", cursor: "pointer", padding: "0 20px",
              }}
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
