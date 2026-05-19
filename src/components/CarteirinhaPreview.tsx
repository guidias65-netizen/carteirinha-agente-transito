import { useRef, useState, useEffect } from "react";
import { forwardRef } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Agent } from "@/hooks/use-agents";
import { Download } from "lucide-react";


function buildConsultaUrl(agent: Agent): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/consulta/${agent.id}`;
}

interface CarteirinhaPreviewProps {
  agent: Agent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
//   modelo.png: 617×801 px  (front: y 0–387, gap 387–414, back: y 414–801)
//   Display card: 325×204 px   SCALE = 325/617 ≈ 0.5267
//   PDF card:     86×54 mm     MM = 86/325 ≈ 0.2646 mm/px
// ─────────────────────────────────────────────────────────────────────────────
const W = 325;
const H = 204;
const IMG_W = 617;
const IMG_H = 801;
const SCALE = W / IMG_W;                          // ≈ 0.5267
const BACK_Y_ORIG = 414;                          // back card start in original
const BACK_Y_OFFSET = Math.round(BACK_Y_ORIG * SCALE); // ≈ 218 display px

const s = (px: number) => Math.round(px * SCALE); // original px → display px
const MM = 86 / W;                                 // ≈ 0.2646 mm per display px
const px2mm = (d: number) => d * MM;              // display px → PDF mm

// ─── canvas helpers ──────────────────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function cropCanvas(
  img: HTMLImageElement,
  sx: number, sy: number, sw: number, sh: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = sw; c.height = sh;
  c.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return c;
}

function coverCrop(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth  * k;
  const dh = img.naturalHeight * k;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return c;
}

function formatCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Função exportada para uso externo (ex: MinhaCarteirinha)
export async function exportAgentPDF(agent: Agent): Promise<void> {
  const FIELD_PT = px2mm(7.5) * 2.835;
  const NAME_PT  = px2mm(10)  * 2.835;
  const AUTH_PT  = px2mm(8.5) * 2.835;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [86, 54] });
  const modelo = await loadImg("/modelo.png");

  const fOrigH = Math.round(H / SCALE);
  pdf.addImage(cropCanvas(modelo, 0, 0, IMG_W, fOrigH).toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 86, 54);

  if (agent.foto) {
    const photoImg = await loadImg(agent.foto);
    const phW = s(140) * 3;
    const phH = s(185) * 3;
    pdf.addImage(coverCrop(photoImg, phW, phH).toDataURL("image/jpeg", 0.93), "JPEG",
      px2mm(s(49)), px2mm(s(127)), px2mm(s(140)), px2mm(s(185)));
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(NAME_PT);
  pdf.setTextColor(255, 255, 255);
  if (agent.nome) pdf.text(agent.nome.toUpperCase(), px2mm(s(403)), px2mm(s(186)), { align: "center", baseline: "middle" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(px2mm(10) * 2.835);
  pdf.setTextColor(255, 255, 255);
  if (agent.funcional) pdf.text(`Nº ${agent.funcional}`, px2mm(s(119)), px2mm(s(334)), { align: "center", baseline: "middle" });

  pdf.setFont("courier", "bold");
  pdf.setFontSize(FIELD_PT);
  pdf.setTextColor(17, 17, 17);
  const fv = (v: string | undefined, ox: number, oy: number) => {
    if (v) pdf.text(v, px2mm(s(ox)), px2mm(s(oy)), { baseline: "middle" });
  };
  fv(agent.matricula, 290, 226); fv(formatCPF(agent.cpf), 246, 239);
  fv(agent.dataNascimento, 343, 252); fv(agent.tipoSanguineo, 316, 266);
  fv(agent.nacionalidade, 313, 279); fv(agent.naturalidadeUf, 320, 292);
  fv(agent.dataExpedicao, 312, 319); fv(agent.validade, 467, 319);

  const qrDataUrl = await QRCode.toDataURL(buildConsultaUrl(agent), {
    width: 300, margin: 1, errorCorrectionLevel: "L", color: { dark: "#000000", light: "#ffffff" },
  });
  const qrSize = px2mm(s(84));
  pdf.addImage(qrDataUrl, "PNG", px2mm(s(521)) - qrSize / 2, px2mm(s(264)) - qrSize / 2, qrSize, qrSize);

  pdf.addPage([86, 54], "landscape");
  const bOrigH = IMG_H - BACK_Y_ORIG;
  pdf.addImage(cropCanvas(modelo, 0, BACK_Y_ORIG, IMG_W, bOrigH).toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 86, 54);

  pdf.setFont("courier", "bold");
  pdf.setFontSize(FIELD_PT);
  pdf.setTextColor(17, 17, 17);
  fv(agent.equipamentoTipo, 121, 89); fv(agent.equipamentoMarca, 140, 104); fv(agent.equipamentoNrSerie, 173, 120);

  pdf.setFont("courier", "bold");
  pdf.setFontSize(AUTH_PT);
  const authX = px2mm(s(72));
  pdf.text("DIEX Nº 3050-SPRODAI/4 SCH/EME", authX, px2mm(s(167)), { baseline: "top" });
  pdf.text("EB 64535.090782/2024-91", authX, px2mm(s(180)), { baseline: "top" });
  pdf.text("EB 64285.005156/2024-04", authX, px2mm(s(193)), { baseline: "top" });

  pdf.save(`carteirinha_${agent.nome.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
export function CarteirinhaPreview({ agent }: CarteirinhaPreviewProps) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef  = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      // ── Font sizes (display px → mm → pt) ─────────────────────────────────
      const FIELD_PT = px2mm(7.5) * 2.835; // ≈ 5.6 pt
      const NAME_PT  = px2mm(10)  * 2.835; // ≈ 7.5 pt
      const AUTH_PT  = px2mm(8.5) * 2.835; // ≈ 6.4 pt

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [86, 54] });

      // ── Load template PNG at native resolution ────────────────────────────
      const modelo = await loadImg("/modelo.png");

      // ── FRENTE ────────────────────────────────────────────────────────────
      // Crop rows 0–387 from the 617×801 original (front half of the card)
      const fOrigH = Math.round(H / SCALE); // 387 px
      pdf.addImage(
        cropCanvas(modelo, 0, 0, IMG_W, fOrigH).toDataURL("image/jpeg", 1.0),
        "JPEG", 0, 0, 86, 54,
      );

      // Agent photo: cover-cropped at 3× display resolution for sharpness
      // Photo box inner white area in original px: x=49, y=127, w=140, h=185
      if (agent.foto) {
        const photoImg = await loadImg(agent.foto);
        const phW = s(140) * 3;
        const phH = s(185) * 3;
        pdf.addImage(
          coverCrop(photoImg, phW, phH).toDataURL("image/jpeg", 0.93),
          "JPEG",
          px2mm(s(49)),  px2mm(s(127)),
          px2mm(s(140)), px2mm(s(185)),
        );
      }

      // Nome — centered in the black bar (orig y=170–202, right of photo x=189–616)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(NAME_PT);
      pdf.setTextColor(255, 255, 255);
      if (agent.nome)
        pdf.text(
          agent.nome.toUpperCase(),
          px2mm(s(403)), px2mm(s(186)),
          { align: "center", baseline: "middle" },
        );

      // Nº Funcional — centred over photo box x=49–189, bar y=313–348 (centre 119,330)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(px2mm(10) * 2.835);
      pdf.setTextColor(255, 255, 255);
      if (agent.funcional)
        pdf.text(
          `Nº ${agent.funcional}`,
          px2mm(s(119)), px2mm(s(334)),
          { align: "center", baseline: "middle" },
        );

      // Field values (dark, courier monospace — matches template style)
      pdf.setFont("courier", "bold");
      pdf.setFontSize(FIELD_PT);
      pdf.setTextColor(17, 17, 17);

      // fv(value, orig_x, orig_y_center) — y is the vertical centre of the label row
      const fv = (v: string | undefined, ox: number, oy: number) => {
        if (v) pdf.text(v, px2mm(s(ox)), px2mm(s(oy)), { baseline: "middle" });
      };

      fv(agent.matricula,      290, 226);
      fv(formatCPF(agent.cpf), 246, 239);
      fv(agent.dataNascimento, 343, 252);
      fv(agent.tipoSanguineo,  316, 266);
      fv(agent.nacionalidade,  313, 279);
      fv(agent.naturalidadeUf, 320, 292);
      fv(agent.dataExpedicao,  312, 319);
      fv(agent.validade,       467, 319);

      // QR code — blank space orig centre (550,267), size=68
      // Photo is excluded from QR to stay within capacity limits
      const qrDataUrl = await QRCode.toDataURL(buildConsultaUrl(agent), {
        width: 300, margin: 1, errorCorrectionLevel: "L",
        color: { dark: "#000000", light: "#ffffff" },
      });
      const qrSize = px2mm(s(84));
      pdf.addImage(qrDataUrl, "PNG",
        px2mm(s(521)) - qrSize / 2, px2mm(s(264)) - qrSize / 2,
        qrSize, qrSize);

      // ── VERSO ─────────────────────────────────────────────────────────────
      pdf.addPage([86, 54], "landscape");

      // Crop rows 414–801 from original (back half)
      const bOrigH = IMG_H - BACK_Y_ORIG; // 387 px
      pdf.addImage(
        cropCanvas(modelo, 0, BACK_Y_ORIG, IMG_W, bOrigH).toDataURL("image/jpeg", 1.0),
        "JPEG", 0, 0, 86, 54,
      );

      pdf.setFont("courier", "bold");
      pdf.setFontSize(FIELD_PT);
      pdf.setTextColor(17, 17, 17);

      // Verso y-values are relative to back-card top (same coord space as CardBack)
      fv(agent.equipamentoTipo,    121,  89);
      fv(agent.equipamentoMarca,   140, 104);
      fv(agent.equipamentoNrSerie, 173, 120);

      // Authorization lines (fixed text, monospaced)
      pdf.setFont("courier", "bold");
      pdf.setFontSize(AUTH_PT);
      const authX = px2mm(s(72));
      pdf.text("DIEX Nº 3050-SPRODAI/4 SCH/EME", authX, px2mm(s(167)), { baseline: "top" });
      pdf.text("EB 64535.090782/2024-91",         authX, px2mm(s(180)), { baseline: "top" });
      pdf.text("EB 64285.005156/2024-04",          authX, px2mm(s(193)), { baseline: "top" });

      pdf.save(`carteirinha_${agent.nome.replace(/\s+/g, "_").toLowerCase()}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <Button
        onClick={exportPDF}
        disabled={isExporting}
        className="gap-2 font-bold bg-yellow-500 hover:bg-yellow-400 text-black px-6"
        data-testid="button-export-pdf"
      >
        <Download className="w-4 h-4" />
        {isExporting ? "Gerando PDF..." : "Exportar PDF"}
      </Button>

      <div className="flex gap-8 flex-wrap justify-center">
        <CardLabel label="Frente">
          <CardFront ref={frontRef} agent={agent} />
        </CardLabel>
        <CardLabel label="Verso">
          <CardBack ref={backRef} agent={agent} />
        </CardLabel>
      </div>

      <p className="text-xs text-muted-foreground">86 × 54 mm — cartão PVC padrão</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CardLabel wrapper
// ─────────────────────────────────────────────────────────────────────────────
function CardLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div
        className="shadow-2xl rounded-[3px] overflow-hidden border border-gray-700"
        style={{ width: W, height: H }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FRENTE (browser preview only — PDF is generated via Canvas/jsPDF directly)
// ─────────────────────────────────────────────────────────────────────────────
function CardFrontRender(
  { agent }: { agent: Agent },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const qrLeft = Math.round(s(521) - s(84) / 2);
  const qrTop  = Math.round(s(264) - s(84) / 2);
  return (
    <div ref={ref} style={{ width: W, height: H, position: "relative", overflow: "hidden",
      fontFamily: "Arial, Helvetica, sans-serif" }}>

      <img src="/modelo.png" alt="" aria-hidden="true"
        style={{ position: "absolute", left: 0, top: 0,
          width: W, height: Math.round(IMG_H * SCALE),
          objectFit: "fill", userSelect: "none", pointerEvents: "none" }}
      />

      {/* Photo box — inner white area: orig x=49, y=127, w=140, h=185 */}
      <div style={{
        position: "absolute",
        left: s(49), top: s(127),
        width: s(140), height: s(185),
        overflow: "hidden",
        backgroundColor: "#c8cfd6",
      }}>
        {agent.foto ? (
          <div style={{
            width: "100%", height: "100%",
            backgroundImage: `url(${agent.foto})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#555", fontSize: 10, fontWeight: 600,
          }}>
            FOTO
          </div>
        )}
      </div>

      {/* Nome — black bar y=170–202 orig, right of photo x=189–616 */}
      <div style={{
        position: "absolute",
        left: s(189), top: s(170),
        width: s(617 - 189), height: s(32),
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: 9.5, fontWeight: 900, color: "#fff",
          textTransform: "uppercase", whiteSpace: "nowrap",
          letterSpacing: "0.02em",
        }}>
          {agent.nome}
        </span>
      </div>

      {/* Nº Funcional — black bar below photo, x=49–189 cx=119, y=321–348 cy=334 */}
      <div style={{
        position: "absolute",
        left: s(49), top: s(321),
        width: s(140), height: s(27),
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 900, color: "#fff",
          fontFamily: "Arial, Helvetica, sans-serif",
          letterSpacing: "0.05em",
        }}>
          Nº {agent.funcional}
        </span>
      </div>

      {/* QR code — blank space orig centre (550,267), size=68, explicit position */}
      <div style={{
        position: "absolute",
        left: qrLeft, top: qrTop,
        width: s(84), height: s(84),
      }}>
        <QRCodeSVG
          value={buildConsultaUrl(agent)}
          size={s(84)}
          bgColor="#ffffff"
          fgColor="#000000"
          level="L"
          style={{ display: "block" }}
        />
      </div>

      {/* Field values */}
      <Val x={s(290)} y={s(226)}>{agent.matricula}</Val>
      <Val x={s(246)} y={s(239)}>{formatCPF(agent.cpf)}</Val>
      <Val x={s(343)} y={s(252)}>{agent.dataNascimento}</Val>
      <Val x={s(316)} y={s(266)}>{agent.tipoSanguineo}</Val>
      <Val x={s(313)} y={s(279)}>{agent.nacionalidade}</Val>
      <Val x={s(320)} y={s(292)}>{agent.naturalidadeUf}</Val>
      <Val x={s(312)} y={s(319)}>{agent.dataExpedicao}</Val>
      <Val x={s(467)} y={s(319)}>{agent.validade}</Val>
    </div>
  );
}
const CardFront = forwardRef(CardFrontRender);
CardFront.displayName = "CardFront";

// ─────────────────────────────────────────────────────────────────────────────
// VERSO (browser preview)
// ─────────────────────────────────────────────────────────────────────────────
export { CardFront, W, H };

const CardBack = forwardRef<HTMLDivElement, { agent: Agent }>(({ agent }, ref) => (
  <div ref={ref} style={{ width: W, height: H, position: "relative", overflow: "hidden",
    fontFamily: "Arial, Helvetica, sans-serif" }}>

    <img src="/modelo.png" alt="" aria-hidden="true"
      style={{ position: "absolute", left: 0, top: -BACK_Y_OFFSET,
        width: W, height: Math.round(IMG_H * SCALE),
        objectFit: "fill", userSelect: "none", pointerEvents: "none" }}
    />

    <Val x={s(121)} y={s(89)}>{agent.equipamentoTipo}</Val>
    <Val x={s(140)} y={s(104)}>{agent.equipamentoMarca}</Val>
    <Val x={s(173)} y={s(120)}>{agent.equipamentoNrSerie}</Val>

    <Val x={s(72)} y={s(167)} style={{ fontSize: 8.5, fontFamily: "monospace" }}>
      DIEX Nº 3050-SPRODAI/4 SCH/EME
    </Val>
    <Val x={s(72)} y={s(180)} style={{ fontSize: 8.5, fontFamily: "monospace" }}>
      EB 64535.090782/2024-91
    </Val>
    <Val x={s(72)} y={s(193)} style={{ fontSize: 8.5, fontFamily: "monospace" }}>
      EB 64285.005156/2024-04
    </Val>
  </div>
));
CardBack.displayName = "CardBack";
export { CardBack };

// ─────────────────────────────────────────────────────────────────────────────
// Val — absolute text overlay for browser preview
// ─────────────────────────────────────────────────────────────────────────────
function Val({ x, y, style, children }: {
  x: number; y: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      transform: "translateY(-50%)",
      fontSize: 7.5, fontWeight: 700, color: "#111",
      fontFamily: "'Courier New', Courier, monospace",
      lineHeight: 1, whiteSpace: "nowrap",
      ...style,
    }}>
      {children}
    </div>
  );
}
