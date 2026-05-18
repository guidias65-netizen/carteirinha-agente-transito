import { useParams } from "wouter";
import { useState, useEffect } from "react";
import type { Agent } from "@/hooks/use-agents";
import { CardFront, CardBack, W, H } from "@/components/CarteirinhaPreview";

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api") as string;

function useCardScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => {
      const available = window.innerWidth - 32;
      setScale(Math.min(Math.max(available / W, 1), 1.6));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return scale;
}

export default function MinhaCarteirinha() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const scale = useCardScale();

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(`${API_BASE}/agentes/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setAgent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Carregando...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ minHeight: "100dvh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <img src="/brasao-prefeitura.png" alt="Brasão"
            style={{ height: 72, margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
          <p style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
            Agente não encontrado
          </p>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Verifique os dados informados.
          </p>
        </div>
      </div>
    );
  }

  const scaledW = Math.round(W * scale);
  const scaledH = Math.round(H * scale);

  return (
    <div style={{ minHeight: "100dvh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 0 40px" }}>
      {/* Cabeçalho */}
      <div style={{ width: "100%", background: "#ffffff", borderBottom: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px 16px", gap: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <img src="/brasao-prefeitura.png" alt="Brasão de Sorocaba" style={{ height: 60, objectFit: "contain" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#111827", fontWeight: 800, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
            Secretaria de Mobilidade
          </p>
          <p style={{ color: "#374151", fontWeight: 500, fontSize: 11, margin: "2px 0 0" }}>
            Prefeitura de Sorocaba — SP
          </p>
        </div>
        <div style={{ display: "flex", width: 120, height: 5, borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
          <div style={{ flex: 1, background: "#1a1a1a" }} />
          <div style={{ flex: 1, background: "#c8102e" }} />
          <div style={{ flex: 1, background: "#f5c518" }} />
        </div>
      </div>

      {/* Cartões escalados */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%", padding: "24px 16px 0" }}>
        <CardLabel>FRENTE</CardLabel>

        <div style={{ width: scaledW, height: scaledH, position: "relative", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
            <CardFront agent={agent} />
          </div>
        </div>

        <CardLabel>VERSO</CardLabel>

        <div style={{ width: scaledW, height: scaledH, position: "relative", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
            <CardBack agent={agent} />
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c8102e", display: "inline-block" }} />
          <span style={{ color: "#374151", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Documento Oficial — Apenas Consulta
          </span>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c8102e", display: "inline-block" }} />
        </div>
      </div>
    </div>
  );
}

function CardLabel({ children }: { children: string }) {
  return (
    <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
      <span style={{ color: "#6b7280", fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
    </div>
  );
}
