import { useState } from "react";
import { Agent } from "@/hooks/use-agents";
import jsPDF from "jspdf";

interface ExportModalProps {
  agents: Agent[];
  onClose: () => void;
}

const COLUNAS = [
  { key: "matricula", label: "Matrícula", w: 22 },
  { key: "nome", label: "Nome", w: 58 },
  { key: "funcional", label: "Funcional", w: 20 },
  { key: "cpf", label: "CPF", w: 30 },
  { key: "tipoSanguineo", label: "Sangue", w: 14 },
  { key: "dataNascimento", label: "Dt. Nascimento", w: 24 },
  { key: "naturalidadeUf", label: "Naturalidade", w: 34 },
  { key: "equipamentoNrSerie", label: "Nº Série", w: 26 },
  { key: "equipamentoMarca", label: "Marca Arma", w: 26 },
] as const;

function getVal(agent: Agent, key: string): string {
  return String((agent as unknown as Record<string, unknown>)[key] ?? "");
}

function exportCSV(agents: Agent[]) {
  const header = COLUNAS.map((c) => `"${c.label}"`).join(";");
  const rows = agents.map((a) =>
    COLUNAS.map((c) => `"${getVal(a, c.key).replace(/"/g, '""')}"`).join(";"),
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

function exportPDF(agents: Agent[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const totalW = COLUNAS.reduce((s, c) => s + c.w, 0);
  const startX = 14;
  const rowH = 6.5;
  const headerH = 8;

  const drawRow = (values: string[], y: number, height: number, isHeader = false, even = false) => {
    let x = startX;
    if (isHeader) {
      doc.setFillColor(30, 30, 30);
      doc.rect(startX, y, totalW, height, "F");
    } else if (even) {
      doc.setFillColor(247, 248, 250);
      doc.rect(startX, y, totalW, height, "F");
    }
    COLUNAS.forEach((col, i) => {
      doc.setFontSize(isHeader ? 7 : 6.5);
      doc.setFont("helvetica", isHeader ? "bold" : "normal");
      doc.setTextColor(isHeader ? 255 : 30, isHeader ? 255 : 30, isHeader ? 255 : 30);
      const maxChars = Math.floor((col.w - 2) / (isHeader ? 1.8 : 1.7));
      const text = values[i].length > maxChars ? values[i].slice(0, maxChars - 1) + "…" : values[i];
      doc.text(text, x + 1.5, y + height - 2.2);
      x += col.w;
    });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(startX, y + height, startX + totalW, y + height);
  };

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("SEMOB Sorocaba — Relação de Agentes de Trânsito", startX, 14);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")}   ·   Total: ${agents.length} agentes`,
    startX,
    21,
  );

  let y = 27;
  drawRow(COLUNAS.map((c) => c.label), y, headerH, true);
  y += headerH;

  agents.forEach((agent, idx) => {
    if (y > 188) {
      doc.addPage();
      y = 14;
      drawRow(COLUNAS.map((c) => c.label), y, headerH, true);
      y += headerH;
    }
    drawRow(
      COLUNAS.map((c) => getVal(agent, c.key)),
      y,
      rowH,
      false,
      idx % 2 === 0,
    );
    y += rowH;
  });

  doc.save(`agentes_semob_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function ExportModal({ agents, onClose }: ExportModalProps) {
  const [formato, setFormato] = useState<"csv" | "pdf">("csv");
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
        width: "100%", maxWidth: 390, overflow: "hidden",
      }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: "#111827", margin: 0 }}>Exportar Cadastros</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
              {agents.length} agentes · {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 22, lineHeight: 1, padding: 4 }}
          >×</button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          <p style={{ fontSize: 11.5, color: "#374151", fontWeight: 700, marginBottom: 6, marginTop: 0 }}>Colunas exportadas:</p>
          <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.7 }}>
            Matrícula · Nome · Nº Funcional · CPF · Tipo Sanguíneo ·<br />
            Data de Nascimento · Naturalidade · Nº de Série · Marca da Arma
          </p>

          <p style={{ fontSize: 11.5, color: "#374151", fontWeight: 700, marginBottom: 10 }}>Formato:</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {(["csv", "pdf"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormato(f)}
                style={{
                  flex: 1, height: 46, borderRadius: 8, cursor: "pointer",
                  border: formato === f ? "2px solid #111827" : "1.5px solid #e5e7eb",
                  background: formato === f ? "#111827" : "#fff",
                  color: formato === f ? "#fff" : "#374151",
                  fontWeight: 700, fontSize: 13,
                  transition: "all 0.15s",
                }}
              >
                {f === "csv" ? "📊 Excel (CSV)" : "📄 PDF"}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>
            {formato === "csv"
              ? "Arquivo .csv — abre diretamente no Excel com acentos corretos."
              : "Arquivo PDF em paisagem (A4) com tabela de todos os agentes."}
          </p>

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
            {exportando ? "Gerando arquivo..." : `⬇  Baixar ${formato === "csv" ? "Excel (CSV)" : "PDF"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
