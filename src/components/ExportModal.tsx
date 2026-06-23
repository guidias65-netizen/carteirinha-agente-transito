import { useState } from "react";
import { Agent } from "@/hooks/use-agents";
import jsPDF from "jspdf";

interface ExportModalProps {
  agents: Agent[];
  onClose: () => void;
}

// Colunas do CSV (sem foto — Excel não incorpora imagem via CSV)
const COLUNAS_CSV = [
  { key: "matricula", label: "Matrícula" },
  { key: "nome", label: "Nome" },
  { key: "funcional", label: "Nº Funcional" },
  { key: "cpf", label: "CPF" },
  { key: "tipoSanguineo", label: "Tipo Sanguíneo" },
  { key: "dataNascimento", label: "Dt. Nascimento" },
  { key: "naturalidadeUf", label: "Naturalidade" },
  { key: "equipamentoNrSerie", label: "Nº Série Arma" },
  { key: "equipamentoMarca", label: "Marca Arma" },
] as const;

// Colunas do PDF (foto incluída entre matrícula e nome)
const COLUNAS_PDF = [
  { key: "matricula",          label: "Matrícula",      w: 22, isPhoto: false },
  { key: "foto",               label: "Foto",           w: 22, isPhoto: true  },
  { key: "nome",               label: "Nome",           w: 52, isPhoto: false },
  { key: "funcional",          label: "Funcional",      w: 20, isPhoto: false },
  { key: "cpf",                label: "CPF",            w: 30, isPhoto: false },
  { key: "tipoSanguineo",      label: "Sangue",         w: 13, isPhoto: false },
  { key: "dataNascimento",     label: "Dt. Nascimento", w: 24, isPhoto: false },
  { key: "naturalidadeUf",     label: "Naturalidade",   w: 32, isPhoto: false },
  { key: "equipamentoNrSerie", label: "Nº Série",       w: 26, isPhoto: false },
  { key: "equipamentoMarca",   label: "Marca Arma",     w: 32, isPhoto: false },
] as const;

function getVal(agent: Agent, key: string): string {
  return String((agent as unknown as Record<string, unknown>)[key] ?? "");
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function exportCSV(agents: Agent[]) {
  const header = COLUNAS_CSV.map((c) => `"${c.label}"`).join(";");
  const rows = agents.map((a) =>
    COLUNAS_CSV.map((c) => `"${getVal(a, c.key).replace(/"/g, '""')}"`).join(";"),
  );
  const bom = "\uFEFF";
  const csv = bom + [header, ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `agentes_semob_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── PDF ─────────────────────────────────────────────────────────────────────
const ROW_H = 22; // mm — altura da linha (acomoda foto)
const HEADER_H = 8;

function exportPDF(agents: Agent[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const totalW = COLUNAS_PDF.reduce((s, c) => s + c.w, 0);
  const startX = 10;

  // Cabeçalho do documento
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("SEMOB Sorocaba — Relação de Agentes de Trânsito", startX, 12);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")}   ·   Total: ${agents.length} agentes`,
    startX,
    18,
  );

  // Linha de cabeçalho da tabela
  const drawHeaderRow = (y: number) => {
    doc.setFillColor(30, 30, 30);
    doc.rect(startX, y, totalW, HEADER_H, "F");
    let x = startX;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    for (const col of COLUNAS_PDF) {
      doc.text(col.label, x + 1.5, y + HEADER_H - 2.5);
      x += col.w;
    }
  };

  // Linha de dados
  const drawDataRow = (agent: Agent, y: number, even: boolean) => {
    // Fundo alternado
    if (even) {
      doc.setFillColor(247, 248, 250);
      doc.rect(startX, y, totalW, ROW_H, "F");
    }

    let x = startX;
    for (const col of COLUNAS_PDF) {
      if (col.isPhoto) {
        // Desenhar foto
        const photoSrc = getVal(agent, "foto");
        if (photoSrc) {
          try {
            // Detectar formato da imagem a partir do data URL
            const fmt = photoSrc.startsWith("data:image/png") ? "PNG" : "JPEG";
            const photoW = col.w - 2;
            const photoH = ROW_H - 2;
            doc.addImage(photoSrc, fmt, x + 1, y + 1, photoW, photoH);
          } catch {
            // Foto inválida — deixar célula vazia
          }
        }
      } else {
        const val = getVal(agent, col.key);
        const maxChars = Math.floor((col.w - 2) / 1.65);
        const text = val.length > maxChars ? val.slice(0, maxChars - 1) + "…" : val;
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        // Texto centralizado verticalmente na linha
        doc.text(text, x + 1.5, y + ROW_H / 2 + 2);
      }
      x += col.w;
    }

    // Linha separadora
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.2);
    doc.line(startX, y + ROW_H, startX + totalW, y + ROW_H);
  };

  let y = 24;
  drawHeaderRow(y);
  y += HEADER_H;

  agents.forEach((agent, idx) => {
    if (y + ROW_H > 200) {
      doc.addPage();
      y = 10;
      drawHeaderRow(y);
      y += HEADER_H;
    }
    drawDataRow(agent, y, idx % 2 === 0);
    y += ROW_H;
  });

  doc.save(`agentes_semob_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function ExportModal({ agents, onClose }: ExportModalProps) {
  const [formato, setFormato] = useState<"csv" | "pdf">("pdf");
  const [exportando, setExportando] = useState(false);

  const handleExport = () => {
    setExportando(true);
    setTimeout(() => {
      try {
        if (formato === "csv") exportCSV(agents);
        else exportPDF(agents);
        onClose();
      } catch (e) {
        console.error(e);
      } finally {
        setExportando(false);
      }
    }, 80);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        width: "100%", maxWidth: 400, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: "#111827", margin: 0 }}>Exportar Cadastros</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
              {agents.length} agente{agents.length !== 1 ? "s" : ""} · {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 22, lineHeight: 1, padding: 4 }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          <p style={{ fontSize: 11.5, color: "#374151", fontWeight: 700, marginBottom: 6, marginTop: 0 }}>Colunas exportadas:</p>

          {/* PDF columns (with photo) */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 10.5, color: "#6b7280", margin: "0 0 4px", lineHeight: 1.8 }}>
              <span style={{ background: "#f0f9ff", color: "#0369a1", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginRight: 4 }}>PDF</span>
              Matrícula · <strong>Foto</strong> · Nome · Funcional · CPF · Sangue · Dt. Nascimento · Naturalidade · Nº Série · Marca
            </p>
            <p style={{ fontSize: 10.5, color: "#6b7280", margin: 0, lineHeight: 1.8 }}>
              <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginRight: 4 }}>Excel</span>
              Matrícula · Nome · Funcional · CPF · Sangue · Dt. Nascimento · Naturalidade · Nº Série · Marca
              <span style={{ fontSize: 10, color: "#9ca3af", display: "block", marginTop: 2 }}>* Fotos não são suportadas no formato CSV/Excel</span>
            </p>
          </div>

          <p style={{ fontSize: 11.5, color: "#374151", fontWeight: 700, marginBottom: 10 }}>Formato:</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            {(["pdf", "csv"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormato(f)}
                style={{
                  flex: 1, height: 48, borderRadius: 8, cursor: "pointer",
                  border: formato === f ? "2.5px solid #111827" : "1.5px solid #e5e7eb",
                  background: formato === f ? "#111827" : "#fff",
                  color: formato === f ? "#fff" : "#374151",
                  fontWeight: 700, fontSize: 13,
                  transition: "all 0.15s",
                }}
              >
                {f === "pdf" ? "📄 PDF (com foto)" : "📊 Excel (CSV)"}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={exportando}
            style={{
              width: "100%", height: 46, borderRadius: 8, border: "none",
              background: exportando ? "#d1d5db" : "#16a34a",
              color: exportando ? "#6b7280" : "#fff",
              fontWeight: 800, fontSize: 14, cursor: exportando ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {exportando ? "Gerando arquivo..." : `⬇  Baixar ${formato === "pdf" ? "PDF (com foto)" : "Excel (CSV)"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
